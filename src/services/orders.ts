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

import { supabase } from '../lib/supabase'
import type { Order, OrderItem } from '../types/order'

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
