'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function MarketDataCard({ marketData }: { marketData: any[] }) {
  // Se não houver dados, usa um array vazio para não quebrar
  const data = marketData || [];

  return (
    <div className="glass-panel flex flex-col rounded-2xl p-6 border border-white/5 bg-[#111] h-full">
      <div className="flex items-center gap-2 mb-6 text-violet-400">
        <Activity className="h-5 w-5" />
        <h3 className="text-xl font-bold text-white">Mercado Global</h3>
      </div>

      <div className="space-y-4">
        {data.map((item, index) => {
          const isUp = item.direction === 'up'
          return (
            <div key={index} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
              <span className="font-medium text-gray-300">{item.name}</span>
              <div className="flex items-center gap-3">
                {/* Valor */}
                <span className="font-bold text-white">
                  {item.value > 1000 
                    ? `R$ ${item.value.toLocaleString('pt-BR')}` 
                    : `R$ ${item.value.toFixed(2)}`
                  }
                </span>
                
                {/* Variação (Verde ou Vermelho Neon) */}
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${
                  isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {item.change}%
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}