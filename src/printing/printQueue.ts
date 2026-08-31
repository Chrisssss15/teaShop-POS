// =============================
// PRINT QUEUE (Supabase kitchen_labels operations)
// =============================
// Extracted 1:1 from main.ts. Every query keeps the exact same table, columns,
// filters, ordering, status values and conditions as before. These helpers
// return the raw Supabase `{ data, error }` result so the orchestrator
// (kitchenPrintService) keeps its existing error handling unchanged.

import { supabase } from '../lib/supabase'

// --- retry policy (unchanged values) ---------------------------------------
// Maximaal aantal AUTOMATISCHE printpogingen per label (initieel + retries).
// Handmatige retry telt hier niet tegen mee.
export const MAX_AUTO_PRINT_ATTEMPTS = 3
// Per retry-run worden maximaal zoveel failed labels terug naar pending gezet.
export const FAILED_RETRY_BATCH_SIZE = 5
// Failed labels ouder dan dit worden niet meer automatisch geprobeerd.
export const FAILED_RETRY_MAX_AGE_MS = 12 * 60 * 60 * 1000

// --- worker queue reads ---------------------------------------------------
export function fetchPendingLabels() {
  return supabase
    .from('kitchen_labels')
    .select('*')
    .eq('print_status', 'pending')
    .order('created_at', { ascending: true })
}

// Labels die momenteel op 'printing' staan. Gebruikt voor stale-recovery:
// een label dat na een crash tussen claim en printed/failed is blijven hangen.
export function fetchPrintingLabels() {
  return supabase
    .from('kitchen_labels')
    .select('*')
    .eq('print_status', 'printing')
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

// --- stale 'printing' recovery ----------------------------------------------
export function resetStalePrintingLabelToPending(labelId: string) {
  // Conditioneel ('printing' -> 'pending'): raakt NOOIT een label dat een andere
  // tab/worker intussen heeft afgerond (printed/failed). print_attempts blijft
  // ONGEWIJZIGD, zodat de bestaande retry-limiet gerespecteerd blijft.
  return supabase
    .from('kitchen_labels')
    .update({
      print_status: 'pending',
      printed_at: null,
      print_error: null,
    })
    .eq('id', labelId)
    .eq('print_status', 'printing')
    .select('id')
}
