export interface MarketData {
  status: 'available' | 'partial' | 'unavailable'
  updatedAt: string
  source: { selic: string; cdi: string; dolar: string; bitcoin: string }
  selic: number | null
  cdi: number | null
  dolar: number | null
  bitcoin: number | null
  bitcoinChange: number | null
}

let marketCache: { data: MarketData; timestamp: number } | null = null
const CACHE_DURATION = 1000 * 60 * 15

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: 'no-store' })
    if (!response.ok) return null
    return await response.json() as T
  } catch {
    return null
  }
}

function brNumber(value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const parsed = Number(String(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

export async function getMarketData(): Promise<MarketData> {
  const now = Date.now()
  if (marketCache && now - marketCache.timestamp < CACHE_DURATION) return marketCache.data

  const [selicResult, cdiResult, dolarResult, cryptoResult] = await Promise.all([
    fetchJson<Array<{ valor?: string }>>('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json'),
    fetchJson<Array<{ valor?: string }>>('https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json'),
    fetchJson<Array<{ valor?: string }>>('https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/1?formato=json'),
    fetchJson<{ bitcoin?: { brl?: number; brl_24h_change?: number } }>('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl&include_24hr_change=true'),
  ])

  const dailyCdi = brNumber(cdiResult?.[0]?.valor)
  const values = {
    selic: brNumber(selicResult?.[0]?.valor),
    cdi: dailyCdi === null ? null : (Math.pow(1 + dailyCdi / 100, 252) - 1) * 100,
    dolar: brNumber(dolarResult?.[0]?.valor),
    bitcoin: brNumber(cryptoResult?.bitcoin?.brl),
    bitcoinChange: brNumber(cryptoResult?.bitcoin?.brl_24h_change),
  }
  const availableCount = Object.values(values).filter((value) => value !== null).length
  const data: MarketData = {
    status: availableCount === 0 ? 'unavailable' : availableCount === 5 ? 'available' : 'partial',
    updatedAt: new Date(now).toISOString(),
    source: {
      selic: 'Banco Central do Brasil SGS 432',
      cdi: 'Banco Central do Brasil SGS 12 (anualizado em 252 dias úteis)',
      dolar: 'Banco Central do Brasil SGS 1',
      bitcoin: 'CoinGecko',
    },
    ...values,
  }

  marketCache = { data, timestamp: now }
  return data
}
