import { describe, expect, it } from 'vitest'
import { parseReceiptText } from '../../lib/ocr/receiptParser'

describe('receipt parser', () => {
  it('parses comma prices', () => {
    expect(parseReceiptText('Arroz Integral 25,90').items).toEqual([
      { name: 'Arroz Integral', price: 25.9 },
    ])
  })

  it('parses dot prices', () => {
    expect(parseReceiptText('Feijão Preto 8.50').items[0]?.price).toBe(8.5)
  })

  it('returns no invented items for an empty receipt', () => {
    expect(parseReceiptText('').items).toEqual([])
  })

  it('ignores broken OCR text', () => {
    expect(parseReceiptText('### ???\nTOTAL XX').items).toEqual([])
  })

  it('preserves useful accented characters', () => {
    expect(parseReceiptText('Pão-de-açúcar 12,30').items[0]?.name).toBe('Pão-de-açúcar')
  })

  it('ignores a price without a product', () => {
    expect(parseReceiptText(' 12,30').items).toEqual([])
  })

  it('ignores a product without a price', () => {
    expect(parseReceiptText('Sabonete neutro').items).toEqual([])
  })
})
