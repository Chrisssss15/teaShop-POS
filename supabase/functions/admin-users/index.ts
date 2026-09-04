// =============================================================================
// Edge Function: admin-users
// FASE 2 — staff account management. Admin-only.
//
// Actions (POST JSON body):
//   { "action": "list" }
//       -> { users: AdminUserRow[] }  (profile fields + email from auth.users)
//   { "action": "create", email, password, fullName, role }
//       -> { user: AdminUserRow }
//
// SECURITY MODEL
//   - The function NEVER trusts the request body for permissions.
//   - It validates the caller's JWT, loads THAT user's profile with the
//     service-role key, and requires role === 'admin' && is_active === true
//     BEFORE performing any privileged action.
//   - The service-role key is only ever read from the Deno env (Edge Function
//     secret). It is never returned to the client.
//
// Deploy:   supabase functions deploy admin-users
// Secrets:  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically
//           by the Supabase platform — no manual secret setup is normally needed.
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.108.2'

const MAX_BODY_BYTES = 16 * 1024

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ALLOWED_ROLES = ['admin', 'manager', 'staff', 'kitchen', 'display']
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  const contentLength = Number(req.headers.get('Content-Length') || 0)
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json({ error: 'Aanvraag is te groot.' }, 413)
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json({ error: 'Server niet correct geconfigureerd.' }, 500)
  }

  // --- 1. Identify the caller from their bearer token -----------------------
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Niet ingelogd.' }, 401)

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData?.user) {
    return json({ error: 'Ongeldige of verlopen sessie.' }, 401)
  }
  const callerId = userData.user.id

  // --- 2. Require an ACTIVE ADMIN profile (never from the request body) -----
  const { data: callerProfile, error: profErr } = await admin
    .from('profiles')
    .select('role, is_active')
    .eq('id', callerId)
    .maybeSingle()

  if (profErr) return json({ error: 'Profiel controleren mislukt.' }, 500)
  if (!callerProfile || callerProfile.role !== 'admin' || callerProfile.is_active !== true) {
    return json({ error: 'Alleen een actieve admin mag dit doen.' }, 403)
  }

  // --- 3. Parse body & dispatch -------------------------------------------
  let rawBody: string
  try {
    rawBody = await req.text()
  } catch {
    return json({ error: 'Aanvraag kon niet worden gelezen.' }, 400)
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return json({ error: 'Aanvraag is te groot.' }, 413)
  }

  let body: Record<string, unknown>
  try {
    const parsed = JSON.parse(rawBody)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('not an object')
    }
    body = parsed as Record<string, unknown>
  } catch {
    return json({ error: 'Ongeldige aanvraag.' }, 400)
  }

  const action = String(body.action ?? '')

  if (action === 'list') return await listUsers(admin)
  if (action === 'create') return await createStaffUser(admin, body)

  return json({ error: 'Onbekende actie.' }, 400)
})

// deno-lint-ignore no-explicit-any
async function listUsers(admin: any): Promise<Response> {
  const { data: profiles, error: pErr } = await admin
    .from('profiles')
    .select('id, full_name, role, is_active, created_at')

  if (pErr) return json({ error: 'Profielen ophalen mislukt.' }, 500)

  // Emails live in auth.users — page through the admin list.
  const emailById = new Map<string, string>()
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) return json({ error: 'Gebruikerslijst ophalen mislukt.' }, 500)
    // deno-lint-ignore no-explicit-any
    const pageUsers: any[] = (data?.users ?? (Array.isArray(data) ? data : [])) ?? []
    for (const u of pageUsers) emailById.set(u.id, u.email ?? '')
    if (pageUsers.length < 200) break
  }

  // deno-lint-ignore no-explicit-any
  const users = (profiles ?? []).map((p: any) => ({
    id: p.id,
    email: emailById.get(p.id) ?? '',
    full_name: p.full_name ?? '',
    role: p.role,
    is_active: p.is_active !== false,
    created_at: p.created_at ?? null,
  }))

  users.sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1
    return String(a.full_name).localeCompare(String(b.full_name))
  })

  return json({ users })
}

// deno-lint-ignore no-explicit-any
async function createStaffUser(admin: any, body: Record<string, unknown>): Promise<Response> {
  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')
  const fullName = String(body.fullName ?? '').trim()
  const role = String(body.role ?? '')

  if (!EMAIL_RE.test(email)) return json({ error: 'Ongeldig e-mailadres.' }, 400)
  if (email.length > 254) return json({ error: 'E-mailadres is te lang.' }, 400)
  if (password.length < 12 || password.length > 128) {
    return json({ error: 'Wachtwoord moet 12 tot 128 tekens zijn.' }, 400)
  }
  if (!fullName || fullName.length > 100) return json({ error: 'Vul een geldige naam in.' }, 400)
  if (!ALLOWED_ROLES.includes(role)) return json({ error: 'Ongeldige rol.' }, 400)

  // 1. create the auth user (email pre-confirmed: admin-created staff account)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (createErr || !created?.user) {
    const message = createErr?.message ?? 'Auth-gebruiker aanmaken mislukt.'
    const status = /already registered|exists/i.test(message) ? 409 : 400
    return json({ error: message }, status)
  }

  const newId = created.user.id

  // 2. create the matching profile row
  const { error: insertErr } = await admin.from('profiles').insert({
    id: newId,
    full_name: fullName,
    role,
    is_active: true,
  })

  if (insertErr) {
    // 3. roll back so we don't leave a half account behind
    await admin.auth.admin.deleteUser(newId).catch(() => {})
    return json({ error: `Profiel aanmaken mislukt: ${insertErr.message}` }, 500)
  }

  return json({
    user: {
      id: newId,
      email,
      full_name: fullName,
      role,
      is_active: true,
      created_at: created.user.created_at ?? null,
    },
  })
}
