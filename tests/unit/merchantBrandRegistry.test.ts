import { describe, expect, it } from 'vitest'
import { normalizeMerchantText, resolveMerchantBrand } from '@/core/brand/merchantBrandRegistry'

describe('merchant brand registry', () => {
  it('normalizes accents, punctuation and repeated spaces', () => {
    expect(normalizeMerchantText('  UBER * Viagem — São Paulo  ')).toBe('uber viagem sao paulo')
  })

  it.each([
    ['IFOOD*PEDIDO 123', 'ifood'],
    ['UBER * TRIP', 'uber'],
    ['NETFLIX.COM', 'netflix'],
    ['YOUTUBE PREMIUM', 'youtube'],
    ['PAYPAL * STORE', 'paypal'],
    ['STEAMGAMES.COM 4259522985', null],
    ['STEAM PURCHASE', 'steam'],
  ])('resolves %s safely', (description, expectedKey) => {
    expect(resolveMerchantBrand({ description })?.key ?? null).toBe(expectedKey)
  })

  it('uses source as a secondary merchant signal', () => {
    expect(resolveMerchantBrand({ description: 'Assinatura mensal', source: 'spotify' })?.key).toBe('spotify')
  })

  it('does not match brand names inside unrelated words', () => {
    expect(resolveMerchantBrand({ description: 'Divisa mensal' })).toBeNull()
  })

  it('returns null for unknown merchants so the controlled fallback can render', () => {
    expect(resolveMerchantBrand({ description: 'Padaria do bairro' })).toBeNull()
  })
})
