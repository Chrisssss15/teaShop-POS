// =============================
// CUSTOMER SCREEN: Pickup display (?mode=pickup)
// =============================
// Public in-store status board. Pure rendering only — extracted 1:1 from
// main.ts (markup, classes and text unchanged). State comes in via `deps`;
// this module never touches global state, the DOM, Supabase or realtime.

import type { Order } from '../../types/order'

type PickupScreenDeps = {
  orders: Order[]
  pickupWaitVisible: boolean
  pickupWaitMinutes: number
  escapeHtml: (value: string) => string
}

function renderPickupNumberList(
  status: 'preparing' | 'ready',
  orders: Order[],
  escapeHtml: (value: string) => string
): string {
  const pickupOrders =
    status === 'preparing'
      ? orders.filter(
          (order) =>
            order.status === 'new' ||
            order.status === 'preparing'
        )
      : orders.filter((order) => order.status === 'ready')

  if (pickupOrders.length === 0) {
    return `<div class="pickup-empty">Nog geen bestellingen</div>`
  }

  return pickupOrders
    .map(
      (order) => `
        <div class="pickup-number-card">
          ${escapeHtml(order.pickup_code || '----')}
        </div>
      `
    )
    .join('')
}

export function renderPickupScreen(deps: PickupScreenDeps): string {
  const { orders, pickupWaitVisible, pickupWaitMinutes, escapeHtml } = deps

  return `
    <div class="pickup-page">
      <header class="pickup-header">
        <div class="pickup-brand">
          <img src="/logo.jpg" alt="Blue Cup" class="pickup-logo" />

          <div>
            <h1>Blue Cup</h1>
            <p>Bestelstatus</p>
          </div>
        </div>

        <div class="pickup-live">
          <span></span>
          Live
        </div>
      </header>

      <main class="pickup-board ${pickupWaitVisible ? 'has-wait-time' : 'no-wait-time'}">
        <section class="pickup-column pickup-preparing">
          <div class="pickup-column-title">
            <span class="pickup-step">1</span>
            <div>
              <h2>In voorbereiding</h2>
              <p>Bestelling ontvangen of wordt bereid</p>
            </div>
          </div>

          <div class="pickup-number-list">
            ${renderPickupNumberList('preparing', orders, escapeHtml)}
          </div>
        </section>

        <section class="pickup-column pickup-ready">
          <div class="pickup-column-title">
            <span class="pickup-step">2</span>
            <div>
              <h2>Klaar om op te halen</h2>
              <p>Je bestelling staat klaar</p>
            </div>
          </div>

          <div class="pickup-number-list">
            ${renderPickupNumberList('ready', orders, escapeHtml)}
          </div>
        </section>

        ${
          pickupWaitVisible
            ? `
              <section class="pickup-column pickup-wait">
                <div class="pickup-column-title">
                  <span class="pickup-step">⏱</span>
                  <div>
                    <h2>Geschatte wachttijd</h2>
                    <p>Voor nieuwe bestellingen</p>
                  </div>
                </div>

                <div class="pickup-wait-content">
                  <div class="pickup-wait-value">
                    <strong>± ${pickupWaitMinutes}</strong>
                    <span>minuten</span>
                  </div>

                  <p class="pickup-wait-note">
                    Dit is een schatting. De werkelijke wachttijd kan iets afwijken.
                  </p>
                </div>
              </section>
            `
            : ''
        }
      </main>
    </div>
  `
}
