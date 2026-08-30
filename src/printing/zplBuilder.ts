// =============================
// ZPL BUILDER
// =============================
// Pure ZPL / sticker-text generation. Extracted 1:1 from main.ts — the
// produced ZPL string, label size, positions, QR payload and 1/3-2/3-3/3
// numbering are unchanged.
//
// The only signature change vs. main.ts: `qrProductCode` is passed in instead
// of being looked up from the global product catalog (that lookup —
// getQrProductCode — stays in main.ts because it needs `products`).

import type { CupSize, IceLevel, SugarLevel } from '../types/product'
import type { KitchenLabel } from '../types/kitchen'
import type { Order } from '../types/order'

// 50 mm x 43 mm op 203 dpi ≈ 400 x 344 dots.
export const ZEBRA_LABEL_WIDTH_DOTS = 400
export const ZEBRA_LABEL_HEIGHT_DOTS = 344

const CUP_SIZE_QR_CODES: Record<CupSize, string> = {
  medium: 'M',
  large: 'L',
}

const SUGAR_QR_CODES: Record<SugarLevel, string> = {
  none: 'S000',
  minimal: 'S030',
  less: 'S050',
  normal: 'S070',
  sweet: 'S100',
}

const ICE_QR_CODES: Partial<Record<IceLevel, string>> = {
  no_ice: 'NOI',
  less_ice: 'LES',
  normal_ice: 'REG',
  warm: 'HOT',
  extra_ice: 'REG',
}

export function getCupSizeLabel(size: CupSize) {
  return size === 'large' ? 'Large' : 'Medium'
}

