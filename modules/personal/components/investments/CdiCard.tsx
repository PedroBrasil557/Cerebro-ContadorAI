'use client'

import React from 'react'
import { TrendingUp } from 'lucide-react'

export default function CdiCard({ cdiRate }: { cdiRate: number }) {
  // Converte 0.1165 para 11.65
  const percentage = (cdiRate * 100).toFixed(2);

  return (
    <div className="glass-panel flex flex-col justify-center items-center rounded-2xl p-6 border border-white/5 bg-[#111] h-full text-center relative overflow-hidden">
      
      {/* Background Glow Effect */}
      <div className="absolute top-0 right-0 h-32 w-32 bg-violet-600/20 blur-[50px] rounded-full pointer-events-none" />

      <h3 className="text-gray-400 font-medium mb-2 uppercase tracking-widest text-xs">Taxa CDI Atual</h3>
      
      <div className="relative z-10">
        <span className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]">
          {percentage}%
        </span>
        <p className="text-violet-400 text-sm font-bold mt-2 flex items-center justify-center gap-1">
          <TrendingUp className="h-4 w-4" /> a.a. (Anual)
        </p>
      </div>

      <div className="mt-6 w-full bg-white/5 rounded-lg p-3">
        <p className="text-[10px] text-gray-400 text-left">
          Taxa de referência informativa. A rentabilidade efetiva depende do produto, prazo, custos e impostos.
        </p>
      </div>
    </div>
  )
}
