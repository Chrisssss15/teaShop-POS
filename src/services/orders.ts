// =============================
// ORDER SERVICES
// =============================
// Pure Supabase data-access for the order domain. Extracted 1:1 from main.ts
// (the "Orders" screen, "Order history" and the admin order-item reads).
//
// These helpers ONLY talk to Supabase, return data, and throw on error.
// They do NOT touch global state / render() / the DOM / navigation, and they
// do NOT run any payment, kitchen, printing or realtime side effects — those
// stay in main.ts, which remains the orchestrator.
//
// Order creation (submitOrder / submitCustomerOrder), status transitions,
// pickup/kitchen sync, payment-test and the print worker are deliberately NOT
// here: their Supabase calls are interleaved with payment / kitchen-label /
// Epson / cash-movement / audit logic and cannot be moved without changing
// behaviour.

import { supabase, customerSupabase } from '../lib/supabase'
import type { Order, OrderItem, OrderStatus } from '../types/order'

/**
 * All orders created within a given ISO datetime window, newest first.
 * Same query used by both the Orders screen and Order history in main.ts.
 * Throws the Supabase error on failure (caller decides how to surface it).
 */
export async function fetchTodayOrders(
  startIso: string,
  endIso: string
): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', startIso)
    .lt('created_at', endIso)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Order[]
}

export type PickupBoardRow = {
  id: string
  order_number: string | null
  pickup_code: string | null
  status: OrderStatus
  created_at: string | null
}

/**
 * Today's active pickup orders via the `get_pickup_board` RPC.
 * The `display` role can no longer SELECT public.orders directly (Stap 5
 * security), so the in-store pickup board reads through this RPC instead of
 * fetchTodayOrders(). Returns only id / order_number / pickup_code / status /
 * created_at. Throws the Supabase error on failure.
 */
export async function fetchPickupBoard(): Promise<PickupBoardRow[]> {
  const { data, error } = await supabase.rpc('get_pickup_board')

  if (error) throw error
  return (data ?? []) as PickupBoardRow[]
}

/**
 * All order_items belonging to the given order ids.
 * Returns [] for an empty id list (no query fired) — matching the original
 * main.ts behaviour. Throws the Supabase error on failure.
 */
export async function fetchOrderItemsForOrders(
  orderIds: readonly string[]
): Promise<OrderItem[]> {
  if (orderIds.length === 0) return []

  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', orderIds as string[])

  if (error) throw error
  return (data ?? []) as OrderItem[]
}

// --- status transitions -----------------------------------------------------
// These return the Supabase query builder so callers in main.ts keep their
// exact { error } handling, message text and screen-dependent reloads.

/** Update fields on a single order row. */
export function updateOrderFields(
  orderId: string,
  fields: Record<string, string | null>
) {
  return supabase
    .from('orders')
    .update(fields)
    .eq('id', orderId)
}

/** Insert one audit-log row (used by the order-cancel flow). */
export function insertAuditLog(entry: Record<string, unknown>) {
  return supabase
    .from('audit_logs')
    .insert(entry)
}

// --- customer / QR status read -------------------------------------------

export type CustomerOrderStatusRow = {
  id: string
  status: OrderStatus
  pickup_code: string | null
  created_at: string | null
}

/**
 * Status of one customer order via the `get_customer_order_status` RPC.
 * The anonymous customer/QR flow uses this instead of a direct `orders`
 * SELECT, via the session-less `customerSupabase` client so een ingelogde
 * staff-sessie de call niet als `authenticated` uitvoert. The RPC returns at
 * most one row (array or single object). Throws the Supabase error; returns
 * null when no row is found.
 */
export async function fetchCustomerOrderStatus(
  orderId: string
): Promise<CustomerOrderStatusRow | null> {
  const { data, error } = await customerSupabase.rpc('get_customer_order_status', {
    p_order_id: orderId,
  })

  if (error) throw error

  const row = Array.isArray(data) ? data[0] : data
  return (row ?? null) as CustomerOrderStatusRow | null
}
