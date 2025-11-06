// components/investments/InvestmentAdvisor.tsx
'use client'

import React from 'react'
import { Goal, EmergencyFund } from '@/types_db'
import { ActiveTab } from '@/types'
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'

type InvestmentAdvisorProps = {
  goals: Goal[]
  emergencyFund: EmergencyFund | null
  cdiRate: number
  handleRedirect?: (tab: ActiveTab) => void
}

export default function InvestmentAdvisor({
  goals,
  emergencyFund,
  cdiRate,
  handleRedirect = () => {},
}: InvestmentAdvisorProps) {
  // Simula sinal de desempenho (positivo/negativo)
  const cdiPerformance = Math.random() > 0.5
  const marketPerformance = Math.random() > 0.5

  // Função para ação de investimento
  const handleActionClick = () => {
    alert('API de consultoria ainda não está pronta. Em breve estará disponível!')
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6 transition-all hover:shadow-2xl">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Consultor de Investimentos
      </h2>

      {/* Resumo de metas */}
      <div className="space-y-3">
        <p className="text-gray-700 dark:text-gray-300">
          Total de Metas: <span className="font-medium">{goals.length}</span>
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          Fundo de Emergência: 
          <span className="font-medium ml-1">
            {emergencyFund ? `R$ ${emergencyFund.current_amount.toLocaleString()}` : 'Não possui'}
          </span>
        </p>
      </div>

      {/* Indicadores de performance */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-800 dark:text-gray-200">CDI</span>
          <span
            className={`flex items-center gap-1 font-medium ${
              cdiPerformance ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {cdiRate.toFixed(2)}% 
            {cdiPerformance ? <ArrowUpIcon size={16} /> : <ArrowDownIcon size={16} />}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-800 dark:text-gray-200">Mercado Global</span>
          <span
            className={`flex items-center gap-1 font-medium ${
              marketPerformance ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {marketPerformance ? '+2.5%' : '-1.7%'}
            {marketPerformance ? <ArrowUpIcon size={16} /> : <ArrowDownIcon size={16} />}
          </span>
        </div>
      </div>

      {/* Botão de ação */}
      <button
        onClick={handleActionClick}
        className="w-full mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-md"
      >
        Ver recomendações
      </button>
    </div>
  )
}
