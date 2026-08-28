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

// Re-export the Supabase auth primitives so app code has a single import point.
export type { User, Session }
