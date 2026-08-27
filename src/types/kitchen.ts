// =============================
// KITCHEN LABEL TYPES
// =============================
// Extracted from main.ts. Behaviour unchanged.

import type { CupSize, IceLevel, SugarLevel, SelectedTopping } from './product'

export type LabelStatus = 'new' | 'preparing' | 'done' | 'cancelled'

export type PrintStatus = 'pending' | 'printing' | 'printed' | 'failed'

export type KitchenLabel = {
  id: string
  order_id: string
  order_item_id?: string | null
  product_id?: string | null
  order_number?: string | null
  product_name: string
  status: LabelStatus
  label_index: number
  cup_size?: CupSize | null
  ice_level?: IceLevel | null
  sugar_level?: SugarLevel | null
  toppings?: SelectedTopping[] | null
  notes?: string | null
  print_status?: PrintStatus | null
  print_attempts?: number | null
  printed_at?: string | null
  print_error?: string | null
  created_at?: string | null
  started_at?: string | null
  done_at?: string | null
  cancelled_at?: string | null
}
