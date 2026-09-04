import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.108.2'

const MAX_WEBHOOK_BODY_BYTES = 256 * 1024

type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'

function constantTimeEqual(left: string, right: string) {
  const a = left.toLowerCase()
  const b = right.toLowerCase()

  // Blijf altijd over de langste invoer lopen. Zo hangt de vergelijking niet
  // af van het eerste afwijkende teken.
  const length = Math.max(a.length, b.length)
  let difference = a.length ^ b.length

  for (let index = 0; index < length; index++) {
    difference |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0)
  }

  return difference === 0
}

function mapMultiSafepayStatus(
  orderStatus: string,
  financialStatus: string,
): PaymentStatus | null {
  // Een gedeeltelijke refund mag niet per ongeluk als volledig betaald of
  // volledig refunded worden geboekt. De huidige database kent hiervoor nog
  // geen afzonderlijke status; laat deze daarom staan voor handmatige controle.
  if (
    orderStatus === 'partial_refunded' ||
    financialStatus === 'partial_refunded'
  ) {
    return null
  }

  // Een geslaagde refund heeft voorrang op de normale orderstatus.
  if (orderStatus === 'refunded' || financialStatus === 'refunded') {
    return 'refunded'
  }

  // Alleen COMPLETED betekent dat de betaling werkelijk voltooid is.
  // SHIPPED kan volgens MultiSafepay nog UNCLEARED zijn en is dus niet betaald.
  if (orderStatus === 'completed' || financialStatus === 'completed') {
    return 'paid'
  }

  if (orderStatus === 'declined' || financialStatus === 'declined') {
    return 'failed'
  }

  if (
    orderStatus === 'cancelled' ||
    orderStatus === 'canceled' ||
    orderStatus === 'expired' ||
    orderStatus === 'void' ||
    financialStatus === 'cancelled' ||
    financialStatus === 'canceled' ||
    financialStatus === 'expired' ||
    financialStatus === 'void'
  ) {
    return 'cancelled'
  }

  if (
    orderStatus === 'initialized' ||
    orderStatus === 'uncleared' ||
    orderStatus === 'reserved' ||
    orderStatus === 'shipped'
  ) {
    return 'pending'
  }

  return null
}

function resolveMonotonicStatus(
  current: PaymentStatus,
  incoming: PaymentStatus,
): PaymentStatus {
  // Refunded is definitief. Paid mag alleen nog naar refunded gaan.
  if (current === 'refunded') return 'refunded'
  if (current === 'paid') return incoming === 'refunded' ? 'refunded' : 'paid'

  // Een late geslaagde melding mag een eerdere decline/cancel corrigeren.
  if (incoming === 'paid' || incoming === 'refunded') return incoming

  // Mislukte/cancelled betalingen mogen niet terug naar pending.
  if (current === 'failed' || current === 'cancelled') return current

  return incoming
}

function hexFromBuffer(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function createHmacSha512(
  secret: string,
  message: string
) {
  const encoder = new TextEncoder()

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    {
      name: 'HMAC',
      hash: 'SHA-512',
    },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  )

  return hexFromBuffer(signature)
}

