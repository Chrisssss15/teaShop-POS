// =============================
// USER / AUTH TYPES
// =============================
// FASE 1 authentication. Kept framework-free; only type declarations here.

import type { User, Session } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'manager' | 'staff' | 'kitchen'

export type UserProfile = {
  id: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at?: string | null
}

// FASE 2 — staff account management (admin only).
// One row in the "Medewerkers" list: profile fields + the email that lives in
// auth.users (fetched via the admin-only Edge Function, never read client-side).
export type AdminUserRow = {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at?: string | null
}

export type CreateStaffUserInput = {
  email: string
  password: string
  fullName: string
  role: UserRole
}

// Re-export the Supabase auth primitives so app code has a single import point.
export type { User, Session }
