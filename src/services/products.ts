// =============================
// PRODUCT CATALOG SERVICES
// =============================
// Extracted from main.ts (FASE 3). These are thin Supabase queries that
// return data (or throw the Supabase error). They own NO global state and
// do NOT call render() — main.ts stays the orchestrator.

import { supabase } from '../lib/supabase'
import type {
  Product,
  Topping,
  ProductToppingLink,
  Category,
} from '../types/product'

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as Product[]
}

export async function fetchToppings(): Promise<Topping[]> {
  const { data, error } = await supabase
    .from('toppings')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as Topping[]
}

export async function fetchProductToppingLinks(): Promise<ProductToppingLink[]> {
  const { data, error } = await supabase
    .from('product_toppings')
    .select('product_id,topping_id')

  if (error) throw error
  return (data ?? []) as ProductToppingLink[]
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as Category[]
}
