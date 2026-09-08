'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Percent, Bitcoin } from 'lucide-react'
import { motion } from 'framer-motion'
import { getMarketData, type MarketData } from '@/lib/market/api'

export default function MarketTicker() {
  const [data, setData] = useState<MarketData | null>(null)

  useEffect(() => {
    getMarketData().then(setData)
  }, [])

  if (!data) return <div className="h-24 w-full bg-white/5 animate-pulse rounded-2xl" />

  const cards = [
    { 
      label: 'Taxa Selic', 
      value: data.selic === null ? 'Indisponível' : `${data.selic.toFixed(2)}%`,
      sub: data.source.selic,
      icon: Percent, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10' 
    },
    { 
      label: 'CDI Hoje', 
      value: data.cdi === null ? 'Indisponível' : `${data.cdi.toFixed(2)}%`,
      sub: data.source.cdi,
      icon: TrendingUp, 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/10' 
    },
    { 
      label: 'Dólar PTAX', 
      value: data.dolar === null ? 'Indisponível' : `R$ ${data.dolar.toFixed(2)}`,
      sub: data.source.dolar,
      icon: DollarSign, 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/10' 
    },
    { 
      label: 'Bitcoin', 
      value: data.bitcoin === null ? 'Indisponível' : `R$ ${(data.bitcoin / 1000).toFixed(1)}k`,
      sub: data.bitcoinChange === null ? data.source.bitcoin : `${data.bitcoinChange.toFixed(2)}% (24h)`,
      icon: Bitcoin, 
      color: (data.bitcoinChange ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400',
      bg: (data.bitcoinChange ?? 0) >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-[#09090b] border border-white/5 p-4 rounded-2xl flex flex-col justify-between hover:border-white/10 transition-colors"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">{card.label}</span>
            <div className={`p-2 rounded-lg ${card.bg}`}>
              <card.icon size={16} className={card.color} />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">{card.value}</h3>
            <p className={`text-xs mt-1 ${card.color} opacity-80 font-medium`}>{card.sub}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
