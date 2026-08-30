// =============================
// PRINT QUEUE (Supabase kitchen_labels operations)
// =============================
// Extracted 1:1 from main.ts. Every query keeps the exact same table, columns,
// filters, ordering, status values and conditions as before. These helpers
// return the raw Supabase `{ data, error }` result so the orchestrator
// (kitchenPrintService) keeps its existing error handling unchanged.

import { supabase } from '../lib/supabase'
import type { OrderItem } from '../types/order'
import type { Product } from '../types/product'

// --- retry policy (unchanged values) ---------------------------------------
// Maximaal aantal AUTOMATISCHE printpogingen per label (initieel + retries).
// Handmatige retry telt hier niet tegen mee.
export const MAX_AUTO_PRINT_ATTEMPTS = 3
// Per retry-run worden maximaal zoveel failed labels terug naar pending gezet.
export const FAILED_RETRY_BATCH_SIZE = 5
// Failed labels ouder dan dit worden niet meer automatisch geprobeerd.
export const FAILED_RETRY_MAX_AGE_MS = 12 * 60 * 60 * 1000

// --- worker queue reads ---------------------------------------------------
export function fetchExistingPendingLabelIds() {
  return supabase
    .from('kitchen_labels')
    .select('id')
    .eq('print_status', 'pending')
}

export function fetchPendingLabels() {
  return supabase
    .from('kitchen_labels')
    .select('*')
    .eq('print_status', 'pending')
    .order('created_at', { ascending: true })
}

export function fetchLabelsForOrder(orderId: string) {
  return supabase
    .from('kitchen_labels')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })
}

export function fetchOrdersByIds(orderIds: string[]) {
  return supabase
    .from('orders')
    .select('*')
    .in('id', orderIds)
}

// --- worker status transitions ------------------------------------------
export function claimPendingLabel(labelId: string, nextAttempts: number) {
  // Atomisch claimen: alleen een label dat nog pending is mag worden opgepakt.
  return supabase
    .from('kitchen_labels')
    .update({
      print_status: 'printing',
      print_attempts: nextAttempts,
      printed_at: null,
      print_error: null,
    })
    .eq('id', labelId)
    .eq('print_status', 'pending')
    .select('*')
}

export function markLabelPrinted(labelId: string) {
  return supabase
    .from('kitchen_labels')
    .update({
      print_status: 'printed',
      printed_at: new Date().toISOString(),
      print_error: null,
    })
    .eq('id', labelId)
    .eq('print_status', 'printing')
}

export function markLabelFailed(labelId: string, errorMessage: string) {
  return supabase
    .from('kitchen_labels')
    .update({
      print_status: 'failed',
      printed_at: null,
      print_error: errorMessage,
    })
    .eq('id', labelId)
}

// --- failed-label retry -------------------------------------------------
export function fetchFailedLabelsForRetry() {
  return supabase
    .from('kitchen_labels')
    .select('*')
    .eq('print_status', 'failed')
    .lt('print_attempts', MAX_AUTO_PRINT_ATTEMPTS)
    .order('created_at', { ascending: true })
    .limit(FAILED_RETRY_BATCH_SIZE)
}

export function requeueFailedLabelToPending(labelId: string) {
  // Conditionele update ('failed' -> 'pending') voorkomt dubbele reset/print.
  return supabase
    .from('kitchen_labels')
    .update({
      print_status: 'pending',
      printed_at: null,
      print_error: null,
    })
    .eq('id', labelId)
    .eq('print_status', 'failed')
    .lt('print_attempts', MAX_AUTO_PRINT_ATTEMPTS)
    .select('id')
}

// --- label creation ----------------------------------------------------
/**
 * Split each order item's quantity into one kitchen_labels record per drink.
 * Products met `product_type === 'item'` krijgen bewust GEEN label. Een product
 * dat niet in de catalogus zit krijgt (net als voorheen) wél een label.
 *
 * `getProduct` is meegegeven i.p.v. de globale `products`-array; de logica is
 * verder ongewijzigd. Retourneert `null` bij succes, anders de foutmelding.
 */
export async function createKitchenLabelsForOrder(
  orderId: string,
  orderNumber: string,
  savedItems: OrderItem[],
  getProduct: (productId: string | null | undefined) => Product | undefined
) {
  const labels = []

  for (const item of savedItems) {
    const sourceProduct = getProduct(item.product_id)

    if (sourceProduct?.product_type === 'item') {
      continue
    }

    const quantity = Number(item.quantity ?? 1)
    const productName =
      item.product_name_snapshot ||
      item.product_name ||
      'Onbekend product'

    for (let i = 1; i <= quantity; i++) {
      labels.push({
        order_id: String(orderId),
        order_item_id: item.id ? String(item.id) : null,
        product_id: item.product_id ? String(item.product_id) : null,
        order_number: orderNumber,
        product_name: productName,
        status: 'new',
        label_index: i,
        cup_size: item.cup_size || null,
        ice_level: item.ice_level || null,
        sugar_level: item.sugar_level || null,
        toppings: item.toppings || [],
        print_status: 'pending',
        print_attempts: 0,
        printed_at: null,
        print_error: null,
      })
    }
  }

  if (labels.length === 0) {
    return null
  }

  const { error } = await supabase
    .from('kitchen_labels')
    .insert(labels)

  if (error) {
    console.error('Kitchen labels maken mislukt:', error)
    return error.message
  }

  return null
}
