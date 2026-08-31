// =============================
// KITCHEN PRINT SERVICE (automatic Zebra print worker)
// =============================
// Orchestrates the existing automatic print flow, extracted 1:1 from main.ts:
//   - worker lifecycle + idempotency
//   - Supabase realtime subscription (kitchen_labels + orders)
//   - pending-label processing, per order, met 1/3-2/3-3/3 nummering
//   - automatische retry van 'failed' labels (healthcheck + cooldown)
//   - timers/cooldowns
//
// Alle auto-print state woont hier. Geen gedragswijziging: dezelfde queries
// (via printQueue), dezelfde ZPL (via zplBuilder), dezelfde bridge-calls (via
// zebraPrinter), dezelfde console logging, dezelfde volgorde.

import { supabase } from '../lib/supabase'
import type { KitchenLabel } from '../types/kitchen'
import type { Order } from '../types/order'
import { buildStickerZpl } from '../printing/zplBuilder'
import { sendZplToPrintBridge, isZebraBridgeReachable } from '../printing/zebraPrinter'
import {
  MAX_AUTO_PRINT_ATTEMPTS,
  FAILED_RETRY_MAX_AGE_MS,
  fetchPendingLabels,
  fetchPrintingLabels,
  fetchLabelsForOrder,
  fetchOrdersByIds,
  claimPendingLabel,
  markLabelPrinted,
  markLabelFailed,
  fetchFailedLabelsForRetry,
  requeueFailedLabelToPending,
  resetStalePrintingLabelToPending,
} from '../printing/printQueue'

// De retry-run draait periodiek, maar doet niets zolang de bridge offline is.
const FAILED_RETRY_INTERVAL_MS = 60_000
// Ondergrens tussen twee retry-runs (beschermt tegen extra triggers).
const FAILED_RETRY_COOLDOWN_MS = 30_000

// Een label dat sinds de start van deze worker langer dan dit op 'printing'
// blijft staan, is vrijwel zeker blijven hangen door een crash/afsluiting
// tussen claim en printed/failed -> terug naar 'pending'.
const STALE_PRINTING_MAX_AGE_MS = 2 * 60 * 1000
// Ondergrens tussen twee stale-recovery runs.
const STALE_PRINTING_RECOVERY_COOLDOWN_MS = 60_000
// Alleen bestaande pending labels jonger dan dit worden na een (re)start
// automatisch meegenomen; ouder telt als backlog en blijft genegeerd.
const FRESH_PENDING_MAX_AGE_MS = 5 * 60 * 1000

export type KitchenPrintServiceDeps = {
  // Resolves the product's qr_product_code from the (main.ts) product catalog.
  getQrProductCode: (label: KitchenLabel) => string
  // Called after each auto-print cycle (main.ts refreshes the print-preview
  // screen when it is open — identiek aan de oude `if (screen === 'print-preview')`).
  onAfterAutoPrintCycle: () => void | Promise<void>
}

// --- module state (was module-global in main.ts) --------------------------
let autoPrintRealtimeChannel: ReturnType<typeof supabase.channel> | null = null
let autoPrintReloadTimer: number | null = null
let isAutoPrintProcessing = false
let ignoredPendingLabelIds = new Set<string>()
let failedRetryIntervalId: number | null = null
let lastFailedRetryCheckAt = 0

// Stale-'printing' recovery state.
let serviceStartedAtMs = 0
let stalePrintingCandidateIds = new Set<string>()
let lastStalePrintingRecoveryAt = 0

let getQrProductCode: KitchenPrintServiceDeps['getQrProductCode'] = () => ''
let onAfterAutoPrintCycle: KitchenPrintServiceDeps['onAfterAutoPrintCycle'] = () => {}

function isOrderReadyForAutomaticPrint(order: Order) {
  if (order.status === 'cancelled') {
    return false
  }

  // Normale betaalde orders mogen direct naar de keuken.
  if (order.payment_status === 'paid') {
    return true
  }

  // Bij "betalen aan de balie" is unpaid bewust toegestaan:
  // de bestelling moet wel alvast in de keuken terechtkomen.
  if (order.payment_method === 'pay_at_counter') {
    return true
  }

  // Online betalingen die nog pending/failed/cancelled zijn printen we niet.
  return false
}

