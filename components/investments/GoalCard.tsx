// components/investments/GoalCard.tsx
'use client'

import React from 'react'
import { Goal } from '@/types_db'
import { motion } from 'framer-motion'
import { formatCurrency } from '@/lib/utils'

export default function GoalCard({
  goal,
  cdiRate,
  isDashboard = false, // Nova prop para saber se está no dashboard
}: {
  goal: Goal
  cdiRate: number
  isDashboard?: boolean
}) {
  const current_amount = Number(goal.current_amount)
  const target_amount = Number(goal.target_amount)
  
  const progress =
    target_amount > 0 ? (current_amount / target_amount) * 100 : 0

  // Cálculo de Juros Compostos (CDI) - Usado apenas fora do dashboard
  const cdiMensal = Math.pow(1 + cdiRate, 1 / 12) - 1
  const projectedValue = current_amount * Math.pow(1 + cdiMensal, 12)

  return (
    // Removendo a borda e sombra se estiver no Dashboard
    <motion.div
      layout
      className={`rounded-xl p-4 transition-colors ${
        isDashboard 
          ? 'bg-gray-50 dark:bg-gray-700' // Fundo sutil para o dashboard
          : 'bg-white border border-gray-200 shadow-sm dark:bg-gray-800' // Fundo completo para a aba Investir
      }`}
    >
      <h4 className="font-semibold text-text-dark dark:text-white">
        {goal.title}
      </h4>
      <div className="my-2 flex items-baseline justify-between">
        <span className="text-lg font-bold text-brand-violet">
          {formatCurrency(current_amount)}
        </span>
        <span className="text-sm text-text-light">
          / {formatCurrency(target_amount)}
        </span>
      </div>
      {/* Barra de Progresso */}
      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
        <motion.div
          className="h-2 rounded-full bg-brand-violet"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <p className="mt-1 text-right text-sm font-medium text-text-light">{progress.toFixed(1)}%</p>

      {/* Projeção CDI - Mostrada SOMENTE na aba Investimentos */}
      {!isDashboard && (
        <div className="mt-4 rounded-md border border-dashed border-brand-violet bg-summary-purple-bg p-3 dark:border-brand-violet-dark dark:bg-gray-700">
          <p className="text-sm font-medium text-summary-purple-icon dark:text-brand-violet-dark">
            Projeção (12 meses c/ CDI a {(cdiRate * 100).toFixed(2)}% a.a.)
          </p>
          <p className="text-lg font-bold text-text-dark dark:text-white">
            {formatCurrency(projectedValue)}
          </p>
        </div>
      )}
    </motion.div>
  )
}