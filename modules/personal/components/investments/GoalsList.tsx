'use client'

import React, { useState } from 'react'
import { Goal } from '@/types_db'
import { Target, Plus, Check, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface GoalsListProps {
  goals: Goal[]
  cdiRate: number // Mantido para compatibilidade, mesmo que não usado visualmente agora
  onGoalClick: () => void
  onAddValue: (id: string, value: number) => void
}

export default function GoalsList({ goals, onGoalClick, onAddValue }: GoalsListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState('')

  const handleSave = (id: string) => {
    const val = Number(tempValue)
    if (val > 0) {
      onAddValue(id, val)
    }
    setEditingId(null)
    setTempValue('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setTempValue('')
  }

  return (
    <div className="glass-panel flex h-full flex-col rounded-2xl border border-white/5 bg-[#111] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-violet-400">
          <Target className="h-5 w-5" />
          <h3 className="text-xl font-bold text-white">Minhas Metas</h3>
        </div>
        <button
          onClick={onGoalClick}
          className="text-xs font-bold uppercase text-violet-500 transition hover:text-violet-300"
        >
          Ver todas
        </button>
      </div>

      <div className="custom-scrollbar max-h-[400px] space-y-6 overflow-y-auto pr-2">
        {goals.map((goal) => {
          const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
          const isEditingThis = editingId === goal.id

          return (
            <div
              key={goal.id}
              className="space-y-3 rounded-xl border border-white/5 bg-white/5 p-4 transition hover:border-violet-500/30"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{goal.title}</h4>
                  <p className="mt-1 text-xs text-gray-400">
                    Alvo: {formatCurrency(goal.target_amount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-violet-400">
                    {formatCurrency(goal.current_amount)}
                  </p>
                  <p className="text-xs font-bold text-white">{pct.toFixed(0)}%</p>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="h-2.5 w-full overflow-hidden rounded-full border border-white/5 bg-black/40">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-400 shadow-[0_0_12px_rgba(167,139,250,0.5)]"
                />
              </div>

              {/* Área de Adicionar Valor (Editável) */}
              <div className="pt-2">
                <AnimatePresence mode="wait">
                  {isEditingThis ? (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="number"
                        placeholder="R$ valor"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="w-full rounded-lg border border-violet-500/50 bg-black/50 px-3 py-1.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSave(goal.id)}
                      />
                      <button
                        onClick={() => handleSave(goal.id)}
                        className="rounded-md bg-violet-500 p-1.5 text-white transition hover:bg-violet-600"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded-md bg-gray-700 p-1.5 text-gray-300 transition hover:bg-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setEditingId(goal.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 py-2 text-xs font-bold text-gray-400 transition hover:border-violet-500 hover:text-violet-400"
                    >
                      <Plus className="h-3 w-3" /> Adicionar aporte
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
