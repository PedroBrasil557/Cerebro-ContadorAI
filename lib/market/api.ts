// lib/market/api.ts

// Cache simples em memória para evitar rate limits do BCB
let marketCache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 1000 * 60 * 15; // 15 minutos

export async function getMarketData() {
  const now = Date.now();
  if (marketCache && now - marketCache.timestamp < CACHE_DURATION) {
    return marketCache.data;
  }

  try {
    const [selicRes, dolarRes, cryptoRes] = await Promise.all([
      // 1. Taxa Selic (BCB)
      fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.1178/dados/ultimos/1?formato=json')
        .then(res => res.json())
        .catch(() => [{ valor: "11.25" }]), // Fallback seguro

      // 2. Dólar PTAX (BCB)
      fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/1?formato=json')
        .then(res => res.json())
        .catch(() => [{ valor: "5.50" }]),

      // 3. Bitcoin (CoinGecko)
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl&include_24hr_change=true')
        .then(res => res.json())
        .catch(() => ({ bitcoin: { brl: 0, brl_24h_change: 0 } }))
    ]);

    const data = {
      selic: parseFloat(selicRes[0]?.valor || "11.25"),
      cdi: parseFloat(selicRes[0]?.valor || "11.25") * 0.99, // Aproximação padrão de mercado
      dolar: parseFloat(dolarRes[0]?.valor || "5.0"),
      bitcoin: cryptoRes?.bitcoin?.brl || 0,
      bitcoinChange: cryptoRes?.bitcoin?.brl_24h_change || 0
    };

    marketCache = { data, timestamp: now };
    return data;
  } catch (error) {
    console.error("Erro ao buscar dados de mercado:", error);
    return { selic: 11.25, cdi: 11.15, dolar: 5.50, bitcoin: 0, bitcoinChange: 0 };
  }
}