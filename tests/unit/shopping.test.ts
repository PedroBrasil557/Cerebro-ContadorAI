import { describe, expect, it } from 'vitest'
import {
  findExactShoppingItem,
  normalizeShoppingItemName,
  validateShoppingAmount,
  validateShoppingItemName,
  validateShoppingQuantity,
} from '../../core/finance/shopping'

describe('shopping financial rules', () => {
  it('normalizes valid monetary values to cents', () => {
    expect(validateShoppingAmount('12,345', { label: 'preço' })).toBe(12.35)
  })

  it('rejects non-positive budget values', () => {
    expect(() => validateShoppingAmount(0, { label: 'orçamento' })).toThrow()
    expect(() => validateShoppingAmount(-1, { label: 'orçamento' })).toThrow()
  })

  it('allows zero only when explicitly requested', () => {
    expect(validateShoppingAmount(0, { allowZero: true })).toBe(0)
  })

  it('validates quantities and item names', () => {
    expect(validateShoppingQuantity('1,5')).toBe(1.5)
    expect(validateShoppingItemName('  Arroz   Integral  ')).toBe('Arroz Integral')
    expect(() => validateShoppingQuantity(0)).toThrow()
    expect(() => validateShoppingItemName(' ')).toThrow()
  })

  it('matches OCR items only by normalized exact name', () => {
    const items = [{ id: '1', name: 'Arroz Integral' }, { id: '2', name: 'Arroz Branco' }]
    expect(normalizeShoppingItemName('ARROZ ÍNTEGRAL')).toBe('arroz integral')
    expect(findExactShoppingItem(items, 'arroz integral')?.id).toBe('1')
    expect(findExactShoppingItem(items, 'Arroz')).toBeUndefined()
  })
})
