// components/dashboard/BudgetSummary.tsx
'use client'

import React from 'react'
// CORREÇÃO: Adicionamos a importação de motion
import { motion } from 'framer-motion' 
import { TrendingDown, Settings } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { STATUS_COLORS } from '@/lib/constants'

type Budget = {
  category: string
  spent: number
  limit: number
}

type BudgetSummaryProps = {
  budgets: Budget[]
}

const BudgetRing = ({ percentage, color }: { percentage: number, color: string }) => {
    const radius = 25;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <svg className="h-full w-full" viewBox="0 0 60 60">
            {/* Fundo Cinza */}
            <circle
                className="text-gray-200 dark:text-gray-600"
                strokeWidth="7"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="30"
                cy="30"
            />
            {/* Progresso Colorido */}
            <circle
                className={`transition-all duration-700`}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                stroke={color}
                fill="transparent"
                r={radius}
                cx="30"
                cy="30"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
        </svg>
    );
};

export default function BudgetSummary({ budgets }: BudgetSummaryProps) {
    const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const overallPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

    const getColor = (percentage: number) => {
        if (percentage >= 100) return STATUS_COLORS.danger;
        if (percentage >= 70) return STATUS_COLORS.warning;
        return STATUS_COLORS.success;
    };

    const overallColor = getColor(overallPercentage);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-text-dark dark:text-white">
          Orçamentos (Mês)
        </h3>
        <button className="text-text-light hover:text-brand-violet transition-colors" aria-label="Gerenciar orçamentos">
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {/* Visão Geral (Anel Central) */}
      <div className="flex justify-center items-center gap-6 mb-6 border-b border-gray-100 pb-6 dark:border-gray-700">
        <div className="relative h-24 w-24">
            <BudgetRing percentage={overallPercentage} color={overallColor} />
            <div className="absolute inset-0 flex flex-col justify-center items-center">
                <span className="text-2xl font-bold" style={{ color: overallColor }}>
                    {Math.round(overallPercentage)}%
                </span>
                <span className="text-xs text-text-light">Total</span>
            </div>
        </div>
        <div className="flex flex-col text-sm">
            <span className="font-semibold text-text-dark dark:text-white">
                Gasto: {formatCurrency(totalSpent)}
            </span>
            <span className="text-text-light">
                Limite: {formatCurrency(totalLimit)}
            </span>
            {overallPercentage >= 100 && (
                <span className="text-red-500 font-medium mt-1">Limite Excedido!</span>
            )}
        </div>
      </div>

      {/* Lista de Orçamentos por Categoria */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {budgets.map((budget) => {
          const percentage = (budget.spent / budget.limit) * 100;
          const color = getColor(percentage);

          return (
            <div key={budget.category} className="flex items-center gap-4">
              <TrendingDown className="h-5 w-5 shrink-0" style={{ color: color }} />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-text-dark dark:text-white">{budget.category}</span>
                  <span className="text-text-light">{Math.round(percentage)}%</span>
                </div>
                {/* Barra de Progresso */}
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                    <motion.div
                        className="h-2 rounded-full"
                        style={{ backgroundColor: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage > 100 ? 100 : percentage}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}