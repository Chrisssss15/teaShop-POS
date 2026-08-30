// =============================
// ZEBRA PRINTER (low-level bridge communication)
// =============================
// Extracted 1:1 from main.ts. Same URLs, ports, endpoints, timeouts, request
// bodies, response handling and thrown errors as before.
//
// De browser kan niet rechtstreeks TCP poort 9100 openen, daarom sturen we ZPL
// via een kleine lokale Node print-service op dezelfde Mac als de POS.

import type { KitchenLabel } from '../types/kitchen'
import type { Order } from '../types/order'

export const ZEBRA_PRINT_BRIDGE_URL = 'http://127.0.0.1:3001/print'

// Als de lokale print-bridge offline is mag een sticker-print niet eindeloos
// blijven hangen. Bij een timeout gooit fetchWithTimeout een fout; de
// bestaande foutafhandeling markeert het label dan als 'failed' (blijft dus
// opnieuw te printen), niet als 'printed'.
export const ZEBRA_PRINT_TIMEOUT_MS = 3000

// Automatische retry van 'failed' labels wanneer de bridge weer online komt.
// GET /health print niets; het bevestigt alleen dat de bridge draait.
export const ZEBRA_HEALTH_URL = 'http://127.0.0.1:3001/health'
export const ZEBRA_HEALTHCHECK_TIMEOUT_MS = 2500

export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        `Geen antwoord van de printer binnen ${timeoutMs / 1000} seconden.`
      )
    }
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function sendZplToPrintBridge(
  label: KitchenLabel,
  zpl: string,
  order?: Order | null
) {
  const response = await fetchWithTimeout(
    ZEBRA_PRINT_BRIDGE_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        labelId: label.id,
        orderNumber:
          order?.order_number ||
          label.order_number ||
          label.order_id,
        zpl,
      }),
    },
    ZEBRA_PRINT_TIMEOUT_MS
  )

  const result = await response.json().catch(() => ({})) as {
    ok?: boolean
    error?: string
  }

  if (!response.ok || !result.ok) {
    throw new Error(result.error || `Print bridge gaf HTTP ${response.status}`)
  }
}

// Lichte, niet-printende healthcheck: is de lokale Zebra print-bridge bereikbaar?
export async function isZebraBridgeReachable(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(
      ZEBRA_HEALTH_URL,
      { method: 'GET' },
      ZEBRA_HEALTHCHECK_TIMEOUT_MS
    )

    if (!response.ok) {
      return false
    }

    const body = (await response.json().catch(() => ({}))) as { ok?: boolean }
    return body.ok === true
  } catch {
    return false
  }
}
