// =============================
// TOOLS SCREEN: Payment test (?mode=payment-test)
// =============================
// Pure rendering only. Extracted 1:1 from main.ts — markup, classes and text
// are unchanged. All state + shared helpers come in via `deps`; this module
// never touches global state, the DOM, navigation, Supabase or the payment
// flow. main.ts keeps every event handler and the actual status updates.

import type { Payment, PaymentRecordStatus } from '../../types/payment'
import type { Order } from '../../types/order'

type PaymentTestScreenDeps = {
  payment: Payment | null
  order: Order | null
  isLoading: boolean
  error: string
  isUpdating: boolean
  escapeHtml: (value: string) => string
  formatPaymentAmount: (amountInCents: number) => string
}

// Payment-test-screen-specific, fully pure. Moved here from main.ts.
export function getPaymentTestStatusText(status?: PaymentRecordStatus | null): string {
  if (status === 'paid') return 'Betaling geslaagd'
  if (status === 'failed') return 'Betaling mislukt'
  if (status === 'cancelled') return 'Betaling geannuleerd'
  if (status === 'refunded') return 'Terugbetaald'
  return 'Wacht op betaling'
}

export function getPaymentTestStatusClass(status?: PaymentRecordStatus | null): string {
  if (status === 'paid') return 'payment-test-status-paid'
  if (status === 'failed') return 'payment-test-status-failed'
  if (status === 'cancelled') return 'payment-test-status-cancelled'
  if (status === 'refunded') return 'payment-test-status-refunded'
  return 'payment-test-status-pending'
}

export function renderPaymentTestScreen(deps: PaymentTestScreenDeps): string {
  const {
    payment,
    order,
    isLoading,
    error,
    isUpdating,
    escapeHtml,
    formatPaymentAmount,
  } = deps

  const status = payment?.status ?? 'pending'

  return `
    <div class="page payment-test-page">
      <main class="payment-test-shell">
        <section class="payment-test-brand">
          <img
            class="payment-test-logo"
            src="/logo.jpg"
            alt="Blue Cup logo"
          />

          <div>
            <span>Blue Cup</span>
            <strong>Payment Simulator</strong>
          </div>

          <span class="payment-test-environment">TEST</span>
        </section>

        ${
          isLoading
            ? `
              <section class="payment-test-card payment-test-loading">
                Betaling laden...
              </section>
            `
            : error
              ? `
                <section class="payment-test-card">
                  <div class="payment-test-error">
                    ${escapeHtml(error)}
                  </div>

                  <button
                    class="payment-test-secondary-btn"
                    id="payment-test-back-customer"
                    type="button"
                  >
                    Terug naar bestelling
                  </button>
                </section>
              `
              : payment
                ? `
                  <section class="payment-test-card">
                    <div class="payment-test-heading">
                      <div>
                        <p>MultiSafepay voorbereiding</p>
                        <h1>Online betaling</h1>
                      </div>

                      <span class="payment-test-status ${getPaymentTestStatusClass(status)}">
                        ${escapeHtml(getPaymentTestStatusText(status))}
                      </span>
                    </div>

                    <div class="payment-test-amount">
                      <span>Te betalen</span>
                      <strong>${escapeHtml(formatPaymentAmount(payment.amount))}</strong>
                      <small>${escapeHtml(payment.currency || 'EUR')}</small>
                    </div>

                    <div class="payment-test-details">
                      <div>
                        <span>Order</span>
                        <strong>
                          ${escapeHtml(
                            order?.order_number ||
                            `Order ${payment.order_id}`
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Provider</span>
                        <strong>MultiSafepay</strong>
                      </div>

                      <div>
                        <span>Provider order ID</span>
                        <strong>
                          ${escapeHtml(payment.provider_order_id || '-')}
                        </strong>
                      </div>

                      <div>
                        <span>Payment ID</span>
                        <strong class="payment-test-id">
                          ${escapeHtml(payment.id)}
                        </strong>
                      </div>
                    </div>

                    ${
                      status === 'pending'
                        ? `
                          <div class="payment-test-info">
                            Dit is nog geen echte MultiSafepay-betaling.
                            Met deze knoppen testen we alvast wat er gebeurt
                            bij een succesvolle, mislukte of geannuleerde betaling.
                          </div>

                          <div class="payment-test-actions">
                            <button
                              class="payment-test-primary-btn"
                              id="payment-test-success"
                              type="button"
                              ${isUpdating ? 'disabled' : ''}
                            >
                              ✓ Betaling succesvol
                            </button>

                            <button
                              class="payment-test-danger-btn"
                              id="payment-test-failed"
                              type="button"
                              ${isUpdating ? 'disabled' : ''}
                            >
                              Betaling mislukt
                            </button>

                            <button
                              class="payment-test-secondary-btn"
                              id="payment-test-cancelled"
                              type="button"
                              ${isUpdating ? 'disabled' : ''}
                            >
                              Annuleren
                            </button>
                          </div>
                        `
                        : `
                          <div class="payment-test-result ${getPaymentTestStatusClass(status)}">
                            <strong>${escapeHtml(getPaymentTestStatusText(status))}</strong>
                            <span>
                              ${
                                status === 'paid'
                                  ? 'De payment én de betaalstatus van de order staan nu op betaald.'
                                  : status === 'failed'
                                    ? 'De testbetaling is als mislukt opgeslagen.'
                                    : status === 'cancelled'
                                      ? 'De testbetaling is geannuleerd.'
                                      : 'De betaling is bijgewerkt.'
                              }
                            </span>
                          </div>

                          <div class="payment-test-actions">
                            ${
                              status !== 'paid' && status !== 'refunded'
                                ? `
                                  <button
                                    class="payment-test-secondary-btn"
                                    id="payment-test-retry"
                                    type="button"
                                    ${isUpdating ? 'disabled' : ''}
                                  >
                                    Opnieuw proberen
                                  </button>
                                `
                                : ''
                            }

                            <button
                              class="payment-test-primary-btn"
                              id="payment-test-back-customer"
                              type="button"
                            >
                              Terug naar bestelling
                            </button>
                          </div>
                        `
                    }
                  </section>
                `
                : `
                  <section class="payment-test-card">
                    Geen payment gevonden.
                  </section>
                `
        }

        <p class="payment-test-footnote">
          Testomgeving — er wordt geen echt geld afgeschreven.
        </p>
      </main>
    </div>
  `
}