async function createKitchenLabelsAfterPayment(
  supabase: any,
  orderId: string,
  orderNumber: string
) {
  // Order-items ophalen
  const {
    data: orderItems,
    error: orderItemsError,
  } = await supabase
    .from('order_items')
    .select(`
      id,
      order_id,
      product_id,
      product_name,
      product_name_snapshot,
      quantity,
      cup_size,
      ice_level,
      sugar_level,
      toppings
    `)
    .eq('order_id', orderId)

  if (orderItemsError) {
    throw new Error(
      `Order items ophalen mislukt: ${orderItemsError.message}`
    )
  }

  if (!orderItems || orderItems.length === 0) {
    throw new Error(
      `Geen order items gevonden voor order ${orderNumber}`
    )
  }

  const productIds = orderItems
    .map((item: any) => item.product_id)
    .filter(Boolean)

  // We hebben product_type nodig zodat gewone items
  // geen dranksticker krijgen.
  const {
    data: products,
    error: productsError,
  } = productIds.length > 0
    ? await supabase
        .from('products')
        .select('id,product_type')
        .in('id', productIds)
    : { data: [], error: null }

  if (productsError) {
    throw new Error(
      `Producttypes ophalen mislukt: ${productsError.message}`
    )
  }

  const productTypeMap = new Map<string, string>()

  for (const product of products ?? []) {
    productTypeMap.set(
      String(product.id),
      String(product.product_type)
    )
  }

  const labels: any[] = []

  for (const item of orderItems) {
    const productType = item.product_id
      ? productTypeMap.get(String(item.product_id))
      : null

    // Zelfde gedrag als je huidige main.ts:
    // losse items krijgen geen dranksticker.
    if (productType === 'item') {
      continue
    }

    const quantity = Math.max(
      1,
      Number(item.quantity ?? 1)
    )

    const productName =
      item.product_name_snapshot ||
      item.product_name ||
      'Onbekend product'

    for (let i = 1; i <= quantity; i++) {
      labels.push({
        order_id: String(orderId),

        order_item_id:
          item.id ? String(item.id) : null,

        product_id:
          item.product_id
            ? String(item.product_id)
            : null,

        order_number: orderNumber,

        product_name: productName,

        status: 'new',

        label_index: i,

        cup_size:
          item.cup_size || null,

        ice_level:
          item.ice_level || null,

        sugar_level:
          item.sugar_level || null,

        toppings:
          item.toppings || [],

        print_status: 'pending',

        print_attempts: 0,

        printed_at: null,

        print_error: null,
      })
    }
  }

  if (labels.length === 0) {
    console.log(
      `Order ${orderNumber} bevat geen drankjes waarvoor labels nodig zijn.`
    )
    return
  }

  // De UNIQUE-index uit teashop_security_011_multisafepay_webhook_hardening.sql
  // maakt dit ook bij gelijktijdige/repeated webhooks atomisch idempotent.
  const { error: labelInsertError } =
    await supabase
      .from('kitchen_labels')
      .upsert(labels, {
        onConflict: 'order_id,order_item_id,label_index',
        ignoreDuplicates: true,
      })

  if (labelInsertError) {
    throw new Error(
      `Kitchen labels aanmaken mislukt: ${labelInsertError.message}`
    )
  }

  console.log(
    `${labels.length} kitchen label(s) aangemaakt voor ${orderNumber}`
  )
}

