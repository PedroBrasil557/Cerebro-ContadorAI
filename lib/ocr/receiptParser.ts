export interface ReceiptItem {
  name: string
  price: number
}

export interface ReceiptParseResult {
  items: ReceiptItem[]
  confidence: number
  rawText: string
}

const MAX_RECEIPT_LINES = 500
const MAX_RECEIPT_ITEMS = 80
const MAX_RECEIPT_ITEM_PRICE = 1_000_000
const MAX_RECEIPT_ITEM_NAME = 120

function parseReceiptPrice(value: string) {
  const compact = value.replace(/\s+/g, '')
  const lastComma = compact.lastIndexOf(',')
  const lastDot = compact.lastIndexOf('.')
  let normalized = compact

  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      normalized = compact.replace(/\./g, '').replace(',', '.')
    } else {
      normalized = compact.replace(/,/g, '')
    }
  } else if (lastComma >= 0) {
    normalized = compact.replace(',', '.')
  }

  const parsed = Number.parseFloat(normalized)
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > MAX_RECEIPT_ITEM_PRICE) return null
  return Number(parsed.toFixed(2))
}

export function parseReceiptText(rawText: string): ReceiptParseResult {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_RECEIPT_LINES)

  const items: ReceiptItem[] = []
  const pricePattern = /^(.*?)\s+(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d{1,3}(?:,\d{3})*\.\d{2}|\d{1,6}[.,]\d{2})\s*$/i
  const summaryPattern = /^(?:sub\s*total|subtotal|total(?:\s+a\s+pagar)?|troco|desconto|acr[eé]scimo|taxa|imposto|valor\s+total)\b/i

  for (const line of lines) {
    if (items.length >= MAX_RECEIPT_ITEMS) break

    const match = line.match(pricePattern)
    if (!match) continue

    const name = match[1]
      .replace(/^\d{1,4}\s+/, '')
      .replace(/\b\d{6,}\b/g, '')
      .replace(/[^\p{L}\p{N}\s.&/-]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_RECEIPT_ITEM_NAME)
    const price = parseReceiptPrice(match[2])

    if (name.length >= 2 && !summaryPattern.test(name) && price !== null) {
      items.push({ name, price })
    }
  }

  const confidence = lines.length === 0
    ? 0
    : Math.min(items.length / lines.length, 1)

  return { items, confidence, rawText }
}
