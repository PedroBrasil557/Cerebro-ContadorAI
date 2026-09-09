'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'

interface ModernSummaryCardProps {
  title: string
  value: number
  icon: LucideIcon
  color: 'indigo' | 'emerald' | 'red' | 'amber'
  prefix?: string
}

export default function ModernSummaryCard({ 
  title, value, icon: Icon, color, prefix = 'R$'
}: ModernSummaryCardProps) {
  
  const colors = {
    indigo: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400 shadow-indigo-500/10',
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 shadow-emerald-500/10',
    red: 'border-red-500/20 bg-red-500/5 text-red-400 shadow-red-500/10',
    amber: 'border-amber-500/20 bg-amber-500/5 text-amber-400 shadow-amber-500/10'
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-2xl transition-all hover:scale-[1.02] ${colors[color]}`}>
      <div className="flex items-center justify-between relative z-10">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{title}</p>
          <h3 className="text-2xl font-black text-white flex items-baseline gap-1">
            <span className="text-sm font-medium opacity-50">{prefix}</span>
            {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(value)}
          </h3>
        </div>
        <div className={`p-3 rounded-xl bg-white/5 border border-white/10`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  )
}
