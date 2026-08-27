// =============================
// PURE MONEY HELPERS
// =============================
// Extracted from main.ts (FASE 2). Pure functions only — no global state,
// no DOM. Behaviour is identical to the originals.

import type { DiscountType } from '../types/product'

// Prices in the POS are stored and shown including VAT.
export function roundMoney(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

export function calculateDiscountPreviewPrice(
  originalPrice: number,
  discountType: DiscountType,
  discountValue: number
) {
  const safePrice = Math.max(0, Number(originalPrice) || 0)
  const safeValue = Math.max(0, Number(discountValue) || 0)

  if (discountType === 'percentage') {
    const percentage = Math.min(100, safeValue)
    return Math.max(0, safePrice - safePrice * (percentage / 100))
  }

  if (discountType === 'fixed') {
    return Math.max(0, safePrice - safeValue)
  }

  return safePrice
}

export function moneyToCents(value: number | null | undefined) {
  return Math.round(Number(value ?? 0) * 100)
}

export function centsToCsvMoney(value?: number | null) {
  return (Number(value ?? 0) / 100).toFixed(2).replace('.', ',')
}
