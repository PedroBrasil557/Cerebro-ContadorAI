'use client'

import React, { useState } from 'react'
import { Plus, Target, Calendar, Palette } from 'lucide-react'
import { NewGoal } from '@/types_db'

interface AddGoalFormProps {
  onAdd: (goal: NewGoal) => void
}

// Cores premium da paleta CÉREBRO.OS para metas financeiras
const THEME_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f59e0b', // Amber
  '#ef4444'  // Rose
]

export default function AddGoalForm({ onAdd }: AddGoalFormProps) {
  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [selectedColor, setSelectedColor] = useState(THEME_COLORS[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Agora o Typescript exige a data para permitir a submissão
    if (!title || !targetAmount || !deadline) return

    onAdd({
      title,
      target_amount: parseFloat(targetAmount),
      deadline,
      color: selectedColor
    })

    // Reset do formulário após a submissão
    setTitle('')
    setTargetAmount('')
    setDeadline('')
    setSelectedColor(THEME_COLORS[0])
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-[#0a0a0c] p-6 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden group">
      {/* Background Glow Interativo */}
      <div 
        className="absolute -top-10 -right-10 w-40 h-40 blur-3xl opacity-20 pointer-events-none transition-colors duration-500"
        style={{ backgroundColor: selectedColor }}
      />

      <div className="relative z-10 space-y-4">
        {/* NOME DA META */}
        <div>
          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <Target size={12} className="text-gray-500" /> Objetivo
          </label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Primeira viagem para Londres"
            className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 transition-all shadow-inner"
            required
          />
        </div>

        {/* VALOR ALVO E DATA LIMITE (Lado a Lado) */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              Valor Alvo (R$)
            </label>
            <input 
              type="number" 
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 transition-all shadow-inner"
              required
            />
          </div>
          
          <div className="flex-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Calendar size={12} className="text-gray-500" /> Prazo (Deadline)
            </label>
            <input 
              type="date" 
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-sm text-gray-300 outline-none focus:border-indigo-500/50 transition-all shadow-inner [color-scheme:dark]"
              required
            />
          </div>
        </div>

        {/* PALETA DE CORES DA META */}
        <div>
           <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Palette size={12} className="text-gray-500" /> Cor da Meta
           </label>
           <div className="flex items-center gap-3">
              {THEME_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color ? 'scale-110 shadow-lg' : 'border-transparent hover:scale-105 opacity-50 hover:opacity-100'}`}
                  style={{ 
                     backgroundColor: color, 
                     borderColor: selectedColor === color ? 'white' : 'transparent',
                     boxShadow: selectedColor === color ? `0 0 15px ${color}80` : 'none'
                  }}
                />
              ))}
           </div>
        </div>
      </div>

      <button 
        type="submit" 
        className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl transition-all duration-300 hover:scale-[0.98] mt-2 relative overflow-hidden group/btn"
        style={{ backgroundColor: selectedColor }}
      >
        <div className="absolute inset-0 bg-black/10 group-hover/btn:bg-transparent transition-colors" />
        <Plus className="h-4 w-4 relative z-10" />
        <span className="relative z-10 text-sm tracking-wide">Iniciar Planejamento</span>
      </button>
    </form>
  )
}