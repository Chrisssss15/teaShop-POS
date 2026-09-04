// Supabase Edge Function: create-customer-checkout-v2
//
// Publieke customer/QR-checkout:
// 1. Valideert en normaliseert de publieke request.
// 2. Laat public.create_customer_order alle prijzen en totalen server-side bepalen.
// 3. Maakt met uitsluitend dat serverbedrag de MultiSafepay-order aan.
// 4. Slaat de payment-URL met de service-role op.
//
// Vereiste secrets:
// - SUPABASE_URL                    (door Supabase beschikbaar)
// - SUPABASE_SERVICE_ROLE_KEY       (door Supabase beschikbaar)
// - MULTISAFEPAY_API_KEY
// - MULTISAFEPAY_WEBHOOK_URL
// - RATE_LIMIT_SALT                (minimaal 32 willekeurige tekens)
//
// Optionele secrets:
// - MULTISAFEPAY_API_URL            (standaard: testomgeving)
// - CUSTOMER_ALLOWED_ORIGINS        (kommagescheiden web-origins)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.108.2'

const MAX_BODY_BYTES = 64 * 1024
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const TOKEN_RE = /^[0-9a-f]{64}$/

type JsonObject = Record<string, unknown>

type CheckoutItem = {
  product_id: string
  quantity: number
  cup_size: string | null
  ice_level: string | null
  sugar_level: string | null
  topping_ids: string[]
  modifier_option_ids: string[]
}

type CheckoutResult = {
  reused: boolean
  order_id: string
  order_number: string
  pickup_code: string
  status: string
  payment_status: string
  gross_total: number
  net_total: number
  vat_total: number
  amount_cents: number
  payment_id: string
  customer_token: string
  created_at: string
}

function requestOrigin(req: Request): string | null {
  const value = req.headers.get('Origin')
  if (!value) return null

  try {
    return new URL(value).origin.replace(/\/$/, '')
  } catch {
    return null
  }
}

function isAllowedBrowserOrigin(req: Request): boolean {
  const origin = requestOrigin(req)

  // Niet-browserclients (zoals een native app of MultiSafepay) sturen meestal
  // geen Origin-header. Hun invoer wordt verderop apart gevalideerd.
  if (!origin) return req.headers.get('Origin') === null

  const allowedOrigins = parseAllowedOrigins()
  if (allowedOrigins.has(origin)) return true

  // Lokale ontwikkelomgevingen blijven op elk privé-IP werken. Een openbaar
  // domein moet altijd expliciet in CUSTOMER_ALLOWED_ORIGINS staan.
  try {
    const url = new URL(origin)
    return isPrivateNetworkHostname(url.hostname) &&
      ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

function corsHeaders(req: Request): Record<string, string> {
  const origin = requestOrigin(req)
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }

  if (origin && isAllowedBrowserOrigin(req)) {
    headers['Access-Control-Allow-Origin'] = origin
  }

  return headers
}

function json(
  req: Request,
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  })
}

type RateLimitResult = {
  allowed: boolean
  remaining: number
  retry_after_seconds: number
}

function clientAddress(req: Request): string {
  const forwarded = req.headers
    .get('x-forwarded-for')
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  // De proxy voegt het echte verbindingsadres achteraan toe. Door de laatste
  // waarde te gebruiken kan een browser niet zelf het eerste adres kiezen.
  return forwarded?.at(-1) ??
    req.headers.get('x-real-ip')?.trim() ??
    req.headers.get('cf-connecting-ip')?.trim() ??
    'unknown'
}

