'use client'

import React, { useState } from 'react'
import { TrendingUp, Plus, Target, DollarSign, Bitcoin } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function InvestmentsView({ goals, cdiRate, marketRates, onAddGoal }: any) {
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [newGoal, setNewGoal] = useState({ title: '', target_amount: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddGoal({
        title: newGoal.title,
        target_amount: Number(newGoal.target_amount)
    })
    setShowGoalForm(false)
    setNewGoal({ title: '', target_amount: '' })
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in">
      <div className="flex justify-between items-center">
         <h2 className="text-3xl font-bold text-white">Investimentos & Metas</h2>
         <button onClick={() => setShowGoalForm(!showGoalForm)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-bold transition">
            <Plus className="h-5 w-5" /> Nova Meta
         </button>
      </div>

      {/* Painel de Mercado em Tempo Real */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#111] border border-white/10 p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-500/20 rounded-lg"><TrendingUp className="h-5 w-5 text-green-500" /></div>
                  <span className="text-gray-400 text-sm">CDI (Anual)</span>
              </div>
              <p className="text-2xl font-bold text-white">{(cdiRate * 100).toFixed(2)}%</p>
          </div>
          
          <div className="bg-[#111] border border-white/10 p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg"><DollarSign className="h-5 w-5 text-blue-500" /></div>
                  <span className="text-gray-400 text-sm">Dólar (USD/BRL)</span>
              </div>
              <p className="text-2xl font-bold text-white">R$ {marketRates?.usd?.toFixed(2) || '---'}</p>
          </div>

          <div className="bg-[#111] border border-white/10 p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-500/20 rounded-lg"><Bitcoin className="h-5 w-5 text-orange-500" /></div>
                  <span className="text-gray-400 text-sm">Bitcoin (BTC)</span>
              </div>
              <p className="text-2xl font-bold text-white">
                 {marketRates?.btc ? formatCurrency(marketRates.btc) : '---'}
              </p>
          </div>
      </div>

      {showGoalForm && (
          <form onSubmit={handleSubmit} className="bg-[#111] border border-white/10 p-6 rounded-xl space-y-4">
              <input placeholder="Nome da Meta (Ex: Viagem)" value={newGoal.title} onChange={e => setNewGoal({...newGoal, title: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white" required />
              <input placeholder="Valor Alvo (R$)" type="number" value={newGoal.target_amount} onChange={e => setNewGoal({...newGoal, target_amount: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white" required />
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold">Criar Meta</button>
          </form>
      )}

      {/* Lista de Metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {goals.map((goal: any) => {
             const progress = (goal.current_amount / goal.target_amount) * 100
             return (
                 <div key={goal.id} className="bg-[#111] border border-white/10 p-6 rounded-2xl space-y-4">
                     <div className="flex justify-between">
                         <h3 className="font-bold text-white">{goal.title}</h3>
                         <Target className="h-5 w-5 text-violet-500" />
                     </div>
                     <div>
                         <div className="flex justify-between text-sm mb-1">
                             <span className="text-gray-400">Progresso</span>
                             <span className="text-white font-bold">{progress.toFixed(0)}%</span>
                         </div>
                         <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                             <div className="h-full bg-violet-600 transition-all duration-500" style={{ width: `${progress}%` }} />
                         </div>
                     </div>
                     <div className="flex justify-between text-sm">
                         <span className="text-gray-500">Atual: {formatCurrency(goal.current_amount)}</span>
                         <span className="text-gray-500">Alvo: {formatCurrency(goal.target_amount)}</span>
                     </div>
                 </div>
             )
         })}
      </div>
    </div>
  )
}