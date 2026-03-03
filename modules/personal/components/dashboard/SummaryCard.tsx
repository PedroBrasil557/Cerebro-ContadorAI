'use client'

import React, { useState, useEffect } from 'react'
import { LucideIcon, HelpCircle } from 'lucide-react'

interface SummaryCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  trend?: 'up' | 'down' | 'neutral' | 'brand'
  trendValue?: string
  color?: string
  onChange?: (value: number) => void
  editable?: boolean
}

export default function SummaryCard({ 
  title, 
  value, 
  icon: IconProp, 
  trend = 'neutral', 
  trendValue,
  color = 'text-indigo-500',
  onChange,
  editable = false
}: SummaryCardProps) {
  // 1. PROTEÇÃO CONTRA CRASH DE ÍCONE
  const Icon = IconProp || HelpCircle

  // 2. PROTEÇÃO CONTRA VALOR NULO
  const safeValue = value ?? 0
  
  const [isEditing, setIsEditing] = useState(false)
  const [tempVal, setTempVal] = useState(safeValue.toString())

  useEffect(() => {
    setTempVal((value ?? 0).toString())
  }, [value])

  const save = () => {
    // 3. PROTEÇÃO CONTRA ONCHANGE INEXISTENTE
    if (typeof onChange === 'function') {
      const cleanValue = tempVal.toString().replace(/[^0-9.-]+/g, '')
      onChange(Number(cleanValue) || 0)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') save()
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111] p-6 shadow-xl transition-all duration-300 hover:border-white/20 group">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${color?.replace('text-', 'bg-') || 'bg-indigo-500'} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`} />

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-4 w-full">
          <div className="flex items-center gap-3">
            <div className={`rounded-xl bg-white/5 p-2.5 ${color} shadow-lg shadow-black/50`}>
              <Icon className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">{title}</p>
          </div>

          <div className="space-y-1">
            {isEditing ? (
              <input
                autoFocus
                className="w-full bg-black/50 border border-indigo-500/50 rounded px-2 py-1 text-2xl font-bold text-white outline-none"
                value={tempVal}
                onChange={(e) => setTempVal(e.target.value)}
                onBlur={save}
                onKeyDown={handleKeyDown}
              />
            ) : (
              <h3 
                onClick={() => editable && setIsEditing(true)}
                className={`text-3xl font-bold text-white tracking-tight ${editable ? 'cursor-pointer hover:text-indigo-400 transition-colors' : ''}`}
              >
                {typeof value === 'number' 
                  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
                  : (safeValue || 'R$ 0,00')} 
              </h3>
            )}
            
            {trendValue && (
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/5`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}