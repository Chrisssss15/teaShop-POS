const EPSON_PRINTER_URL =
  'https://192.168.178.34/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000'

export type EpsonReceiptItem = {
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
  cupSize?: string | null
  iceLevel?: string | null
  sugarLevel?: string | null
  toppings?: Array<{ name: string; price?: number }> | null
}

export type EpsonReceipt = {
  orderNumber: string
  items: EpsonReceiptItem[]
  total: number
  netTotal?: number
  vatTotal?: number
  paymentMethod: string
  createdAt?: string
}

const RECEIPT_WIDTH = 42
const DIVIDER = '-'.repeat(RECEIPT_WIDTH)

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function formatMoney(value: number) {
  return `EUR ${Number(value || 0).toFixed(2)}`
}

function formatPaymentMethod(value: string) {
  if (value === 'cash') return 'Contant'
  if (value === 'card') return 'PIN'
  if (value === 'online_fake') return 'Online'
  if (value === 'pay_at_counter') return 'Betalen aan balie'
  return value
}

function formatCupSize(value?: string | null) {
  if (value === 'large') return 'Large'
  if (value === 'medium') return 'Medium'
  return ''
}

function formatIceLevel(value?: string | null) {
  if (value === 'no_ice') return 'Geen ijs'
  if (value === 'less_ice') return 'Minder ijs'
  if (value === 'normal_ice') return 'Normaal ijs'
  if (value === 'extra_ice') return 'Extra ijs'
  if (value === 'warm') return 'Warm'
  return ''
}

function formatSugarLevel(value?: string | null) {
  if (value === 'none') return 'Geen suiker'
  if (value === 'minimal') return 'Minimaal suiker'
  if (value === 'less') return 'Minder suiker'
  if (value === 'normal') return 'Normale suiker'
  if (value === 'sweet') return 'Zoet'
  return ''
}

function alignRow(left: string, right: string) {
  const safeRight = right.slice(0, RECEIPT_WIDTH)
  const maxLeftLength = Math.max(1, RECEIPT_WIDTH - safeRight.length - 1)
  const safeLeft = left.slice(0, maxLeftLength)
  const spaces = Math.max(
    1,
    RECEIPT_WIDTH - safeLeft.length - safeRight.length
  )

  return `${safeLeft}${' '.repeat(spaces)}${safeRight}`
}

function wrapText(text: string, width: number) {
  const words = text.trim().split(/\s+/)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    if (!current) {
      current = word
      continue
    }

    if (`${current} ${word}`.length <= width) {
      current += ` ${word}`
    } else {
      lines.push(current)
      current = word
    }
  }

  if (current) lines.push(current)
  return lines
}

function makeProductLines(item: EpsonReceiptItem) {
  const leftPrefix = `${item.quantity}x `
  const price = formatMoney(item.lineTotal)
  const availableForName = Math.max(
    12,
    RECEIPT_WIDTH - leftPrefix.length - price.length - 1
  )

  const nameLines = wrapText(item.name, availableForName)
  const firstName = nameLines.shift() || item.name

  const lines = [
    alignRow(`${leftPrefix}${firstName}`, price),
    ...nameLines.map((line) => `   ${line}`),
  ]

  return lines
}

function makeItemXml(item: EpsonReceiptItem) {
  const productLines = makeProductLines(item)

  const modifiers = [
    formatCupSize(item.cupSize),
    formatIceLevel(item.iceLevel),
    formatSugarLevel(item.sugarLevel),
  ].filter(Boolean)

  const toppingNames = (item.toppings ?? [])
    .map((topping) => topping.name)
    .filter(Boolean)

  const productXml = productLines
    .map((line, index) =>
      index === 0
        ? `<text em="true">${escapeXml(`${line}\n`)}</text>`
        : `<text>${escapeXml(`${line}\n`)}</text>`
    )
    .join('')

  const modifiersXml =
    modifiers.length > 0
      ? `<text>${escapeXml(`   ${modifiers.join(' / ')}\n`)}</text>`
      : ''

  const toppingsXml = toppingNames
    .map((name) => `<text>${escapeXml(`   + ${name}\n`)}</text>`)
    .join('')

  return `
    ${productXml}
    ${modifiersXml}
    ${toppingsXml}
    <feed line="1"/>
  `
}

export async function printEpsonReceipt(receipt: EpsonReceipt) {
  const createdAt = receipt.createdAt
    ? new Date(receipt.createdAt)
    : new Date()

  const dateText = createdAt.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const timeText = createdAt.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const netLine =
    receipt.netTotal != null
      ? `<text>${escapeXml(`${alignRow('Excl. BTW', formatMoney(receipt.netTotal))}\n`)}</text>`
      : ''

  const vatLine =
    receipt.vatTotal != null
      ? `<text>${escapeXml(`${alignRow('BTW', formatMoney(receipt.vatTotal))}\n`)}</text>`
      : ''

  const xml = `
    <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
      <s:Body>
        <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">

          <text align="center" width="2" height="2" em="true">BLUE CUP\n</text>
          <text align="center" em="true">TEA &amp; BUBBLE TEA\n</text>
          <text align="center">KASSABON\n</text>

          <feed line="1"/>
          <text>${escapeXml(`${DIVIDER}\n`)}</text>

          <text>${escapeXml(`${alignRow('Order', receipt.orderNumber)}\n`)}</text>
          <text>${escapeXml(`${alignRow('Datum', `${dateText} ${timeText}`)}\n`)}</text>

          <text>${escapeXml(`${DIVIDER}\n`)}</text>
          <feed line="1"/>

          ${receipt.items.map(makeItemXml).join('')}

          <text>${escapeXml(`${DIVIDER}\n`)}</text>

          ${netLine}
          ${vatLine}

          <text>${escapeXml(`${DIVIDER}\n`)}</text>

          <text em="true" width="2" height="2" align="center">
            ${escapeXml(`TOTAAL\n${formatMoney(receipt.total)}\n`)}
          </text>

          <feed line="1"/>

          <text>${escapeXml(
            `${alignRow(
              'Betaalmethode',
              formatPaymentMethod(receipt.paymentMethod)
            )}\n`
          )}</text>

          <feed line="2"/>

          <text align="center" em="true">BEDANKT VOOR JE BEZOEK!\n</text>
          <text align="center">Tot snel bij Blue Cup\n</text>

          <feed line="4"/>
          <cut type="feed"/>

        </epos-print>
      </s:Body>
    </s:Envelope>
  `

  const response = await fetch(EPSON_PRINTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
    },
    body: xml,
  })

  const responseText = await response.text()

  if (!response.ok) {
    throw new Error(`Epson HTTP ${response.status}: ${responseText}`)
  }

  if (/success="false"/i.test(responseText)) {
    throw new Error(`Epson printer weigerde de bon: ${responseText}`)
  }

  console.log('Epson bon succesvol geprint:', receipt.orderNumber)

  return responseText
}
