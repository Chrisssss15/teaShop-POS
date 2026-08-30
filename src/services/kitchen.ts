// =============================
// KITCHEN LABEL SERVICES
// =============================
// Pure Supabase data-access for the kitchen-label domain. Extracted 1:1 from
// main.ts — same tables, columns, filters, ordering and status values.
//
// Read helpers return data (or throw the Supabase error). Mutation helpers
// return the Supabase query builder so the caller keeps its exact existing
// { error } handling, message text, render() and screen checks in main.ts.
// This module has NO global state, no render(), no realtime side effects.
// The automatic Zebra print worker stays in ./kitchenPrintService.ts.

import { supabase } from '../lib/supabase'
import type { KitchenLabel, LabelStatus } from '../types/kitchen'

/** Open kitchen labels for the Kitchen screen (status new / preparing). */
export async function fetchOpenKitchenLabels(): Promise<KitchenLabel[]> {
  const { data, error } = await supabase
    .from('kitchen_labels')
    .select('*')
    .in('status', ['new', 'preparing'])
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as KitchenLabel[]
}

/** All kitchen labels of one order (used by the customer progress screen). */
export async function fetchKitchenLabelsForOrder(
  orderId: string
): Promise<KitchenLabel[]> {
  const { data, error } = await supabase
    .from('kitchen_labels')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as KitchenLabel[]
}

/** Just the label statuses of one order (used to derive the order status). */
export async function fetchKitchenLabelStatuses(
  orderId: string
): Promise<{ status: LabelStatus }[]> {
  const { data, error } = await supabase
    .from('kitchen_labels')
    .select('status')
    .eq('order_id', orderId)

  if (error) throw error
  return (data ?? []) as { status: LabelStatus }[]
}

/** Update one kitchen label by id. */
export function updateKitchenLabel(
  labelId: string,
  fields: Record<string, string | null>
) {
  return supabase
    .from('kitchen_labels')
    .update(fields)
    .eq('id', labelId)
}

/** Cancel every not-yet-cancelled label of an order (order-cancel flow). */
export function cancelOpenKitchenLabelsForOrder(
  orderId: string,
  cancelledAt: string
) {
  return supabase
    .from('kitchen_labels')
    .update({
      status: 'cancelled',
      cancelled_at: cancelledAt,
    })
    .eq('order_id', orderId)
    .neq('status', 'cancelled')
}

/** Put an order's `done` labels back to `preparing` (ready -> preparing revert). */
export function revertDoneKitchenLabelsToPreparing(orderId: string, now: string) {
  return supabase
    .from('kitchen_labels')
    .update({
      status: 'preparing',
      started_at: now,
      done_at: null,
    })
    .eq('order_id', orderId)
    .eq('status', 'done')
}

/** Bulk-update an order's still-open labels (new/preparing) — whole-order action. */
export function updateOpenKitchenLabelsForOrder(
  orderId: string,
  fields: Record<string, string>
) {
  return supabase
    .from('kitchen_labels')
    .update(fields)
    .eq('order_id', orderId)
    .in('status', ['new', 'preparing'])
}