async function claimAndAutoPrintLabel(
  label: KitchenLabel,
  index: number,
  totalLabels: number,
  order: Order
) {
  const nextAttempts = Number(label.print_attempts ?? 0) + 1

  // Atomisch claimen: alleen een label dat nog pending is mag worden opgepakt.
  // Dit voorkomt dubbele prints wanneer meerdere tabs openstaan.
  const { data: claimedRows, error: claimError } = await claimPendingLabel(
    label.id,
    nextAttempts
  )

  if (claimError) {
    console.error('Automatische print claim mislukt:', claimError)
    return
  }

  const claimedLabel = (claimedRows ?? [])[0] as KitchenLabel | undefined

  if (!claimedLabel) {
    // Een andere tab/worker heeft hem al opgepakt.
    return
  }

  try {
    const zpl = buildStickerZpl(
      claimedLabel,
      index,
      totalLabels,
      order,
      getQrProductCode(claimedLabel)
    )

    await sendZplToPrintBridge(claimedLabel, zpl, order)

    const { error: successError } = await markLabelPrinted(claimedLabel.id)

    if (successError) {
      throw new Error(
        `Sticker is verstuurd, maar status opslaan mislukt: ${successError.message}`
      )
    }

    console.log(
      `Sticker automatisch geprint: ${order.order_number || order.id} | ${index}/${totalLabels}`
    )
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Onbekende printerfout'

    await markLabelFailed(claimedLabel.id, errorMessage)

    console.error('Automatisch printen mislukt:', errorMessage)
  }
}

/**
 * Zet labels die sinds de start van deze worker op 'printing' zijn blijven
 * hangen (browser/tab/app-crash tussen claim en printed/failed) terug naar
 * 'pending', zodat de normale worker ze opnieuw oppakt.
 *
 * Veiligheid:
 * - Alleen labels die AL 'printing' waren toen deze worker startte
 *   (`stalePrintingCandidateIds`). Een claim van een andere tab die daarna
 *   gebeurt, kan hier dus nooit per ongeluk door geraakt worden.
 * - Pas na STALE_PRINTING_MAX_AGE_MS, zodat een print die op het startmoment
 *   echt nog bezig was (andere tab) alle tijd krijgt om af te ronden — de
 *   bridge-timeouts zorgen dat dat binnen ~8s gebeurt.
 * - `resetStalePrintingLabelToPending` is conditioneel ('printing' -> 'pending')
 *   en raakt dus nooit een label dat intussen printed/failed is geworden.
 * - `print_attempts` blijft ongewijzigd; de bestaande retry-limiet blijft gelden.
 * - Alleen voor orders die volgens de bestaande orderlogica nog relevant zijn.
 */
async function recoverStalePrintingLabels() {
  if (stalePrintingCandidateIds.size === 0) {
    return
  }

  const nowMs = Date.now()

  if (nowMs - serviceStartedAtMs < STALE_PRINTING_MAX_AGE_MS) {
    return
  }

  if (nowMs - lastStalePrintingRecoveryAt < STALE_PRINTING_RECOVERY_COOLDOWN_MS) {
    return
  }

  lastStalePrintingRecoveryAt = nowMs

  const { data, error } = await fetchPrintingLabels()

  if (error) {
    console.error('Vastgelopen printing labels ophalen mislukt:', error)
    return
  }

  const stillPrinting = ((data ?? []) as KitchenLabel[]).filter((label) =>
    stalePrintingCandidateIds.has(String(label.id))
  )

  // Kandidaten die niet meer 'printing' zijn, zijn afgerond -> uit de set.
  const stillPrintingIds = new Set(stillPrinting.map((label) => String(label.id)))
  for (const id of Array.from(stalePrintingCandidateIds)) {
    if (!stillPrintingIds.has(id)) {
      stalePrintingCandidateIds.delete(id)
    }
  }

  if (stillPrinting.length === 0) {
    return
  }

  const orderIds = Array.from(
    new Set(
      stillPrinting.map((label) => String(label.order_id)).filter(Boolean)
    )
  )

  const orderMap = new Map<string, Order>()

  if (orderIds.length > 0) {
    const { data: orderData, error: orderError } = await fetchOrdersByIds(orderIds)

    if (orderError) {
      console.error(
        'Orders voor stale-printing recovery ophalen mislukt:',
        orderError
      )
      return
    }

    for (const order of (orderData ?? []) as Order[]) {
      orderMap.set(String(order.id), order)
    }
  }

  let recoveredCount = 0

  for (const label of stillPrinting) {
    const order = orderMap.get(String(label.order_id))

    if (
      !order ||
      !isOrderReadyForAutomaticPrint(order) ||
      order.status === 'completed'
    ) {
      // Niet meer relevant om te printen -> niet terugzetten, wel uit de set.
      stalePrintingCandidateIds.delete(String(label.id))
      continue
    }

    const { data: resetRows, error: resetError } =
      await resetStalePrintingLabelToPending(label.id)

    if (resetError) {
      console.error(
        `Vastgelopen label ${label.id} terugzetten naar pending mislukt:`,
        resetError
      )
      continue
    }

    stalePrintingCandidateIds.delete(String(label.id))

    if (!resetRows || resetRows.length === 0) {
      // Een andere tab/worker heeft dit label net afgerond (printed/failed).
      continue
    }

    // Zorg dat de worker dit teruggezette label niet als "oud pending" negeert.
    ignoredPendingLabelIds.delete(String(label.id))
    recoveredCount += 1

    console.log(
      `Vastgelopen printing label ${label.id} teruggezet naar pending voor herprint.`
    )
  }

  if (recoveredCount > 0) {
    scheduleAutomaticPrintCheck()
  }
}

