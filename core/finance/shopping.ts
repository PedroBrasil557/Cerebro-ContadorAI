const MAX_SHOPPING_AMOUNT = 10_000_000
const MAX_ITEM_NAME_LENGTH = 120

function toFiniteNumber(value: number | string) {
  const normalized = typeof value === 'string' ? value.trim().replace(',', '.') : value
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) throw new Error('Informe um valor válido.')
  return parsed
}

export function validateShoppingAmount(
  value: number | string,
  options: { allowZero?: boolean; label?: string } = {},
) {
  const { allowZero = false, label = 'valor' } = options
  const parsed = toFiniteNumber(value)
  const minimumInvalid = allowZero ? parsed < 0 : parsed <= 0

  if (minimumInvalid) {
    throw new Error(allowZero
      ? `O ${label} não pode ser negativo.`
      : `O ${label} deve ser maior que zero.`)
  }
  if (parsed > MAX_SHOPPING_AMOUNT) throw new Error(`O ${label} informado é muito alto.`)

  return Number(parsed.toFixed(2))
}

export function validateShoppingQuantity(value: number | string | null | undefined) {
  if (value == null) return 1
  const parsed = toFiniteNumber(value)
  if (parsed <= 0 || parsed > 10_000) throw new Error('Informe uma quantidade válida.')
  return Number(parsed.toFixed(3))
}

export function validateShoppingItemName(value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length < 2) throw new Error('Informe um nome válido para o item.')
  if (normalized.length > MAX_ITEM_NAME_LENGTH) throw new Error('O nome do item é muito longo.')
  return normalized
}

export function normalizeShoppingItemName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

export function findExactShoppingItem<T extends { name: string }>(items: T[], candidateName: string) {
  const candidate = normalizeShoppingItemName(candidateName)
  if (!candidate) return undefined
  return items.find((item) => normalizeShoppingItemName(item.name) === candidate)
}