async function protectedKey(secret: string, value: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value))
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function consumeRateLimit(
  admin: ReturnType<typeof createClient>,
  scope: string,
  keyHash: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const { data, error } = await admin.rpc('consume_edge_rate_limit', {
    p_scope: scope,
    p_key_hash: keyHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    console.error('Rate-limitcontrole mislukt', { scope, message: error.message })
    throw new Error('RATE_LIMIT_UNAVAILABLE')
  }

  const row = Array.isArray(data) ? data[0] : data
  if (
    !isObject(row) || typeof row.allowed !== 'boolean' ||
    typeof row.remaining !== 'number' ||
    typeof row.retry_after_seconds !== 'number'
  ) {
    console.error('Ongeldig antwoord van rate-limitfunctie', { scope })
    throw new Error('RATE_LIMIT_INVALID_RESPONSE')
  }

  return {
    allowed: row.allowed,
    remaining: row.remaining,
    retry_after_seconds: row.retry_after_seconds,
  }
}

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function requiredString(
  value: unknown,
  minLength: number,
  maxLength: number,
): string | null {
  if (typeof value !== 'string') return null
  const clean = value.trim()
  if (clean.length < minLength || clean.length > maxLength) return null
  return clean
}

function optionalChoice(
  value: unknown,
  choices: readonly string[],
): string | null | undefined {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string' || !choices.includes(value)) return undefined
  return value
}

function normalizeIdArray(value: unknown, max: number): string[] | null {
  if (value === null || value === undefined) return []
  if (!Array.isArray(value) || value.length > max) return null

  const ids: string[] = []
  for (const item of value) {
    if (typeof item !== 'string' || !UUID_RE.test(item)) return null
    ids.push(item.toLowerCase())
  }

  if (new Set(ids).size !== ids.length) return null
  return ids
}

function normalizeItems(value: unknown): CheckoutItem[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 50) {
    return null
  }

  let totalQuantity = 0
  const normalized: CheckoutItem[] = []

  for (const raw of value) {
    if (!isObject(raw)) return null

    const productId = requiredString(raw.product_id, 36, 36)
    const quantity = raw.quantity
    const cupSize = optionalChoice(raw.cup_size, ['medium', 'large'])
    const iceLevel = optionalChoice(raw.ice_level, [
      'no_ice',
      'less_ice',
      'normal_ice',
      'warm',
    ])
    const sugarLevel = optionalChoice(raw.sugar_level, [
      'none',
      'minimal',
      'less',
      'normal',
      'sweet',
    ])
    const toppingIds = normalizeIdArray(raw.topping_ids, 20)
    const modifierOptionIds = normalizeIdArray(raw.modifier_option_ids, 20)

    if (
      !productId ||
      !UUID_RE.test(productId) ||
      !Number.isInteger(quantity) ||
      Number(quantity) < 1 ||
      Number(quantity) > 20 ||
      cupSize === undefined ||
      iceLevel === undefined ||
      sugarLevel === undefined ||
      toppingIds === null ||
      modifierOptionIds === null
    ) {
      return null
    }

    totalQuantity += Number(quantity)
    if (totalQuantity > 50) return null

    normalized.push({
      product_id: productId.toLowerCase(),
      quantity: Number(quantity),
      cup_size: cupSize,
      ice_level: iceLevel,
      sugar_level: sugarLevel,
      topping_ids: toppingIds,
      modifier_option_ids: modifierOptionIds,
    })
  }

  return normalized
}

function parseAllowedOrigins(): Set<string> {
  return new Set(
    (Deno.env.get('CUSTOMER_ALLOWED_ORIGINS') || '')
      .split(',')
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean),
  )
}

function isPrivateNetworkHostname(hostname: string): boolean {
  const normalized = hostname
    .trim()
    .toLowerCase()
    .replace(/^\[/, '')
    .replace(/\]$/, '')

  if (['localhost', '127.0.0.1', '::1'].includes(normalized)) {
    return true
  }

  // Lokale IPv6-adressen: unique-local (fc00::/7) en link-local (fe80::/10).
  if (
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    /^fe[89ab]/.test(normalized)
  ) {
    return true
  }

  const parts = normalized.split('.')
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) {
    return false
  }

  const octets = parts.map(Number)
  if (octets.some((octet) => octet < 0 || octet > 255)) return false

  return (
    octets[0] === 10 ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 169 && octets[1] === 254)
  )
}