async function processPendingPrintJobs() {
  if (isAutoPrintProcessing) {
    return
  }

  isAutoPrintProcessing = true

  try {
    // Eerst vastgelopen 'printing' labels herstellen, dan pas pending verwerken.
    await recoverStalePrintingLabels()

    const { data: pendingData, error: pendingError } = await fetchPendingLabels()

    if (pendingError) {
      console.error('Pending printlabels laden mislukt:', pendingError)
      return
    }

    const pendingLabels = ((pendingData ?? []) as KitchenLabel[]).filter(
      (label) => !ignoredPendingLabelIds.has(String(label.id))
    )

    if (pendingLabels.length === 0) {
      return
    }

    const orderIds = Array.from(
      new Set(
        pendingLabels
          .map((label) => String(label.order_id))
          .filter(Boolean)
      )
    )

    if (orderIds.length === 0) {
      return
    }

    const { data: orderData, error: orderError } = await fetchOrdersByIds(orderIds)

    if (orderError) {
      console.error('Orders voor automatische print laden mislukt:', orderError)
      return
    }

    const orderMap = new Map(
      ((orderData ?? []) as Order[]).map((order) => [
        String(order.id),
        order,
      ])
    )

    // Per order werken, zodat 1/2, 2/2 enz. altijd klopt.
    for (const orderId of orderIds) {
      const order = orderMap.get(String(orderId))

      if (!order || !isOrderReadyForAutomaticPrint(order)) {
        continue
      }

      const { data: allLabelData, error: allLabelError } = await fetchLabelsForOrder(orderId)

      if (allLabelError) {
        console.error(
          `Labels van order ${orderId} laden mislukt:`,
          allLabelError
        )
        continue
      }

      const allOrderLabels = (allLabelData ?? []) as KitchenLabel[]

      for (let i = 0; i < allOrderLabels.length; i++) {
        const label = allOrderLabels[i]

        if ((label.print_status || 'pending') !== 'pending') {
          continue
        }

        await claimAndAutoPrintLabel(
          label,
          i + 1,
          allOrderLabels.length,
          order
        )
      }
    }

    await onAfterAutoPrintCycle()
  } finally {
    isAutoPrintProcessing = false
  }
}

function scheduleAutomaticPrintCheck() {
  if (autoPrintReloadTimer !== null) {
    window.clearTimeout(autoPrintReloadTimer)
  }

  autoPrintReloadTimer = window.setTimeout(() => {
    autoPrintReloadTimer = null
    void processPendingPrintJobs()
  }, 250)
}

/**
 * Zet eerder mislukte ('failed') labels gecontroleerd terug naar 'pending'
 * zodat de bestaande pending -> printing -> printed worker ze normaal oppakt.
 *
 * - Draait alleen als de bridge via healthcheck bereikbaar is (geen retry-storm).
 * - Verwerkt maximaal FAILED_RETRY_BATCH_SIZE labels per run.
 * - Respecteert MAX_AUTO_PRINT_ATTEMPTS (labels daarboven blijven failed).
 * - Slaat labels van niet-relevante/oude orders over.
 * - Conditionele update ('failed' -> 'pending') voorkomt dubbele reset/print.
 */
