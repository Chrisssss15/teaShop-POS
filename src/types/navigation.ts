// =============================
// NAVIGATION / SCREEN TYPES
// =============================
// Extracted from main.ts so that route-guard / permission helpers can share
// the same Screen union without importing main.ts (avoids circular imports).
// `login` was added for the FASE 1 authentication work.
// `admin-users` was added for the FASE 2 staff-account management (admin only).

export type Screen =
  | 'login'
  | 'pos'
  | 'pos-product-status'
  | 'pos-settings'
  | 'orders'
  | 'kitchen'
  | 'customer'
  | 'pickup'
  | 'order-history'
  | 'admin'
  | 'admin-products'
  | 'admin-sales'
  | 'admin-day-close'
  | 'admin-bookkeeper'
  | 'admin-add-product'
  | 'admin-add-topping'
  | 'admin-categories'
  | 'admin-users'
  | 'print-preview'
  | 'payment-test'