function buildReturnUrls(
  req: Request,
  returnMode: unknown,
  rawReturnUrl: unknown,
  orderNumber: string,
): { redirectUrl: string; cancelUrl: string } | null {
  if (returnMode === 'native') {
    const base = `bluecup://payment-return?order=${encodeURIComponent(orderNumber)}`
    return { redirectUrl: base, cancelUrl: `${base}&payment_cancelled=1` }
  }

  if (returnMode !== 'web' || typeof rawReturnUrl !== 'string') return null

  let returnUrl: URL
  try {
    returnUrl = new URL(rawReturnUrl)
  } catch {
    return null
  }

  if (!['https:', 'http:'].includes(returnUrl.protocol)) return null
  if (returnUrl.username || returnUrl.password) return null

  // Bescherm tegen een open redirect. Als een expliciete allowlist is gezet,
  // moet de URL daarin staan. Zonder allowlist moet hij gelijk zijn aan de
  // browser-Origin die de request heeft verstuurd.
  const allowedOrigins = parseAllowedOrigins()
  const requestOrigin = req.headers.get('Origin')?.replace(/\/$/, '') || ''
  const returnOrigin = returnUrl.origin.replace(/\/$/, '')
  const isSameOrigin = Boolean(requestOrigin && requestOrigin === returnOrigin)
  const isLocalNetworkReturn = isPrivateNetworkHostname(returnUrl.hostname)
  const isExplicitlyAllowed = allowedOrigins.has(returnOrigin)

  if (allowedOrigins.size > 0) {
    // Een expliciete productie-allowlist blijft leidend. Lokale netwerkadressen
    // mogen daarnaast dynamisch mee, maar uitsluitend bij een same-origin request.
    if (!isExplicitlyAllowed && !(isLocalNetworkReturn && isSameOrigin)) return null
  } else if (!isSameOrigin) {
    return null
  }

  // Onversleuteld http is alleen toegestaan binnen een lokaal netwerk.
  if (returnUrl.protocol === 'http:' && !isLocalNetworkReturn) {
    return null
  }

  returnUrl.hash = ''
  returnUrl.searchParams.set('mode', 'customer')
  returnUrl.searchParams.set('order', orderNumber)
  returnUrl.searchParams.delete('payment')
  returnUrl.searchParams.delete('payment_cancelled')
  returnUrl.searchParams.delete('transactionid')

  const cancelUrl = new URL(returnUrl.toString())
  cancelUrl.searchParams.set('payment_cancelled', '1')

  return {
    redirectUrl: returnUrl.toString(),
    cancelUrl: cancelUrl.toString(),
  }
}

function publicOrderError(message: string): { status: number; error: string } {
  if (message.includes('TOTAL_MISMATCH')) {
    return {
      status: 409,
      error: 'De prijzen zijn gewijzigd. Vernieuw het menu en probeer opnieuw.',
    }
  }

  if (
    /(PRODUCT_SOLD_OUT|TOPPING_SOLD_OUT|PRODUCT_INACTIVE|TOPPING_INACTIVE)/.test(
      message,
    )
  ) {
    return {
      status: 409,
      error: 'Een gekozen product of topping is niet meer beschikbaar.',
    }
  }

  if (
    /(INVALID_|EMPTY_ORDER|TOO_MANY_|DUPLICATE_|TOPPING_NOT_ALLOWED|MODIFIERS_NOT_SUPPORTED)/.test(
      message,
    )
  ) {
    return { status: 400, error: 'De bestelling bevat ongeldige keuzes.' }
  }

  if (message.includes('IDEMPOTENCY_CONFLICT')) {
    return { status: 409, error: 'Deze bestelrequest kan niet opnieuw worden gebruikt.' }
  }

  return { status: 500, error: 'Bestelling aanmaken mislukt.' }
}