async function requeueFailedLabels() {
  if (isAutoPrintProcessing) {
    return
  }

  // Ook op de periodieke run: eerst vastgelopen 'printing' labels herstellen.
  await recoverStalePrintingLabels()

  const nowMs = Date.now()

  if (nowMs - lastFailedRetryCheckAt < FAILED_RETRY_COOLDOWN_MS) {
    return
  }

  lastFailedRetryCheckAt = nowMs

  const bridgeReachable = await isZebraBridgeReachable()

  if (!bridgeReachable) {
    console.warn(
      'Zebra bridge niet bereikbaar - mislukte labels worden nu niet opnieuw geprobeerd.'
    )
    return
  }

  const { data: failedData, error: failedError } = await fetchFailedLabelsForRetry()

  if (failedError) {
    console.error('Failed labels ophalen voor retry mislukt:', failedError)
    return
  }

  const failedLabels = (failedData ?? []) as KitchenLabel[]

  if (failedLabels.length === 0) {
    return
  }

  console.log(
    `Zebra bridge weer bereikbaar. ${failedLabels.length} failed label(s) geselecteerd voor automatische retry.`
  )

  const orderIds = Array.from(
    new Set(
      failedLabels
        .map((label) => String(label.order_id))
        .filter(Boolean)
    )
  )

  const orderMap = new Map<string, Order>()

  if (orderIds.length > 0) {
    const { data: orderData, error: orderError } = await fetchOrdersByIds(orderIds)

    if (orderError) {
      console.error('Orders voor failed-label retry ophalen mislukt:', orderError)
      return
    }

    for (const order of (orderData ?? []) as Order[]) {
      orderMap.set(String(order.id), order)
    }
  }

  let requeuedCount = 0

  for (const label of failedLabels) {
    if (Number(label.print_attempts ?? 0) >= MAX_AUTO_PRINT_ATTEMPTS) {
      console.log(
        `Retry-limiet bereikt voor label ${label.id} - blijft failed (handmatig herstelbaar).`
      )
      continue
    }

    const createdAtMs = label.created_at
      ? new Date(label.created_at).getTime()
      : 0

    if (createdAtMs && nowMs - createdAtMs > FAILED_RETRY_MAX_AGE_MS) {
      console.log(
        `Label ${label.id} overgeslagen: te oud voor automatische retry.`
      )
      continue
    }

    const order = orderMap.get(String(label.order_id))

    if (
      !order ||
      !isOrderReadyForAutomaticPrint(order) ||
      order.status === 'completed'
    ) {
      console.log(
        `Label ${label.id} overgeslagen: order niet meer relevant voor automatische print.`
      )
      continue
    }

    const { data: resetRows, error: resetError } = await requeueFailedLabelToPending(label.id)

    if (resetError) {
      console.error(
        `Failed label ${label.id} terugzetten naar pending mislukt:`,
        resetError
      )
      continue
    }

    if (!resetRows || resetRows.length === 0) {
      // Al opgepakt door een andere tab/worker, of net op de limiet gekomen.
      continue
    }

    // Zorg dat de worker dit teruggezette label niet als "oud pending" negeert.
    ignoredPendingLabelIds.delete(String(label.id))
    requeuedCount += 1

    console.log(
      `Failed label ${label.id} teruggezet naar pending voor automatische retry.`
    )
  }

  if (requeuedCount > 0) {
    scheduleAutomaticPrintCheck()
  }
}

/**
 * Start de automatische Zebra-printworker. Idempotent: een tweede aanroep doet
 * niets zolang er al een realtime channel actief is (exact zoals voorheen).
 */
