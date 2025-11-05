// components/investments/AddGoalForm.tsx
'use client'

import React, { useState } from 'react'
import { NewGoal } from '@/types_db'

export default function AddGoalForm({
  onAddGoal,
}: {
  onAddGoal: (goal: NewGoal) => void
}) {
  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !targetAmount) {
      alert('Por favor, preencha todos os campos.')
      return
    }
    onAddGoal({
      title,
      target_amount: parseFloat(targetAmount),
      current_amount: 0,
    })
    setTitle('')
    setTargetAmount('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <h3 className="mb-4 text-lg font-semibold">Adicionar Nova Meta</h3>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Nome da Meta (ex: Viagem, Carro Novo)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <input
          type="number"
          placeholder="Valor Alvo (ex: 20000)"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          className="w-full rounded-md border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-violet-600 px-4 py-2 font-medium text-white transition-colors hover:bg-violet-700"
        >
          Criar Meta
        </button>
      </div>
    </form>
  )
}