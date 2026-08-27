// =============================
// PAYMENT TYPES
// =============================
// Extracted from main.ts. Behaviour unchanged.

export type PaymentRecordStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'

export type Payment = {
  id: string
  order_id: string
  provider: string
  provider_order_id?: string | null
  provider_transaction_id?: string | null
  amount: number
  currency: string
  status: PaymentRecordStatus
  payment_method?: string | null
  payment_url?: string | null
  failure_reason?: string | null
  created_at?: string | null
  updated_at?: string | null
  paid_at?: string | null
  failed_at?: string | null
  refund_amount?: number | null
  refund_reason?: string | null
  refunded_at?: string | null
  refunded_by?: string | null
}
