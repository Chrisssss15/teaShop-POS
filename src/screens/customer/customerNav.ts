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

export type CustomerTab = 'home' | 'order' | 'history' | 'settings'

type CustomerNavItem = {
  id: CustomerTab
  label: string
  // Inline <path>-content for a 24x24 stroke icon (same style as the existing
  // sticker-reprint icon in the order-history detail view).
  iconPaths: string
}

const CUSTOMER_NAV_ITEMS: CustomerNavItem[] = [
  {
    id: 'home',
    label: 'Home',
    iconPaths:
      '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V19a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-8.5"/>',
  },
  {
    id: 'order',
    label: 'Bestellen',
    iconPaths:
      '<path d="M6 8h12l-1.2 11.3a2 2 0 0 1-2 1.7H9.2a2 2 0 0 1-2-1.7L6 8Z"/><path d="M6 8 5 5h14l-1 3"/><path d="M9 12c1 1 5 1 6 0"/>',
  },
  {
    id: 'history',
    label: 'Order history',
    iconPaths:
      '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  },
  {
    id: 'settings',
    label: 'Settings',
    iconPaths:
      '<path d="M12 15.3a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z"/><path d="M19.4 13a7.4 7.4 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-1.7-1L14.9 3h-4l-.4 2.6a7.6 7.6 0 0 0-1.7 1l-2.4-1-2 3.4L6.4 11a7.4 7.4 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7.6 7.6 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6Z"/>',
  },
]

// `showNav` is decided by main.ts (hidden while the cart drawer / checkout /
// customizer overlay is open, so the footer never sits visually underneath
// or peeks out around those full-screen overlays).
export function renderCustomerBottomNav(activeTab: CustomerTab, showNav: boolean): string {
  if (!showNav) return ''

  return `
    <nav class="customer-bottom-nav" id="customer-bottom-nav">
      ${CUSTOMER_NAV_ITEMS.map(
        (item) => `
          <button
            type="button"
            class="customer-bottom-nav-btn${item.id === activeTab ? ' active' : ''}"
            data-customer-tab="${item.id}"
          >
            <span class="customer-bottom-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">${item.iconPaths}</svg>
            </span>
            <span class="customer-bottom-nav-label">${item.label}</span>
          </button>
        `
      ).join('')}
    </nav>
  `
}

export function renderCustomerHomeTab(): string {
  return `
    <div class="customer-placeholder-card customer-home-card">
      <img class="tea-shop-logo" src="/logo.jpg" alt="Blue Cup logo" />
      <h1>Blue Cup</h1>
      <p class="customer-placeholder-title">Welkom bij Blue Cup</p>
      <p class="customer-placeholder-text">Bestel je favoriete drankje.</p>
    </div>
  `
}

export function renderCustomerHistoryTab(): string {
  return `
    <div class="customer-placeholder-card">
      <h1>Mijn bestellingen</h1>
      <p class="customer-placeholder-text">Je eerdere bestellingen verschijnen hier.</p>
    </div>
  `
}

// `languageSwitcherHtml` is rendered by main.ts (renderCustomerLanguageSwitcher())
// and passed in as a string — this module stays pure/state-free. Native only:
// the header loses its language switcher, so it needs a home here. Browser/PWA
// keeps the switcher in the header and passes '' (no duplicate shown here).
export function renderCustomerSettingsTab(languageSwitcherHtml: string): string {
  return `
    <div class="customer-placeholder-card">
      <h1>Instellingen</h1>
      ${
        languageSwitcherHtml
          ? `
            <div class="customer-settings-section">
              <p class="customer-settings-label">Taal</p>
              ${languageSwitcherHtml}
            </div>
          `
          : ''
      }
      <p class="customer-placeholder-text">Accountinstellingen komen hier.</p>
    </div>
  `
}
