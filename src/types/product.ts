// =============================
// PRODUCT / CART TYPES
// =============================
// Extracted from main.ts. Behaviour unchanged.

export type DiscountType = 'none' | 'percentage' | 'fixed'

export type CupSize = 'medium' | 'large'

export type Product = {
  id: string
  name: string
  category: string
  tea_type: string | null
  temperature_label: string | null
  pos_only: boolean
  product_type: 'drink' | 'item'
  base_price: number
  vat_rate: number
  is_active: boolean
  is_bestseller: boolean
  is_sold_out: boolean
  image_url: string | null
  discount_type: DiscountType
  discount_value: number
  qr_product_code: string | null

  available_sizes: CupSize[]
  medium_price: number | null
  large_price: number | null

  allow_ice_customization: boolean
  allowed_ice_levels: IceLevel[]
  medium_allowed_ice_levels: IceLevel[] | null
  large_allowed_ice_levels: IceLevel[] | null
  default_ice_level: IceLevel | null

  allow_sugar_customization: boolean
  allowed_sugar_levels: SugarLevel[]
}

export type Topping = {
  id: string
  name: string
  price: number
  is_active: boolean
  is_sold_out: boolean
}

export type ProductToppingLink = {
  product_id: string
  topping_id: string
}

export type Category = {
  id: string
  name: string
  is_active: boolean
  discount_type: DiscountType
  discount_value: number
  sort_order: number
  created_at?: string | null
}

export type IceLevel =
  | 'no_ice'
  | 'less_ice'
  | 'normal_ice'
  | 'warm'
  | 'extra_ice'

export type SugarLevel = 'none' | 'minimal' | 'less' | 'normal' | 'sweet'

export type SelectedTopping = {
  id: string
  name: string
  price: number
}

export type CartItem = {
  cartItemId: string
  product: Product
  quantity: number
  cupSize: CupSize
  iceLevel: IceLevel
  sugarLevel: SugarLevel
  toppings: SelectedTopping[]
}

export type SavedCartItem = {
  cartItemId: string
  productId: string
  quantity: number
  cupSize?: CupSize
  iceLevel: IceLevel
  sugarLevel: SugarLevel
  toppings: SelectedTopping[]
}
