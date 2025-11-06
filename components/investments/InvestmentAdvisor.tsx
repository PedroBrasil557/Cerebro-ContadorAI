'use client'

import React from 'react'
import { Goal, EmergencyFund } from '@/types_db'
import { ActiveTab } from '@/types'

type InvestmentAdvisorProps = {
  goals: Goal[]
  emergencyFund: EmergencyFund | null
  cdiRate: number
  handleRedirect: (tab: ActiveTab) => void // <-- corrigido para ActiveTab
}

export default function InvestmentAdvisor({
  goals,
  emergencyFund,
  cdiRate,
  handleRedirect,
}: InvestmentAdvisorProps) {
  // Total investido
  const totalInvested = goals.reduce((acc, g) => acc + g.current_amount, 0)

  // Projeção simples: crescimento baseado no CDI
  const projectedGrowth = totalInvested * Math.pow(1 + cdiRate, 1)
  const change = projectedGrowth - totalInvested
  const isUp = change >= 0

  return (
    <div className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg space-y-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
        Consultor de Investimentos
      </h2>

      {/* Total Investido */}
      <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
        <span className="text-gray-700 dark:text-gray-200 font-medium">Total Investido</span>
        <span className="font-bold text-gray-900 dark:text-white">
          {totalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      </div>

      {/* Projeção CDI */}
      <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
        <span className="text-gray-700 dark:text-gray-200 font-medium">Projeção 12 meses</span>
        <span className={`font-semibold ${isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {projectedGrowth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          {isUp ? ' ▲' : ' ▼'}
        </span>
      </div>

      {/* Fundo de Emergência */}
      {emergencyFund && (
        <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
          <span className="text-gray-700 dark:text-gray-200 font-medium">Fundo de Emergência</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {emergencyFund.current_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      )}

      {/* Botão funcional */}
      <button
        onClick={() => alert('A API de detalhamento ainda não está pronta!')}
        className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
      >
        Consultar Metas
      </button>
    </div>
  )
}
