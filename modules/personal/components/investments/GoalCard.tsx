'use client'

import React, { useState } from 'react'
import { Goal } from '@/types_db'
import { motion } from 'framer-motion'
import { formatCurrency } from '@/lib/utils'

type GoalCardProps = {
  goal: Goal
  cdiRate: number
  isDashboard?: boolean
  onAddValue?: (goalId: string, amount: number) => void
}

export default function GoalCard({ goal, cdiRate, isDashboard = false, onAddValue }: GoalCardProps) {
  const [valueToAdd, setValueToAdd] = useState('')
  const [showInput, setShowInput] = useState(false)

  const current_amount = Number(goal.current_amount)
  const target_amount = Number(goal.target_amount)
  const progress = target_amount > 0 ? (current_amount / target_amount) * 100 : 0
  const cdiMensal = Math.pow(1 + cdiRate, 1 / 12) - 1
  const projectedValue = current_amount * Math.pow(1 + cdiMensal, 12)

  const handleAddValue = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valueToAdd || !onAddValue) return
    const amount = parseFloat(valueToAdd)
    if (isNaN(amount) || amount <= 0) return alert('Insira um valor válido.')
    onAddValue(goal.id, amount)
    setValueToAdd('')
    setShowInput(false)
  }

  return (
    <motion.div
      layout
      className={`p-5 rounded-2xl shadow-md transition-transform hover:scale-[1.02] bg-white dark:bg-gray-800`}
    >
      <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{goal.title}</h4>

      <div className="my-3 flex items-baseline justify-between">
        <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
          {formatCurrency(current_amount)}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          / {formatCurrency(target_amount)}
        </span>
      </div>

      {/* Barra de progresso */}
      <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full">
        <motion.div
          className="h-3 rounded-full bg-violet-600 dark:bg-violet-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <p className="mt-1 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
        {progress.toFixed(1)}%
      </p>

      {/* Adicionar valor */}
      {!isDashboard && (
        <div className="mt-4">
          {showInput ? (
            <form onSubmit={handleAddValue} className="flex gap-2">
              <input
                type="number"
                placeholder="Adicionar valor"
                value={valueToAdd}
                onChange={(e) => setValueToAdd(e.target.value)}
                className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                OK
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowInput(true)}
              className="mt-3 w-full px-4 py-2 border border-violet-600 text-violet-600 dark:text-violet-400 rounded-lg hover:bg-violet-600 hover:text-white transition-colors font-medium"
            >
              Adicionar Valor
            </button>
          )}
        </div>
      )}

      {/* Projeção CDI */}
      {!isDashboard && (
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-dashed border-violet-600">
          <p className="text-sm font-medium text-violet-700 dark:text-violet-400">
            Projeção 12 meses (CDI {(cdiRate * 100).toFixed(2)}% a.a.)
          </p>
          <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {formatCurrency(projectedValue)}
          </p>
        </div>
      )}
    </motion.div>
  )
}