Deno.serve(async (req) => {
  try {
    // =============================
    // ALLEEN POST
    // =============================

    if (req.method !== 'POST') {
      return new Response(
        'Method not allowed',
        {
          status: 405,
        }
      )
    }

    const contentLength = Number(req.headers.get('Content-Length') || 0)
    if (
      Number.isFinite(contentLength) &&
      contentLength > MAX_WEBHOOK_BODY_BYTES
    ) {
      return new Response('Payload too large', { status: 413 })
    }

    // =============================
    // SECRETS
    // =============================

    const apiKey =
      Deno.env.get('MULTISAFEPAY_API_KEY')

    const supabaseUrl =
      Deno.env.get('SUPABASE_URL')

    const serviceRoleKey =
      Deno.env.get(
        'SUPABASE_SERVICE_ROLE_KEY'
      )

    if (!apiKey) {
      console.error(
        'MULTISAFEPAY_API_KEY ontbreekt'
      )

      return new Response(
        'Server configuration error',
        {
          status: 500,
        }
      )
    }

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      console.error(
        'Supabase server secrets ontbreken'
      )

      return new Response(
        'Server configuration error',
        {
          status: 500,
        }
      )
    }

    // =============================
    // AUTH HEADER
    // =============================

    const authHeader =
      req.headers.get('Auth')

    if (!authHeader) {
      console.error(
        'MultiSafepay Auth header ontbreekt'
      )

      return new Response(
        'Unauthorized',
        {
          status: 401,
        }
      )
    }

    const rawBody =
      await req.text()

    if (
      new TextEncoder().encode(rawBody).byteLength >
      MAX_WEBHOOK_BODY_BYTES
    ) {
      return new Response('Payload too large', { status: 413 })
    }

    let decodedAuth = ''

    try {
      decodedAuth =
        atob(authHeader)
    } catch {
      console.error(
        'MultiSafepay Auth header kon niet worden gedecodeerd'
      )

      return new Response(
        'Unauthorized',
        {
          status: 401,
        }
      )
    }

    const separatorIndex =
      decodedAuth.indexOf(':')

    if (separatorIndex === -1) {
      console.error(
        'Ongeldige MultiSafepay Auth header'
      )

      return new Response(
        'Unauthorized',
        {
          status: 401,
        }
      )
    }

    const authTimestamp =
      decodedAuth.slice(
        0,
        separatorIndex
      )

    const receivedSignature =
      decodedAuth.slice(
        separatorIndex + 1
      )

    // =============================
    // HMAC CONTROLEREN
    // =============================

    const signatureInput =
      `${authTimestamp}:${rawBody}`

    const expectedSignature =
      await createHmacSha512(
        apiKey,
        signatureInput
      )

    if (!constantTimeEqual(expectedSignature, receivedSignature)) {
      console.error(
        'MultiSafepay HMAC klopt niet'
      )

      return new Response(
        'Unauthorized',
        {
          status: 401,
        }
      )
    }

    // =============================
    // TIMESTAMP CONTROLEREN
    // =============================

    const authTimestampNumber =
      Number(authTimestamp)

    const nowSeconds =
      Math.floor(Date.now() / 1000)

    if (
      !Number.isFinite(
        authTimestampNumber
      ) ||
      Math.abs(
        nowSeconds -
          authTimestampNumber
      ) > 600
    ) {
      console.error(
        'MultiSafepay webhook timestamp is te oud'
      )

      return new Response(
        'Unauthorized',
        {
          status: 401,
        }
      )
    }

    // =============================
    // URL PARAMETERS
    // =============================

    const url =
      new URL(req.url)

    const transactionId =
      url.searchParams.get(
        'transactionid'
      )

    const urlTimestamp =
      url.searchParams.get(
        'timestamp'
      )

    if (
      !transactionId ||
      !urlTimestamp
    ) {
      console.error(
        'transactionid of timestamp ontbreekt'
      )

      return new Response(
        'Bad request',
        {
          status: 400,
        }
      )
    }

    // =============================
    // JSON BODY
    // =============================

    let payload: any

    try {
      payload =
        JSON.parse(rawBody)
    } catch {
      console.error(
        'Webhook body is geen geldige JSON'
      )

      return new Response(
        'Bad request',
        {
          status: 400,
        }
      )
    }

    const orderIdFromMsp =
      payload?.order_id ||
      transactionId

    if (
      payload?.order_id != null &&
      String(payload.order_id) !== transactionId
    ) {
      console.error('Webhook transactionid en order_id komen niet overeen')
      return new Response('Bad request', { status: 400 })
    }

    const multisafepayStatus =
      String(
        payload?.status || ''
      ).toLowerCase()

    const financialStatus =
      String(
        payload?.financial_status ||
          ''
      ).toLowerCase()

    console.log(
      'MultiSafepay webhook ontvangen:',
      {
        transactionId,
        orderId:
          orderIdFromMsp,
        multisafepayStatus,
        financialStatus,
      }
    )

    // =============================
    // SUPABASE CLIENT
    // =============================

    const supabase =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      )

    // =============================
    // PAYMENT ZOEKEN
    // =============================

    const {
      data: payment,
      error: paymentLoadError,
    } = await supabase
      .from('payments')
      .select('*')
      .eq(
        'provider',
        'multisafepay'
      )
      .eq(
        'provider_order_id',
        orderIdFromMsp
      )
      .maybeSingle()

    if (paymentLoadError) {
      console.error(
        'Payment zoeken mislukt:',
        paymentLoadError
      )

      return new Response(
        'Database error',
        {
          status: 500,
        }
      )
    }

    // Losse handmatige TEST-orders kunnen
    // zonder lokale payment bestaan.
    if (!payment) {
      console.log(
        `Geen lokale payment gevonden voor ${orderIdFromMsp}`
      )

      return new Response(
        'OK',
        {
          status: 200,
          headers: {
            'Content-Type':
              'text/plain',
          },
        }
      )
    }

    // =============================
    // BEDRAG + VALUTA CONTROLEREN
    // =============================

    const webhookAmount = Number(payload?.amount)
    const storedAmount = Number(payment.amount)
    const webhookCurrency = String(payload?.currency || '').toUpperCase()
    const storedCurrency = String(payment.currency || '').toUpperCase()

    if (
      !Number.isInteger(webhookAmount) ||
      !Number.isInteger(storedAmount) ||
      webhookAmount !== storedAmount ||
      webhookCurrency !== storedCurrency ||
      storedCurrency !== 'EUR'
    ) {
      console.error('Webhookbedrag of valuta komt niet overeen', {
        paymentId: payment.id,
        orderId: orderIdFromMsp,
      })

      return new Response('Payment mismatch', { status: 400 })
    }

    // =============================
    // STATUS VEILIG BEPALEN
    // =============================

    const incomingStatus = mapMultiSafepayStatus(
      multisafepayStatus,
      financialStatus,
    )

    // Onbekende toekomstige status: wel erkennen zodat MultiSafepay geen
    // eindeloze retries doet, maar nooit de lokale betaalstatus veranderen.
    if (!incomingStatus) {
      console.warn('Onbekende MultiSafepay-status genegeerd', {
        orderId: orderIdFromMsp,
        multisafepayStatus,
        financialStatus,
      })
      return new Response('OK', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    const storedPaymentStatus: PaymentStatus =
      ['pending', 'paid', 'failed', 'cancelled', 'refunded'].includes(
        String(payment.status),
      )
        ? payment.status as PaymentStatus
        : 'pending'

    const nextPaymentStatus = resolveMonotonicStatus(
      storedPaymentStatus,
      incomingStatus,
    )

    const now =
      new Date().toISOString()

    // =============================
    // PAYMENT UPDATEN
    // =============================

    const paymentUpdate:
      Record<string, any> = {
      status:
        nextPaymentStatus,

      updated_at:
        now,
    }

    if (
      payload?.transaction_id != null
    ) {
      paymentUpdate
        .provider_transaction_id =
        String(
          payload.transaction_id
        )
    }

    if (
      nextPaymentStatus ===
      'paid' &&
      storedPaymentStatus !== 'paid'
    ) {
      paymentUpdate.paid_at =
        now

      paymentUpdate.failed_at =
        null

      paymentUpdate.failure_reason =
        null
    }

    if (
      nextPaymentStatus ===
      'failed' &&
      storedPaymentStatus !== 'failed'
    ) {
      paymentUpdate.failed_at =
        now

      paymentUpdate
        .failure_reason =
        payload?.reason ||
        'MultiSafepay betaling mislukt'
    }

    if (
      nextPaymentStatus === 'refunded' &&
      storedPaymentStatus !== 'refunded'
    ) {
      const refundedAmount = Number(payload?.amount_refunded)

      if (!Number.isInteger(refundedAmount) || refundedAmount !== storedAmount) {
        console.error('Volledige refund heeft een ongeldig bedrag', {
          paymentId: payment.id,
          orderId: orderIdFromMsp,
        })
        return new Response('Refund mismatch', { status: 400 })
      }

      paymentUpdate.refund_amount = refundedAmount
      paymentUpdate.refunded_at = now
    }

    const {
      data: updatedPayment,
      error: paymentUpdateError,
    } = await supabase
      .from('payments')
      .update(paymentUpdate)
      .eq('id', payment.id)
      .eq('status', payment.status)
      .select('id')
      .maybeSingle()

    if (paymentUpdateError || !updatedPayment) {
      console.error(
        'Payment updaten mislukt of gelijktijdig gewijzigd:',
        paymentUpdateError
      )

      return new Response(
        'Database error',
        {
          status: 500,
        }
      )
    }

    // =============================
    // ORDER OPHALEN
    // =============================

    const {
      data: order,
      error: orderLoadError,
    } = await supabase
      .from('orders')
      .select(
        'id,order_number,payment_status'
      )
      .eq(
        'id',
        payment.order_id
      )
      .maybeSingle()

    if (
      orderLoadError ||
      !order
    ) {
      console.error(
        'Order ophalen mislukt:',
        orderLoadError
      )

      return new Response(
        'Database error',
        {
          status: 500,
        }
      )
    }

    // =============================
    // ORDER UPDATEN
    // =============================

    const storedOrderPaymentStatus: PaymentStatus =
      ['pending', 'paid', 'failed', 'cancelled', 'refunded'].includes(
        String(order.payment_status),
      )
        ? order.payment_status as PaymentStatus
        : 'pending'

    const nextOrderPaymentStatus = resolveMonotonicStatus(
      storedOrderPaymentStatus,
      nextPaymentStatus,
    )

    const orderUpdate:
      Record<string, any> = {
      payment_status:
        nextOrderPaymentStatus,

      updated_at:
        now,
    }

    if (
      nextOrderPaymentStatus ===
      'paid' &&
      storedOrderPaymentStatus !== 'paid'
    ) {
      orderUpdate.paid_at =
        now
    }

    const {
      data: updatedOrder,
      error: orderUpdateError,
    } = await supabase
      .from('orders')
      .update(orderUpdate)
      .eq('id', order.id)
      .eq('payment_status', order.payment_status)
      .select('id')
      .maybeSingle()

    if (orderUpdateError || !updatedOrder) {
      console.error(
        'Order updaten mislukt of gelijktijdig gewijzigd:',
        orderUpdateError
      )

      return new Response(
        'Database error',
        {
          status: 500,
        }
      )
    }

    // =============================
    // ALLEEN BIJ PAID:
    // KITCHEN LABELS MAKEN
    // =============================

    if (
      nextPaymentStatus ===
      'paid'
    ) {
      await createKitchenLabelsAfterPayment(
        supabase,
        String(order.id),
        order.order_number ||
          orderIdFromMsp
      )
    }

    console.log(
      `Payment ${payment.id} bijgewerkt naar ${nextPaymentStatus}`
    )

    return new Response(
      'OK',
      {
        status: 200,
        headers: {
          'Content-Type':
            'text/plain',
        },
      }
    )
  } catch (error) {
    console.error(
      'MultiSafepay webhook fout:',
      error
    )

    return new Response(
      'Server error',
      {
        status: 500,
      }
    )
  }
})
