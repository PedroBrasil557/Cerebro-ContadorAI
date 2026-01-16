'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { NewGoal } from '@/types_db'

interface AddGoalFormProps {
  onAdd: (goal: NewGoal) => void
}

export default function AddGoalForm({ onAdd }: AddGoalFormProps) {
  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !targetAmount) return

    onAdd({
      title,
      target_amount: parseFloat(targetAmount),
      // REMOVIDO: current_amount: 0 (O erro acontecia aqui, pois o MainAppLayout já define isso)
    })

    setTitle('')
    setTargetAmount('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-gray-400 font-bold uppercase">Nome da Meta</label>
        <input 
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Viagem para Londres"
          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-violet-500 transition mt-1"
        />
      </div>
      <div>
        <label className="text-xs text-gray-400 font-bold uppercase">Valor Alvo</label>
        <input 
          type="number" 
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          placeholder="0.00"
          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-violet-500 transition mt-1"
        />
      </div>
      <button 
        type="submit" 
        className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition"
      >
        <Plus className="h-4 w-4" />
        Criar Meta
      </button>
    </form>
  )
}