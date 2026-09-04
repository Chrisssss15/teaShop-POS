// =============================
// CUSTOMER LANGUAGE MAP
// =============================
// Central home for the customer-facing (QR/native ordering) translation
// system: NL / EN / 中文. Language STATE (which one is active, sessionStorage
// persistence) stays in main.ts (`customerLanguage` / CUSTOMER_LANGUAGE_KEY) —
// this module only owns the copy + a pure lookup, no mutable state, no
// second translation system.

import type { CustomerTranslations, CustomerLanguage } from './types'
import { nl } from './nl'
import { en } from './en'
import { zh } from './zh'

export type { CustomerTranslations, CustomerLanguage }
export { nl, en, zh }

// 'cn' (not 'zh') matches the existing CustomerLanguage code used throughout
// main.ts, sessionStorage and data-customer-language attributes — see the
// note in ./types.ts and ./zh.ts for why the file is named zh.ts anyway.
export const translations: Record<CustomerLanguage, CustomerTranslations> = {
  nl,
  en,
  cn: zh,
}

/**
 * Pure lookup — no state, no side effects. main.ts's own `t(key)` closes over
 * the live `customerLanguage` variable and stays there; this is only used
 * where a whole translations object needs to be passed to a pure-rendering
 * module (e.g. screens/customer/customerNav.ts) that cannot import main.ts's
 * state without creating a circular import.
 */
export function getCustomerTranslations(
  language: CustomerLanguage
): CustomerTranslations {
  return translations[language]
}
