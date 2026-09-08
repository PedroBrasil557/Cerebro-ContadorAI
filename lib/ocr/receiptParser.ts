export interface ReceiptItem {
  name: string
  price: number
}

export interface ReceiptParseResult {
  items: ReceiptItem[]
  confidence: number
  rawText: string
}

export function parseReceiptText(rawText: string): ReceiptParseResult {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const items: ReceiptItem[] = []
  const pricePattern = /^(.*?)\s+(?:R\$\s*)?(\d{1,6}(?:[.,]\d{2}))\s*$/i
  const summaryPattern = /^(?:sub\s*total|total|troco|desconto|acr[eé]scimo|taxa|imposto)\b/i

  for (const line of lines) {
    const match = line.match(pricePattern)
    if (!match) continue

    const name = match[1]
      .replace(/^\d{1,4}\s+/, '')
      .replace(/\b\d{6,}\b/g, '')
      .replace(/[^\p{L}\p{N}\s.&/-]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
    const price = Number.parseFloat(match[2].replace(',', '.'))

    if (name.length >= 2 && !summaryPattern.test(name) && Number.isFinite(price) && price > 0) {
      items.push({ name, price })
    }
  }

  const confidence = lines.length === 0
    ? 0
    : Math.min(items.length / lines.length, 1)

  return { items, confidence, rawText }
}