export function sanitizeZplText(value: string) {
  return String(value || '')
    .replace(/[\^~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function truncateZplText(value: string, maxLength: number) {
  const clean = sanitizeZplText(value)

  if (clean.length <= maxLength) {
    return clean
  }

  return `${clean.slice(0, Math.max(0, maxLength - 3))}...`
}

export function getStickerIceText(level?: IceLevel | null) {
  if (level === 'no_ice') return 'No ice'
  if (level === 'less_ice') return 'Less ice'
  if (level === 'warm') return 'Warm'

  // Alleen voor oude bestellingen die nog extra_ice bevatten.
  if (level === 'extra_ice') return 'Extra ice'

  return 'Normal ice'
}

export function getStickerSugarText(level?: SugarLevel | null) {
  if (level === 'none') return 'No sugar'
  if (level === 'minimal') return 'Minimal sugar'
  if (level === 'less') return 'Less sugar'
  if (level === 'sweet') return 'Sweet'
  return 'Normal sugar'
}

export function getStickerChannelText(order?: Order | null) {
  const rawChannel = String(order?.channel || '').trim()
  const channel = rawChannel.toLowerCase()

  if (channel === 'pos' || channel === 'in_store' || channel === 'in-store') {
    return 'in-store'
  }

  if (channel === 'qr') {
    return 'QR'
  }

  if (channel === 'thuisbezorgd') {
    return 'Thuisbezorgd'
  }

  if (channel === 'uber_eats' || channel === 'ubereats' || channel === 'uber') {
    return 'Uber Eats'
  }

  if (rawChannel) {
    return rawChannel
  }

  if (order?.order_type === 'staff') {
    return 'in-store'
  }

  if (order?.order_type === 'customer') {
    return 'QR'
  }

  return 'in-store'
}

export function buildDynamicStickerQrPayload(
  label: KitchenLabel,
  qrProductCode: string
) {
  const productCode = qrProductCode

  const sizeCode = label.cup_size
    ? CUP_SIZE_QR_CODES[label.cup_size] || ''
    : ''

  const sugarCode = label.sugar_level
    ? SUGAR_QR_CODES[label.sugar_level] || ''
    : ''

  const iceCode = label.ice_level
    ? ICE_QR_CODES[label.ice_level] || ''
    : ''

  if (!productCode) {
    console.warn(
      `Geen qr_product_code gevonden voor sticker ${label.id} (${label.product_name}).`
    )
    return ''
  }

  const parameters = [sizeCode, sugarCode, iceCode].filter(Boolean)

  return `|${productCode}|${parameters.join(',')}`
}

export function buildStickerZpl(
  label: KitchenLabel,
  index: number,
  totalLabels: number,
  order: Order | null | undefined,
  qrProductCode: string
) {
  const stickerTimeSource = order?.created_at || label.created_at

  const time = stickerTimeSource
    ? new Date(stickerTimeSource).toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--:--'

  const toppingNames = (label.toppings ?? [])
    .map((topping) => topping.name)
    .filter(Boolean)

  const modifierText = [
    label.cup_size ? getCupSizeLabel(label.cup_size) : '',
    getStickerIceText(label.ice_level),
    getStickerSugarText(label.sugar_level),
    ...toppingNames,
  ]
    .filter(Boolean)
    .join(', ')

  const orderNumber =
    order?.order_number ||
    label.order_number ||
    label.order_id

  const productName = truncateZplText(label.product_name, 24)
  const safeOrderNumber = truncateZplText(orderNumber, 28)
  const safeChannel = truncateZplText(getStickerChannelText(order), 18)
  const safeModifiers = truncateZplText(modifierText, 90)
  const qrValue = sanitizeZplText(buildDynamicStickerQrPayload(label, qrProductCode))

  return [
    '^XA',
    `^PW${ZEBRA_LABEL_WIDTH_DOTS}`,
    `^LL${ZEBRA_LABEL_HEIGHT_DOTS}`,
    '^LH0,0',
    '^CI28',

    // Nieuw outline-logo + strakker uitgelijnde header
    '^FO24,18^GFA,176,176,4,000000380000F07C0007F8C4003E0E4C01F0077C0F8001B01C000F0030007E3C2001EF6C600F19FC407C11B8C3E011809F001F80F8000F0047FFFF803F8000C0600000C0C00000C0C00000C040000080400000806000018060000180600001806000018020000100200001003000030030000300300003003000020010000200100006001800060018000600180006001800040008000C0008000C000C000C000600380003FFF00000FFC00000000000^FS',
    '^FO62,19^A0N,16,16^FDBlue Cup^FS',
    `^FO62,39^A0N,19,19^FB230,1,0,L,0^FD#${safeOrderNumber}^FS`,
    `^FO334,19^A0N,22,22^FD${index}/${totalLabels}^FS`,
    `^FO334,45^A0N,17,17^FD${sanitizeZplText(time)}^FS`,
    '^FO22,76^GB356,2,2^FS',

    // Drankinformatie
    `^FO24,90^A0N,32,32^FB352,2,2,L,0^FD${productName}^FS`,
    `^FO24,136^A0N,18,18^FB240,3,4,L,0^FD${safeModifiers}^FS`,

    // Onderkant
    `^FO24,242^A0N,18,18^FD${safeChannel}^FS`,
    qrValue ? `^FO252,178^BQN,2,4^FDLA,${qrValue}^FS` : '',
    '^FO22,306^GB356,1,1^FS',
    '^FO24,326^A0N,13,13^FDPowered by Blue Cup POS^FS',
    '^XZ',
  ]
    .filter(Boolean)
    .join('\n')
}


export function buildStickerZplFooterDesign(
  label: KitchenLabel,
  index: number,
  totalLabels: number,
  order: Order | null | undefined,
  qrProductCode: string,
  flowerGraphicZpl = ''
) {
  const stickerTimeSource = order?.created_at || label.created_at

  const time = stickerTimeSource
    ? new Date(stickerTimeSource).toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--:--'

  const toppingNames = (label.toppings ?? [])
    .map((topping) => topping.name)
    .filter(Boolean)

  const modifierText = [
    label.cup_size ? getCupSizeLabel(label.cup_size) : '',
    getStickerIceText(label.ice_level),
    getStickerSugarText(label.sugar_level),
    ...toppingNames,
  ]
    .filter(Boolean)
    .join(', ')

  const orderNumber =
    order?.order_number ||
    label.order_number ||
    label.order_id

  const productName = truncateZplText(label.product_name, 24)
  const safeOrderNumber = truncateZplText(orderNumber, 28)
  const safeChannel = truncateZplText(getStickerChannelText(order), 18)
  const safeModifiers = truncateZplText(modifierText, 90)
  const qrValue = sanitizeZplText(buildDynamicStickerQrPayload(label, qrProductCode))

  return [
    '^XA',
    `^PW${ZEBRA_LABEL_WIDTH_DOTS}`,
    `^LL${ZEBRA_LABEL_HEIGHT_DOTS}`,
    '^LH0,0',
    '^CI28',

    // Design 2/3/4: productinformatie bovenin, zonder originele header.
    `^FO24,28^A0N,32,32^FB352,2,2,L,0^FD${productName}^FS`,
    `^FO24,68^A0N,18,18^FB240,3,4,L,0^FD${safeModifiers}^FS`,

    // Kanaal + QR.
    `^FO24,188^A0N,18,18^FD${safeChannel}^FS`,
    qrValue ? `^FO252,122^BQN,2,4^FDLA,${qrValue}^FS` : '',

    // Optionele decoratie voor design 4.
    flowerGraphicZpl,

    // Onderste scheidingslijn en orderinformatie.
    '^FO22,270^GB356,1,1^FS',
    '^FO24,278^GFA,176,176,4,000000380000F07C0007F8C4003E0E4C01F0077C0F8001B01C000F0030007E3C2001EF6C600F19FC407C11B8C3E011809F001F80F8000F0047FFFF803F8000C0600000C0C00000C0C00000C040000080400000806000018060000180600001806000018020000100200001003000030030000300300003003000020010000200100006001800060018000600180006001800040008000C0008000C000C000C000600380003FFF00000FFC00000000000^FS',
    '^FO64,278^A0N,12,12^FDBlue Cup^FS',
    `^FO64,296^A0N,12,12^FB230,1,0,L,0^FD#${safeOrderNumber}^FS`,
    `^FO340,278^A0N,12,12^FD${index}/${totalLabels}^FS`,
    `^FO332,296^A0N,12,12^FD${sanitizeZplText(time)}^FS`,
    '^FO24,328^A0N,13,13^FDPowered by Blue Cup POS^FS',
    '^XZ',
  ]
    .filter(Boolean)
    .join('\n')
}

export async function buildFlowerGraphicZpl() {
  const image = new Image()
  image.src = '/flower1-removebg.jpg'

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('flower1-removebg.jpg kon niet worden geladen.'))
  })

  const width = 54
  const height = 54
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas voor flower-afbeelding kon niet worden gemaakt.')
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  const pixels = context.getImageData(0, 0, width, height).data
  const bytesPerRow = Math.ceil(width / 8)
  let hex = ''

  for (let y = 0; y < height; y += 1) {
    for (let byteIndex = 0; byteIndex < bytesPerRow; byteIndex += 1) {
      let value = 0

      for (let bit = 0; bit < 8; bit += 1) {
        const x = byteIndex * 8 + bit
        if (x >= width) continue

        const pixelIndex = (y * width + x) * 4
        const red = pixels[pixelIndex]
        const green = pixels[pixelIndex + 1]
        const blue = pixels[pixelIndex + 2]
        const alpha = pixels[pixelIndex + 3]
        const brightness = (red + green + blue) / 3

        if (alpha > 30 && brightness < 210) {
          value |= 1 << (7 - bit)
        }
      }

      hex += value.toString(16).padStart(2, '0').toUpperCase()
    }
  }

  const totalBytes = bytesPerRow * height
  return `^FO198,132^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hex}^FS`
}

export async function buildPreviewStickerZpl(
  design: number,
  label: KitchenLabel,
  index: number,
  totalLabels: number,
  order: Order | null | undefined,
  qrProductCode: string
) {
  // BELANGRIJK: Design 1 blijft exact de bestaande productiesticker gebruiken.
  if (design === 1) {
    return buildStickerZpl(label, index, totalLabels, order, qrProductCode)
  }

  // Design 2 gebruikt de footer-layout.
  if (design === 2) {
    return buildStickerZplFooterDesign(label, index, totalLabels, order, qrProductCode)
  }

  // Design 3 gebruikt dezelfde footer-layout plus de flower-afbeelding naast de QR.
  if (design === 3) {
    const flowerGraphicZpl = await buildFlowerGraphicZpl()
    return buildStickerZplFooterDesign(
      label,
      index,
      totalLabels,
      order,
      qrProductCode,
      flowerGraphicZpl
    )
  }

  return buildStickerZpl(label, index, totalLabels, order, qrProductCode)
}
