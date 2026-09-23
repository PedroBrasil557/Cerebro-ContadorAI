export type MerchantBrandCategory =
  | 'finance'
  | 'retail'
  | 'food'
  | 'mobility'
  | 'entertainment'
  | 'technology'
  | 'gaming'

export type MerchantBrand = Readonly<{
  key: string
  label: string
  aliases: readonly string[]
  category: MerchantBrandCategory
  assetPath: string
}>

const ASSET_ROOT = '/brand/merchants'

export const merchantBrands = [
  { key: 'nubank', label: 'Nubank', aliases: ['nubank', 'nu pagamentos'], category: 'finance', assetPath: `${ASSET_ROOT}/nubank.svg` },
  { key: 'paypal', label: 'PayPal', aliases: ['paypal', 'pay pal'], category: 'finance', assetPath: `${ASSET_ROOT}/paypal.svg` },
  { key: 'visa', label: 'Visa', aliases: ['visa'], category: 'finance', assetPath: `${ASSET_ROOT}/visa.svg` },
  { key: 'mastercard', label: 'Mastercard', aliases: ['mastercard', 'master card'], category: 'finance', assetPath: `${ASSET_ROOT}/mastercard.svg` },
  { key: 'shopee', label: 'Shopee', aliases: ['shopee'], category: 'retail', assetPath: `${ASSET_ROOT}/shopee.svg` },
  { key: 'ifood', label: 'iFood', aliases: ['ifood', 'i food'], category: 'food', assetPath: `${ASSET_ROOT}/ifood.svg` },
  { key: 'uber', label: 'Uber', aliases: ['uber', 'uber trip'], category: 'mobility', assetPath: `${ASSET_ROOT}/uber.svg` },
  { key: 'spotify', label: 'Spotify', aliases: ['spotify'], category: 'entertainment', assetPath: `${ASSET_ROOT}/spotify.svg` },
  { key: 'netflix', label: 'Netflix', aliases: ['netflix'], category: 'entertainment', assetPath: `${ASSET_ROOT}/netflix.svg` },
  { key: 'youtube', label: 'YouTube', aliases: ['youtube', 'youtube premium', 'google youtube'], category: 'entertainment', assetPath: `${ASSET_ROOT}/youtube.svg` },
  { key: 'github', label: 'GitHub', aliases: ['github', 'github com'], category: 'technology', assetPath: `${ASSET_ROOT}/github.svg` },
  { key: 'discord', label: 'Discord', aliases: ['discord'], category: 'technology', assetPath: `${ASSET_ROOT}/discord.svg` },
  { key: 'steam', label: 'Steam', aliases: ['steam', 'steampowered'], category: 'gaming', assetPath: `${ASSET_ROOT}/steam.svg` },
] as const satisfies readonly MerchantBrand[]

export type MerchantBrandKey = (typeof merchantBrands)[number]['key']

export function normalizeMerchantText(value?: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function containsPhrase(text: string, phrase: string) {
  if (!text || !phrase) return false
  return ` ${text} `.includes(` ${phrase} `)
}

export function resolveMerchantBrand({
  description,
  source,
}: {
  description?: string | null
  source?: string | null
}): MerchantBrand | null {
  const normalized = normalizeMerchantText([description, source].filter(Boolean).join(' '))
  if (!normalized) return null

  return (
    merchantBrands.find((brand) =>
      brand.aliases.some((alias) => containsPhrase(normalized, normalizeMerchantText(alias))),
    ) ?? null
  )
}
