// =============================
// CUSTOMER APP SHELL — bottom navigation (stap 1)
// =============================
// Pure rendering only. Four SUBVIEWS inside the existing `customer` mode
// (native app + ?mode=customer) — deliberately NOT new global modes/screens.
// main.ts owns the `customerTab` state and switches it via goToCustomerTab();
// this module never touches global state, the DOM, Supabase or realtime.
//
// Tab 2 (Bestellen) reuses the existing renderCustomer() menu markup as-is —
// no rendering for it lives here. Home/Order history are plain placeholders
// for this step; no accounts or order-history data yet. Settings received the
// (native-only) language switcher relocated from the header — see
// renderCustomerSettingsTab().
//
// All customer-facing copy comes in via a `CustomerTranslations` object
// (src/languages/) that main.ts resolves from the live `customerLanguage`
// state and passes in — this module never imports main.ts (would be
// circular) and never reads language state itself, only the type.

import type { CustomerTranslations } from '../../languages'

export type CustomerTab = 'home' | 'order' | 'history' | 'settings'

// Icons are static; labels come from `translations` at render time.
const CUSTOMER_NAV_ICON_PATHS: Record<CustomerTab, string> = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V19a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-8.5"/>',
  order:
    '<path d="M6 8h12l-1.2 11.3a2 2 0 0 1-2 1.7H9.2a2 2 0 0 1-2-1.7L6 8Z"/><path d="M6 8 5 5h14l-1 3"/><path d="M9 12c1 1 5 1 6 0"/>',
  history:
    '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  settings:
    '<path d="M12 15.3a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z"/><path d="M19.4 13a7.4 7.4 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-1.7-1L14.9 3h-4l-.4 2.6a7.6 7.6 0 0 0-1.7 1l-2.4-1-2 3.4L6.4 11a7.4 7.4 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7.6 7.6 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6Z"/>',
}

const CUSTOMER_NAV_TAB_ORDER: CustomerTab[] = ['home', 'order', 'history', 'settings']

// `showNav` is decided by main.ts (hidden while the cart drawer / checkout /
// customizer overlay is open, so the footer never sits visually underneath
// or peeks out around those full-screen overlays).
export function renderCustomerBottomNav(
  activeTab: CustomerTab,
  showNav: boolean,
  translations: CustomerTranslations
): string {
  if (!showNav) return ''

  const labels: Record<CustomerTab, string> = {
    home: translations.navHome,
    order: translations.navOrder,
    history: translations.navHistory,
    settings: translations.navSettings,
  }

  return `
    <nav class="customer-bottom-nav" id="customer-bottom-nav">
      ${CUSTOMER_NAV_TAB_ORDER.map(
        (tabId) => `
          <button
            type="button"
            class="customer-bottom-nav-btn${tabId === activeTab ? ' active' : ''}"
            data-customer-tab="${tabId}"
          >
            <span class="customer-bottom-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">${CUSTOMER_NAV_ICON_PATHS[tabId]}</svg>
            </span>
            <span class="customer-bottom-nav-label">${labels[tabId]}</span>
          </button>
        `
      ).join('')}
    </nav>
  `
}

// "Blue Cup" is the brand/wordmark next to the logo — left untranslated like
// the logo's own alt text elsewhere in the app, not treated as UI copy.
export function renderCustomerHomeTab(translations: CustomerTranslations): string {
  return `
    <div class="customer-placeholder-card customer-home-card">
      <img class="tea-shop-logo" src="/logo.jpg" alt="Blue Cup logo" />
      <h1>Blue Cup</h1>
      <p class="customer-placeholder-title">${translations.homeWelcomeTitle}</p>
      <p class="customer-placeholder-text">${translations.homeWelcomeText}</p>
    </div>
  `
}

export function renderCustomerHistoryTab(translations: CustomerTranslations): string {
  return `
    <div class="customer-placeholder-card">
      <h1>${translations.historyTitle}</h1>
      <p class="customer-placeholder-text">${translations.historyEmptyText}</p>
    </div>
  `
}

// `languageSwitcherHtml` is rendered by main.ts (renderCustomerLanguageSwitcher())
// and passed in as a string — this module stays pure/state-free. Native only:
// the header loses its language switcher, so it needs a home here. Browser/PWA
// keeps the switcher in the header and passes '' (no duplicate shown here).
export function renderCustomerSettingsTab(
  translations: CustomerTranslations,
  languageSwitcherHtml: string
): string {
  return `
    <div class="customer-placeholder-card">
      <h1>${translations.settingsTitle}</h1>
      ${
        languageSwitcherHtml
          ? `
            <div class="customer-settings-section">
              <p class="customer-settings-label">${translations.settingsLanguageLabel}</p>
              ${languageSwitcherHtml}
            </div>
          `
          : ''
      }
      <p class="customer-placeholder-text">${translations.settingsAccountPlaceholder}</p>
    </div>
  `
}