Deno.serve(async (req: Request) => {
  if (!isAllowedBrowserOrigin(req)) {
    return json(req, { error: 'Origin niet toegestaan.' }, 403)
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) })
  }

  if (req.method !== 'POST') {
    return json(req, { error: 'Alleen POST toegestaan.' }, 405)
  }

  const contentLength = Number(req.headers.get('Content-Length') || 0)
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json(req, { error: 'Request is te groot.' }, 413)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const apiKey = Deno.env.get('MULTISAFEPAY_API_KEY')
  const webhookUrl = Deno.env.get('MULTISAFEPAY_WEBHOOK_URL')
  const rateLimitSalt = Deno.env.get('RATE_LIMIT_SALT')
  const apiUrl = (
    Deno.env.get('MULTISAFEPAY_API_URL') ||
    'https://testapi.multisafepay.com/v1/json'
  ).replace(/\/$/, '')

  if (
    !supabaseUrl || !serviceRoleKey || !apiKey || !webhookUrl ||
    !rateLimitSalt || rateLimitSalt.length < 32
  ) {
    console.error('Checkoutconfiguratie ontbreekt.')
    return json(req, { error: 'Betaalserver is niet correct geconfigureerd.' }, 500)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    const addressHash = await protectedKey(
      rateLimitSalt,
      `checkout-ip:${clientAddress(req)}`,
    )
    const policies = [
      { scope: 'customer_checkout_ip_minute', limit: 12, window: 60 },
      { scope: 'customer_checkout_ip_hour', limit: 120, window: 3600 },
    ] as const

    for (const policy of policies) {
      const result = await consumeRateLimit(
        admin,
        policy.scope,
        addressHash,
        policy.limit,
        policy.window,
      )
      if (!result.allowed) {
        return json(
          req,
          { error: 'Te veel bestelverzoeken. Probeer het later opnieuw.' },
          429,
          { 'Retry-After': String(result.retry_after_seconds) },
        )
      }
    }
  } catch {
    return json(
      req,
      { error: 'Beveiligingscontrole is tijdelijk niet beschikbaar.' },
      503,
    )
  }

  let rawBody: string
  try {
    rawBody = await req.text()
  } catch {
    return json(req, { error: 'Request kon niet worden gelezen.' }, 400)
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return json(req, { error: 'Request is te groot.' }, 413)
  }

  let body: JsonObject
  try {
    const parsed = JSON.parse(rawBody)
    if (!isObject(parsed)) throw new Error('not an object')
    body = parsed
  } catch {
    return json(req, { error: 'Ongeldige JSON-request.' }, 400)
  }

  const clientRequestId = requiredString(body.clientRequestId, 36, 36)
  const customerToken = requiredString(body.customerToken, 64, 64)
  const customerName = requiredString(body.customerName, 1, 80)
  const customerPhone = requiredString(body.customerPhone, 5, 32)
  const expectedTotal = body.expectedTotal
  const items = normalizeItems(body.items)

  if (
    !clientRequestId ||
    !UUID_RE.test(clientRequestId) ||
    !customerToken ||
    !TOKEN_RE.test(customerToken) ||
    !customerName ||
    !customerPhone ||
    (expectedTotal !== null &&
      expectedTotal !== undefined &&
      (typeof expectedTotal !== 'number' ||
        !Number.isFinite(expectedTotal) ||
        expectedTotal <= 0)) ||
    !items
  ) {
    return json(req, { error: 'Ongeldige bestelgegevens.' }, 400)
  }

  try {
    const requestHash = await protectedKey(
      rateLimitSalt,
      `checkout-request:${clientRequestId.toLowerCase()}`,
    )
    const result = await consumeRateLimit(
      admin,
      'customer_checkout_request_10m',
      requestHash,
      5,
      600,
    )
    if (!result.allowed) {
      return json(
        req,
        { error: 'Deze bestelrequest is te vaak herhaald.' },
        429,
        { 'Retry-After': String(result.retry_after_seconds) },
      )
    }
  } catch {
    return json(
      req,
      { error: 'Beveiligingscontrole is tijdelijk niet beschikbaar.' },
      503,
    )
  }

  const { data: rpcData, error: rpcError } = await admin.rpc(
    'create_customer_order',
    {
      p_client_request_id: clientRequestId.toLowerCase(),
      p_customer_token: customerToken,
      p_customer_name: customerName,
      p_customer_phone: customerPhone,
      p_expected_total:
        typeof expectedTotal === 'number' ? expectedTotal : null,
      p_items: items,
    },
  )

  if (rpcError || !isObject(rpcData)) {
    const safeError = publicOrderError(rpcError?.message || '')
    console.error('create_customer_order mislukt:', rpcError?.code || 'unknown')
    return json(req, { error: safeError.error }, safeError.status)
  }

  const order = rpcData as unknown as CheckoutResult
  if (
    !UUID_RE.test(order.order_id || '') ||
    !UUID_RE.test(order.payment_id || '') ||
    typeof order.order_number !== 'string' ||
    !Number.isInteger(order.amount_cents) ||
    order.amount_cents <= 0 ||
    order.amount_cents > 1_000_000
  ) {
    console.error('create_customer_order gaf een ongeldig resultaat.')
    return json(req, { error: 'Bestelling aanmaken mislukt.' }, 500)
  }

  const returnUrls = buildReturnUrls(
    req,
    body.returnMode,
    body.returnUrl,
    order.order_number,
  )

  if (!returnUrls) {
    return json(req, { error: 'Ongeldige terugkeer-URL.' }, 400)
  }

  const { data: payment, error: paymentReadError } = await admin
    .from('payments')
    .select('id, order_id, provider_order_id, amount, currency, status, payment_url')
    .eq('id', order.payment_id)
    .eq('order_id', order.order_id)
    .eq('provider', 'multisafepay')
    .maybeSingle()

  if (
    paymentReadError ||
    !payment ||
    payment.provider_order_id !== order.order_number ||
    payment.amount !== order.amount_cents ||
    payment.currency !== 'EUR'
  ) {
    console.error('Lokale paymentcontrole mislukt.')
    return json(req, { error: 'Betaling voorbereiden mislukt.' }, 500)
  }

  // Veilige, idempotente herhaling: gebruik de eerder opgeslagen provider-URL.
  if (typeof payment.payment_url === 'string' && payment.payment_url.length > 0) {
    return json(req, {
      success: true,
      reused: true,
      paymentUrl: payment.payment_url,
      orderId: order.order_id,
      orderNumber: order.order_number,
      pickupCode: order.pickup_code,
      customerToken: order.customer_token,
    })
  }

  if (['paid', 'completed'].includes(String(payment.status).toLowerCase())) {
    return json(req, { error: 'Deze bestelling is al betaald.' }, 409)
  }

  // Een eerdere mislukte poging mag server-side opnieuw worden gestart.
  await admin
    .from('payments')
    .update({
      status: 'pending',
      failure_reason: null,
      failed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.id)
    .eq('order_id', order.order_id)

  const paymentPayload = {
    type: 'redirect',
    order_id: order.order_number,
    currency: 'EUR',
    amount: order.amount_cents,
    description: `Blue Cup bestelling ${order.order_number}`,
    payment_options: {
      notification_url: webhookUrl,
      notification_method: 'POST',
      redirect_url: returnUrls.redirectUrl,
      cancel_url: returnUrls.cancelUrl,
    },
    customer: {
      first_name: customerName,
    },
  }

  let providerResponse: Response
  let providerResult: unknown
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15_000)

  try {
    providerResponse = await fetch(
      `${apiUrl}/orders?api_key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentPayload),
        signal: controller.signal,
      },
    )
    providerResult = await providerResponse.json().catch(() => null)
  } catch (error) {
    console.error(
      'MultiSafepay request mislukt:',
      error instanceof DOMException && error.name === 'AbortError'
        ? 'timeout'
        : 'network',
    )

    await admin
      .from('payments')
      .update({
        status: 'failed',
        failed_at: new Date().toISOString(),
        failure_reason: 'Provider tijdelijk niet bereikbaar',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id)

    return json(req, { error: 'Betaaldienst tijdelijk niet bereikbaar.' }, 502)
  } finally {
    clearTimeout(timeoutId)
  }

  const providerObject = isObject(providerResult) ? providerResult : null
  const providerData =
    providerObject && isObject(providerObject.data) ? providerObject.data : null
  const paymentUrl = providerData?.payment_url

  if (
    !providerResponse.ok ||
    providerObject?.success !== true ||
    typeof paymentUrl !== 'string' ||
    !/^https:\/\//i.test(paymentUrl)
  ) {
    console.error('MultiSafepay order mislukt:', providerResponse.status)

    await admin
      .from('payments')
      .update({
        status: 'failed',
        failed_at: new Date().toISOString(),
        failure_reason: 'Provider heeft de betaling geweigerd',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id)

    return json(req, { error: 'Betaling starten mislukt.' }, 502)
  }

  const { error: paymentUpdateError } = await admin
    .from('payments')
    .update({
      payment_url: paymentUrl,
      provider_order_id: order.order_number,
      status: 'pending',
      failure_reason: null,
      failed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.id)
    .eq('order_id', order.order_id)
    .eq('amount', order.amount_cents)

  if (paymentUpdateError) {
    console.error('Payment-URL opslaan mislukt:', paymentUpdateError.code)
    return json(req, { error: 'Betaling opslaan mislukt.' }, 500)
  }

  return json(req, {
    success: true,
    reused: Boolean(order.reused),
    paymentUrl,
    orderId: order.order_id,
    orderNumber: order.order_number,
    pickupCode: order.pickup_code,
    customerToken: order.customer_token,
  })
})
