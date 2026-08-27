// =============================
// ORDER TYPES
// =============================
// Extracted from main.ts. Behaviour unchanged.

import type {
  DiscountType,
  CupSize,
  IceLevel,
  SugarLevel,
  SelectedTopping,
} from './product'

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled'

export type OrderFilter = 'all' | 'active' | 'preparation' | 'completed'

export type PaymentStatus =
  | 'unpaid'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'

export type PaymentMethod = 'cash' | 'card' | 'online_fake' | 'pay_at_counter'

export type Order = {
  id: string
  order_number?: string | null
  order_type?: string | null
  channel?: string | null
  status: OrderStatus
  subtotal?: number | null
  total?: number | null
  total_amount?: number | null
  net_total?: number | null
  vat_total?: number | null
  gross_total?: number | null
  payment_status?: PaymentStatus | null
  payment_method?: PaymentMethod | null
  paid_at?: string | null
  customer_session_id?: string | null
  pickup_code?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  created_at?: string | null
  updated_at?: string | null
  completed_at?: string | null
  cancelled_at?: string | null
  cancel_reason?: string | null
  cancelled_by?: string | null
}

export type OrderItem = {
  id?: string
  order_id: string
  product_id?: string | null
  product_name?: string | null
  product_name_snapshot?: string | null
  original_unit_price?: number | null
  unit_price?: number | null
  discount_type_snapshot?: DiscountType | null
  discount_value_snapshot?: number | null
  discount_amount?: number | null
  quantity: number
  line_total?: number | null
  vat_rate?: number | null
  net_amount?: number | null
  vat_amount?: number | null
  gross_amount?: number | null
  cup_size?: CupSize | null
  ice_level?: IceLevel | null
  sugar_level?: SugarLevel | null
  toppings?: SelectedTopping[] | null
}

export type CashSession = {
  id: string
  opened_at: string
  closed_at?: string | null
  opening_amount: number
  expected_amount?: number | null
  counted_amount?: number | null
  difference_amount?: number | null
  opened_by?: string | null
  closed_by?: string | null
  status: string
  created_at?: string | null
}

export type DailyClosing = {
  id: string
  business_date: string
  closed_at: string
  closed_by?: string | null
  cash_session_id?: string | null
  order_count?: number | null
  gross_sales?: number | null
  net_sales?: number | null
  vat_total?: number | null
  cash_sales?: number | null
  card_sales?: number | null
  online_sales?: number | null
  refund_total?: number | null
  cash_in?: number | null
  cash_out?: number | null
  opening_amount?: number | null
  expected_amount?: number | null
  counted_amount?: number | null
  difference_amount?: number | null
  created_at?: string | null
}

export type DailyClosingVat = {
  id?: string
  daily_closing_id: string
  vat_rate: number
  gross_amount: number
  net_amount: number
  vat_amount: number
  created_at?: string | null
}
