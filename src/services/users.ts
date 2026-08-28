// =============================
// STAFF USERS SERVICE (FASE 2 — admin only)
// =============================
// Same rules as the other services:
//   - may use the shared Supabase client, return data, throw errors
//   - must NOT import main.ts, touch global app state, call render() or the DOM
//   - contains NO service-role key (that lives only in the Edge Function secret)
//
// list + create go through the admin-only `admin-users` Edge Function
// (it needs the service role to read auth.users emails / call auth.admin).
// role + is_active changes are plain table updates, guarded server-side by the
// "Admins can update profiles" RLS policy (see supabase/auth_admin_users.sql).

import { supabase } from '../lib/supabase'
import type { AdminUserRow, CreateStaffUserInput, UserRole } from '../types/user'
import { isUserRole } from '../utils/permissions'

const EDGE_FUNCTION = 'admin-users'

/** Full staff list including email — via the admin-only Edge Function. */
export async function fetchStaffUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION, {
    body: { action: 'list' },
  })
  if (error) throw await toEdgeError(error, 'Medewerkers ophalen mislukt.')
  return (data?.users ?? []) as AdminUserRow[]
}

/** Create a staff auth user + profile row — via the admin-only Edge Function. */
export async function createStaffUser(input: CreateStaffUserInput): Promise<AdminUserRow> {
  if (!isUserRole(input.role)) throw new Error('Ongeldige rol.')

  const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION, {
    body: {
      action: 'create',
      email: input.email.trim(),
      password: input.password,
      fullName: input.fullName.trim(),
      role: input.role,
    },
  })
  if (error) throw await toEdgeError(error, 'Account aanmaken mislukt.')
  return data.user as AdminUserRow
}

/** Change a profile's role. Allowed only for admins by RLS. */
export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  if (!isUserRole(role)) throw new Error('Ongeldige rol.')

  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select('id')

  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error('Rol wijzigen niet toegestaan of medewerker niet gevonden.')
  }
}

/** Activate / deactivate a profile. Allowed only for admins by RLS. */
export async function setUserActive(userId: string, isActive: boolean): Promise<void> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId)
    .select('id')

  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error('Status wijzigen niet toegestaan of medewerker niet gevonden.')
  }
}

// supabase.functions.invoke wraps a non-2xx response in an error whose `context`
// is the raw Response. Our Edge Function returns { error: "<dutch message>" }.
async function toEdgeError(error: unknown, fallback: string): Promise<Error> {
  const err = error as { context?: Response; message?: string }
  try {
    if (err?.context && typeof err.context.json === 'function') {
      const body = await err.context.json()
      if (body?.error) return new Error(String(body.error))
    }
  } catch {
    // ignore — fall through
  }
  return new Error(err?.message || fallback)
}