export async function startKitchenPrintService(deps: KitchenPrintServiceDeps) {
  if (autoPrintRealtimeChannel) {
    return
  }

  getQrProductCode = deps.getQrProductCode
  onAfterAutoPrintCycle = deps.onAfterAutoPrintCycle
  serviceStartedAtMs = Date.now()

  // Bepaal welke bestaande pending labels na een (re)start automatisch mogen
  // printen. NIET meer klakkeloos ALLES negeren: verse (< FRESH_PENDING_MAX_AGE_MS)
  // labels van nog-relevante orders willen we WEL printen, zodat een order die
  // net vóór een browser-restart is aangemaakt alsnog naar de keuken gaat.
  // Oudere labels en labels van cancelled/completed orders blijven genegeerd
  // (geen backlog-dump).
  const { data: pendingData, error: pendingError } = await fetchPendingLabels()

  if (pendingError) {
    console.error('Bestaande pending labels bepalen mislukt:', pendingError)
    ignoredPendingLabelIds = new Set()
  } else {
    const pendingLabels = (pendingData ?? []) as KitchenLabel[]
    const relevantFreshIds = new Set<string>()

    const freshLabels = pendingLabels.filter((label) => {
      const createdMs = label.created_at
        ? new Date(label.created_at).getTime()
        : 0
      return (
        createdMs > 0 &&
        serviceStartedAtMs - createdMs <= FRESH_PENDING_MAX_AGE_MS
      )
    })

    const freshOrderIds = Array.from(
      new Set(
        freshLabels.map((label) => String(label.order_id)).filter(Boolean)
      )
    )

    if (freshOrderIds.length > 0) {
      const { data: orderData, error: orderError } = await fetchOrdersByIds(freshOrderIds)

      if (orderError) {
        console.error(
          'Orders voor pending-label filter ophalen mislukt:',
          orderError
        )
      } else {
        const orderMap = new Map(
          ((orderData ?? []) as Order[]).map((order) => [
            String(order.id),
            order,
          ])
        )

        for (const label of freshLabels) {
          const order = orderMap.get(String(label.order_id))
          if (
            order &&
            isOrderReadyForAutomaticPrint(order) &&
            order.status !== 'completed'
          ) {
            relevantFreshIds.add(String(label.id))
          }
        }
      }
    }

    ignoredPendingLabelIds = new Set(
      pendingLabels
        .map((label) => String(label.id))
        .filter((id) => !relevantFreshIds.has(id))
    )
  }

  // Labels die NU al 'printing' zijn, zijn kandidaten voor stale-recovery: als
  // ze over STALE_PRINTING_MAX_AGE_MS nog steeds 'printing' zijn, is de vorige
  // print blijven hangen (crash tussen claim en printed/failed).
  const { data: printingData, error: printingError } = await fetchPrintingLabels()

  if (printingError) {
    console.error('Bestaande printing labels bepalen mislukt:', printingError)
    stalePrintingCandidateIds = new Set()
  } else {
    stalePrintingCandidateIds = new Set(
      ((printingData ?? []) as KitchenLabel[]).map((label) => String(label.id))
    )
  }

  console.log(
    `Automatische Zebra printer gestart. ${ignoredPendingLabelIds.size} oude pending label(s) genegeerd, ` +
    `${stalePrintingCandidateIds.size} 'printing' label(s) bewaakt op vastlopen.`
  )

  autoPrintRealtimeChannel = supabase
    .channel('blue-cup-auto-printer')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'kitchen_labels',
      },
      () => {
        scheduleAutomaticPrintCheck()
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
      },
      () => {
        // Nodig voor online betaling:
        // zodra payment_status naar paid verandert, printen pending labels alsnog.
        scheduleAutomaticPrintCheck()
      }
    )
    .subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        console.log('Automatische Zebra printer verbonden')
        scheduleAutomaticPrintCheck()
      }

      if (error) {
        console.error('Automatische Zebra printer realtime fout:', error)
      }
    })

  // Periodiek (en 1x bij start) failed labels opnieuw aanbieden zodra de
  // bridge weer bereikbaar is. requeueFailedLabels() doet zelf eerst een
  // healthcheck + cooldown, dus dit is geen retry-storm.
  if (failedRetryIntervalId === null) {
    failedRetryIntervalId = window.setInterval(() => {
      void requeueFailedLabels()
    }, FAILED_RETRY_INTERVAL_MS)
  }

  void requeueFailedLabels()
}

/** Trigger een pending-check (gebruikt door handmatige "opnieuw printen"-acties). */
export function scheduleKitchenPrintCheck() {
  scheduleAutomaticPrintCheck()
}

/** Haal een label uit de "oude pending negeren"-set (handmatige reset/reprint). */
export function unignorePendingLabel(labelId: string) {
  ignoredPendingLabelIds.delete(String(labelId))
}
