// =============================
// CUSTOMER TRANSLATIONS — SHARED TYPE
// =============================
// One interface every language file (nl.ts / en.ts / zh.ts) must implement
// exactly. A missing, renamed or misspelled key in any language file is a
// compile-time TypeScript error here — not a silent runtime fallback.
//
// Scope: customer-facing UI copy only — the QR/native customer ordering flow
// (Home, Bestellen/menu, product customizer, cart drawer, sticky cart bar,
// checkout, payment result, order status/pickup, bottom navigation, Order
// history and Settings placeholders). Product/topping/category names come
// from the database and are intentionally NOT part of this system. Staff/
// POS/admin/kitchen screens keep their own (untranslated) copy and stay out
// of scope for this map.

import type { IceLevel, SugarLevel } from '../types/product'

export interface CustomerTranslations {
  languageName: string

  // Home tab
  homeWelcomeTitle: string
  homeWelcomeText: string

  // Bestellen / menu header + product grid
  orderTitle: string
  orderSubtitle: string
  chooseDrinks: string
  noProductsFound: string
  soldOut: string

  // Product customizer
  customizeDrink: string
  cupSize: string
  fixed: string
  included: string
  fixedSizeHint: string
  fixedIceHint: string
  required: string
  multiplePossible: string
  iceLevel: string
  sugarLevel: string
  toppings: string
  noToppings: string
  total: string
  chooseIceSugar: string
  addToOrder: string
  edit: string
  saveChanges: string
  productSoldOutSuffix: string
  productUnavailableSuffix: string

  // Cart drawer / sticky cart bar
  yourOrder: string
  viewCart: string
  drink: string
  drinks: string
  emptyCart: string
  emptyCartHint: string
  perItem: string
  remove: string
  continueDetails: string

  // Checkout
  enterDetails: string
  checkoutSubtitle: string
  contactDetails: string
  name: string
  namePlaceholder: string
  phone: string
  phonePlaceholder: string
  paymentMethod: string
  onlinePayment: string
  onlinePaymentHint: string
  payAtCounter: string
  payAtCounterHint: string
  overview: string
  noDrinksChosen: string
  placeOrder: string
  placingOrder: string
  nameRequired: string
  phoneRequired: string
  onlinePaymentStartFailed: string
  paymentStartFailedPrefix: string
  paymentServerInvalidResponse: string

  // Payment result: success / order status / pickup
  orderPlaced: string
  thankYou: string
  pickupCode: string
  status: string
  yourDrinks: string
  loadingDrinks: string
  autoRefresh: string
  newOrder: string
  statusNew: string
  statusPreparing: string
  statusReady: string
  statusCompleted: string
  statusCancelled: string
  msgNew: string
  msgPreparing: string
  msgReady: string
  msgCompleted: string
  msgCancelled: string
  loadingStatus: string
  labelWaiting: string
  labelPreparing: string
  labelFinished: string
  labelCancelled: string

  // Payment result: cancelled
  paymentCancelledTitle: string
  paymentCancelledSubtitle: string
  paymentCancelledText: string
  retryOrder: string

  // Bottom navigation (app-shell tabs)
  navHome: string
  navOrder: string
  navHistory: string
  navSettings: string

  // Order history tab (placeholder subview)
  historyTitle: string
  historyEmptyText: string

  // Settings tab
  settingsTitle: string
  settingsLanguageLabel: string
  settingsAccountPlaceholder: string

  // Modifier value labels (ice/sugar level pickers + summaries)
  iceLevels: Record<IceLevel, string>
  sugarLevels: Record<SugarLevel, string>
}

// Storage/state still uses the historical code 'cn' for Chinese (matches
// existing sessionStorage values and data-customer-language="cn" attributes
// app-wide) — only the language *file* is named zh.ts to match the requested
// languages/ layout. See languages/index.ts for the one line that bridges them.
export type CustomerLanguage = 'nl' | 'en' | 'cn'
