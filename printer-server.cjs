require('dotenv').config()

const http = require('node:http')
const net = require('node:net')

// =============================
// CONFIG
// =============================

const SERVER_HOST = '127.0.0.1'
const SERVER_PORT = Number(process.env.PRINT_BRIDGE_PORT || 3001)

const PRINTER_IP = process.env.ZEBRA_PRINTER_IP
const PRINTER_PORT = Number(process.env.ZEBRA_PRINTER_PORT || 9100)

if (!PRINTER_IP) {
  console.error('ZEBRA_PRINTER_IP ontbreekt in .env')
  process.exit(1)
}

// =============================
// CORS
// =============================

function isAllowedOrigin(origin) {
  if (!origin) return true

  return (
    /^http:\/\/localhost:\d+$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1:\d+$/.test(origin) ||
    /^http:\/\/192\.168\.178\.\d+:\d+$/.test(origin)
  )
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin

  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }

  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

// =============================
// JSON RESPONSE
// =============================

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

// =============================
// IDEMPOTENCY CACHE
// =============================
// De Zebra kan een label fysiek ontvangen terwijl de HTTP-response verloren
// gaat (netwerk-hik / client-timeout). De POS biedt het label dan opnieuw aan.
// Deze in-memory cache onthoudt recent succesvol geprinte labelId's en
// beantwoordt een herhaling met { ok: true, duplicate: true } ZONDER opnieuw
// naar de printer te schrijven. De cache verdwijnt bij herstart van de bridge
// (voldoende voor MVP) en wordt periodiek + per request opgeschoond.

const PRINT_IDEMPOTENCY_TTL_MS = 5 * 60 * 1000
const recentlyPrintedLabels = new Map() // labelId -> timestamp in ms

function prunePrintCache(nowMs) {
  for (const [labelId, ts] of recentlyPrintedLabels) {
    if (nowMs - ts > PRINT_IDEMPOTENCY_TTL_MS) {
      recentlyPrintedLabels.delete(labelId)
    }
  }
}

setInterval(() => prunePrintCache(Date.now()), 60_000)

// =============================
// ZEBRA PRINT
// =============================

function sendZplToPrinter(zpl) {
  return new Promise((resolve, reject) => {
    let finished = false

    const finishWithError = (error) => {
      if (finished) return

      finished = true
      reject(error)
    }

    const socket = net.createConnection(
      {
        host: PRINTER_IP,
        port: PRINTER_PORT,
      },
      () => {
        socket.write(Buffer.from(zpl, 'utf8'), (error) => {
          if (error) {
            finishWithError(error)
            socket.destroy()
            return
          }

          socket.end(() => {
            if (finished) return

            finished = true
            resolve()
          })
        })
      }
    )

    socket.setTimeout(5000, () => {
      socket.destroy()
      finishWithError(
        new Error('Timeout bij verbinden met de Zebra-printer.')
      )
    })

    socket.on('error', finishWithError)
  })
}

// =============================
// HTTP SERVER
// =============================

const server = http.createServer((req, res) => {
  setCorsHeaders(req, res)

  if (!isAllowedOrigin(req.headers.origin)) {
    sendJson(res, 403, {
      ok: false,
      error: 'Origin niet toegestaan.',
    })
    return
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, {
      ok: true,
      printer: `${PRINTER_IP}:${PRINTER_PORT}`,
      label: '50mm x 43mm',
    })
    return
  }

  if (req.method !== 'POST' || req.url !== '/print') {
    sendJson(res, 404, {
      ok: false,
      error: 'Route niet gevonden.',
    })
    return
  }

  let body = ''

  req.on('data', (chunk) => {
    body += chunk

    if (body.length > 100_000) {
      req.destroy()
    }
  })

  req.on('end', async () => {
    try {
      const payload = JSON.parse(body || '{}')
      const zpl = String(payload.zpl || '')

      if (!zpl.startsWith('^XA') || !zpl.trim().endsWith('^XZ')) {
        sendJson(res, 400, {
          ok: false,
          error: 'Ongeldige ZPL ontvangen.',
        })
        return
      }

      const labelId = payload.labelId ? String(payload.labelId) : ''
      const nowMs = Date.now()
      prunePrintCache(nowMs)

      // Idempotency: zelfde labelId binnen de TTL -> niet opnieuw printen.
      if (labelId && recentlyPrintedLabels.has(labelId)) {
        console.log(
          `[PRINT DUP] ${new Date().toISOString()} | ${
            payload.orderNumber || '-'
          } | ${labelId} (binnen ${
            PRINT_IDEMPOTENCY_TTL_MS / 1000
          }s opnieuw ontvangen, niet opnieuw geprint)`
        )
        sendJson(res, 200, {
          ok: true,
          duplicate: true,
        })
        return
      }

      await sendZplToPrinter(zpl)

      if (labelId) {
        recentlyPrintedLabels.set(labelId, nowMs)
      }

      console.log(
        `[PRINT OK] ${new Date().toISOString()} | ${
          payload.orderNumber || '-'
        } | ${payload.labelId || '-'}`
      )

      sendJson(res, 200, {
        ok: true,
        printer: `${PRINTER_IP}:${PRINTER_PORT}`,
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Onbekende printerfout'

      console.error('[PRINT ERROR]', message)

      sendJson(res, 500, {
        ok: false,
        error: message,
      })
    }
  })
})

// =============================
// START SERVER
// =============================

server.listen(SERVER_PORT, SERVER_HOST, () => {
  console.log('Blue Cup Zebra print bridge gestart')
  console.log(`Bridge:  http://${SERVER_HOST}:${SERVER_PORT}`)
  console.log(`Printer: ${PRINTER_IP}:${PRINTER_PORT}`)
  console.log('Label:   50mm x 43mm @ 203 dpi (400 x 344 dots)')
  console.log('Stoppen: Control + C')
})
