// =============================
// AUTH SERVICE
// =============================
// FASE 1 authentication. Thin wrappers around the existing Supabase client.
//
// Rules (same as the other services):
//   - may use Supabase, return data, throw errors
//   - must NOT import main.ts, touch global app state, call render() or the DOM

import { supabase } from '../lib/supabase'
import type { Session, UserProfile, UserRole } from '../types/user'

const VALID_ROLES: UserRole[] = ['admin', 'manager', 'staff', 'kitchen', 'display']

export type MfaStatus = {
  currentLevel: string | null
  nextLevel: string | null
  verifiedTotpFactorId: string | null
}

export type TotpEnrollment = {
  factorId: string
  qrCode: string
  secret: string
}

/** Current Supabase session (or null when nobody is logged in). */
export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

/** Sign a staff member in with email + password. Throws on invalid credentials. */
export async function signIn(email: string, password: string): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) throw error
  if (!data.session) {
    throw new Error('Geen sessie ontvangen na inloggen.')
  }
  return data.session
}

/** Sign the current user out. */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Return the current session's assurance level and a verified TOTP factor.
 * A verified factor still needs a fresh challenge after a new password login;
 * only currentLevel === 'aal2' means this session has completed MFA.
 */
export async function getMfaStatus(): Promise<MfaStatus> {
  const [{ data: factors, error: factorsError }, { data: assurance, error: assuranceError }] =
    await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ])

  if (factorsError) throw factorsError
  if (assuranceError) throw assuranceError

  return {
    currentLevel: assurance.currentLevel,
    nextLevel: assurance.nextLevel,
    verifiedTotpFactorId: factors.totp[0]?.id ?? null,
  }
}

/**
 * Start first-time TOTP setup. Stale, unverified setup attempts are removed so
 * the user cannot accidentally accumulate unusable factors.
 */
export async function startTotpEnrollment(): Promise<TotpEnrollment> {
  const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
  if (factorsError) throw factorsError

  if (factors.totp.length > 0) {
    throw new Error('Er is al een authenticator gekoppeld aan dit account.')
  }

  const staleTotpFactors = factors.all.filter(
    (factor) => factor.factor_type === 'totp' && factor.status === 'unverified'
  )

  for (const factor of staleTotpFactors) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
    if (error) throw error
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Blue Cup POS',
    issuer: 'Blue Cup',
  })

  if (error) throw error
  if (data.type !== 'totp') {
    throw new Error('De authenticator kon niet worden ingesteld.')
  }

  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  }
}

/** Verify a six-digit TOTP code and promote the current session to AAL2. */
export async function verifyTotpCode(factorId: string, code: string): Promise<void> {
  if (!factorId) throw new Error('Geen authenticator gevonden.')
  if (!/^\d{6}$/.test(code)) throw new Error('Vul de code van 6 cijfers in.')

  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  })
  if (error) throw error
}

/**
 * Load the staff profile row for a Supabase auth user.
 * Returns null when the auth user has no matching row in public.profiles.
 */
export async function fetchCurrentProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, is_active, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const role = VALID_ROLES.includes(data.role as UserRole)
    ? (data.role as UserRole)
    : 'staff'

  return {
    id: String(data.id),
    full_name: String(data.full_name ?? ''),
    role,
    is_active: data.is_active !== false,
    created_at: data.created_at ?? null,
  }
}
