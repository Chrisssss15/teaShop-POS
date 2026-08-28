// =============================
// PERMISSIONS
// =============================
// FASE 1 authentication. Pure helpers only — no Supabase, no DOM, no state.
// The role -> screen matrix lives here ONCE and is used for both route guards
// and navigation visibility.

import type { Screen } from '../types/navigation'
import type { UserProfile, UserRole } from '../types/user'

/** Every assignable role, in display order. Single source of truth. */
export const USER_ROLES: readonly UserRole[] = ['admin', 'manager', 'staff', 'kitchen']

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value)
}

/**
 * Screens that never require a staff login.
 * - customer : QR ordering flow for guests
 * - pickup   : public in-store pickup status display (order-number board)
 *
 * `payment-test` is intentionally NOT public: the live customer payment flow
 * uses MultiSafepay (external redirect, returns to ?mode=customer). The
 * payment-test screen is now only a staff/admin debug tool.
 */
export const PUBLIC_SCREENS: readonly Screen[] = [
  'customer',
  'pickup',
]

export function isPublicScreen(screen: Screen): boolean {
  return PUBLIC_SCREENS.includes(screen)
}

/** The single source of truth for which role may open which staff screen. */
const ROLE_SCREENS: Record<UserRole, readonly Screen[]> = {
  admin: [
    'pos',
    'pos-product-status',
    'pos-settings',
    'orders',
    'kitchen',
    'order-history',
    'admin',
    'admin-products',
    'admin-sales',
    'admin-day-close',
    'admin-bookkeeper',
    'admin-add-product',
    'admin-add-topping',
    'admin-categories',
    'admin-users',
    'print-preview',
    'payment-test',
  ],
  manager: [
    'pos',
    'pos-product-status',
    'pos-settings',
    'orders',
    'kitchen',
    'order-history',
    // `admin` = the dashboard shell only. Every management shortcut on it is
    // filtered by canAccessScreen(), so a manager sees just sales / day-close /
    // print / order-history. They cannot open product / category / topping /
    // bookkeeper screens.
    'admin',
    'admin-sales',
    'admin-day-close',
    'print-preview',
  ],
  staff: [
    'pos',
    'pos-product-status',
    'orders',
    'order-history',
  ],
  kitchen: [
    'kitchen',
  ],
}

/**
 * Can this profile open this screen?
 * Public screens are always allowed (even without a profile).
 */
export function canAccessScreen(profile: UserProfile | null, screen: Screen): boolean {
  if (isPublicScreen(screen)) return true
  if (screen === 'login') return true
  if (!profile || !profile.is_active) return false

  const allowed = ROLE_SCREENS[profile.role]
  if (!allowed) return false
  return allowed.includes(screen)
}

/** Landing screen right after a successful login, per role. */
export function defaultScreenForRole(role: UserRole): Screen {
  return role === 'kitchen' ? 'kitchen' : 'pos'
}

/** Does this profile have access to at least one admin* screen? (nav visibility) */
export function canAccessAnyAdminScreen(profile: UserProfile | null): boolean {
  if (!profile || !profile.is_active) return false
  const allowed = ROLE_SCREENS[profile.role] ?? []
  return allowed.some((screen) => screen === 'admin' || screen.startsWith('admin-'))
}

/** Human label for a role, used in the account/logout widget. */
export function roleLabel(role: UserRole): string {
  if (role === 'admin') return 'Admin'
  if (role === 'manager') return 'Manager'
  if (role === 'kitchen') return 'Kitchen'
  return 'Staff'
}
