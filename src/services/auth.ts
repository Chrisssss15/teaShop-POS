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
