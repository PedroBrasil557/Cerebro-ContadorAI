// components/views/EmergencyFundView.tsx
'use client'

import React, { useState } from 'react'
import { EmergencyFund } from '@/types_db'
import { ShieldHalf } from 'lucide-react'

type EmergencyFundProps = {
  fund: EmergencyFund | null
  onUpdateFund: (amount: number, type: 'add' | 'remove') => Promise<void>
}

export default function EmergencyFundView({
  fund,
  onUpdateFund,
}: EmergencyFundProps) {
  const [amount, setAmount] = useState('')
  const currentAmount = Number(fund?.current_amount || 0)

  const handleAction = async (type: 'add' | 'remove') => {
    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Por favor, insira um valor válido.')
      return
    }

    if (type === 'remove' && numericAmount > currentAmount) {
      alert('Você não pode retirar mais do que tem na reserva.')
      return
    }

    await onUpdateFund(numericAmount, type)
    setAmount('')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <ShieldHalf className="mx-auto h-12 w-12 text-yellow-500" />
        <h2 className="mt-2 text-lg font-semibold text-gray-500 dark:text-gray-400">
          Reserva de Emergência
        </h2>
        <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
          {currentAmount.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold">Movimentar Reserva</h3>
        <div className="space-y-4">
          <input
            type="number"
            placeholder="Valor (ex: 500.00)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleAction('add')}
              className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700"
            >
              Adicionar
            </button>
            <button
              onClick={() => handleAction('remove')}
              disabled={currentAmount === 0}
              className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
            >
              Retirar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}