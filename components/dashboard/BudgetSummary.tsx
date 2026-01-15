'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { PieChart, Settings, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

// Props esperadas: array de orçamentos
export default function BudgetSummary({ budgets }: { budgets: any[] }) {
  // Cálculos dinâmicos
  const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0) || 1 // Evita divisão por zero
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  const remaining = Math.max(0, totalLimit - totalSpent)
  // Calcula porcentagem total, limitando a 100% para o gráfico não quebrar visualmente
  const pct = Math.min((totalSpent / totalLimit) * 100, 100)

  // Configuração do círculo SVG
  const radius = 40
  const circumference = 2 * Math.PI * radius // ~251
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="glass-panel flex h-full flex-col rounded-2xl border border-white/5 bg-[#111] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-violet-400">
          <PieChart className="h-5 w-5" />
          <h3 className="text-lg font-bold text-white">Orçamento Mensal</h3>
        </div>
        <button className="text-gray-500 transition hover:text-white">
          <Settings className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-2">
        {/* Container do Gráfico sem bordas extras */}
        <div className="relative flex h-40 w-40 items-center justify-center">
          {/* SVG Rotacionado para começar do topo */}
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Círculo de Fundo */}
            <circle
              className="text-white/5"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="50"
              cy="50"
            />

            {/* Círculo de Progresso Animado (Violeta Neon) */}
            <motion.circle
              className="text-violet-500 drop-shadow-[0_0_10px_rgba(139,92,246,0.6)] transition-all duration-1000 ease-out"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="50"
              cy="50"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black tracking-tight text-white">
              {Math.round(pct)}%
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
              Consumido
            </span>
          </div>
        </div>

        {/* Resumo de Valores */}
        <div className="space-y-1 text-center">
          <p className="text-sm font-medium text-gray-400">Disponível para gastar</p>
          <p className="text-2xl font-black text-white">
            {formatCurrency(remaining)}
          </p>
          <p className="text-xs text-gray-500">
            de um total de {formatCurrency(totalLimit)}
          </p>
        </div>
      </div>

      {/* Botão de Detalhes */}
      <button className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white transition-all hover:border-violet-500 hover:bg-violet-500">
        Ver detalhes por categoria{' '}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  )
}