'use client'

import React, { useState } from 'react'
import { Goal, NewGoal, EmergencyFund } from '@/types_db'
import { ActiveTab } from '@/types'
import MarketDataCard from '../investments/MarketDataCard'
import CdiCard from '../investments/CdiCard'

const MOCK_MARKET_DATA = [
  { name: 'S&P 500', value: 5085.3, change: 0.85, direction: 'up' },
  { name: 'IBOVESPA', value: 128540.0, change: 0.15, direction: 'up' },
  { name: 'Bitcoin', value: 345000.00, change: -1.2, direction: 'down' }
];

interface InvestmentsProps {
  goals: Goal[]
  cdiRate: number
  emergencyFund?: EmergencyFund | null // Adicionado para corrigir o erro
  onAddGoal?: (goal: NewGoal) => Promise<void> | void
  handleRedirect?: (tab: ActiveTab) => void
}

export default function InvestmentsView({ goals, cdiRate, emergencyFund, onAddGoal }: InvestmentsProps) {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')

  const handleCreate = async () => {
    if (title && amount && onAddGoal) {
      await onAddGoal({ title, target_amount: Number(amount) })
      setTitle('')
      setAmount('')
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in">
      <div className="border-b border-white/10 pb-4">
         <h2 className="text-3xl font-bold text-white">Central de Investimentos</h2>
         <p className="text-gray-400">Gestão inteligente de patrimônio</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#151515] border border-white/10 rounded-2xl overflow-hidden">
                 <MarketDataCard marketData={MOCK_MARKET_DATA} />
              </div>
              <div className="bg-[#151515] border border-white/10 rounded-2xl overflow-hidden">
                 <CdiCard cdiRate={cdiRate} />
              </div>
           </div>
           
           <div className="p-6 bg-[#151515] border border-white/10 rounded-2xl">
              <h3 className="text-white font-bold mb-4">Adicionar Nova Meta</h3>
              <div className="space-y-4">
                <input 
                    placeholder="Nome da Meta (ex: Viagem)" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-violet-500 outline-none" 
                />
                <input 
                    type="number" 
                    placeholder="Valor Alvo (R$)" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-violet-500 outline-none" 
                />
                <button 
                    onClick={handleCreate} 
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg transition"
                >
                    Criar Meta
                </button>
              </div>
           </div>
        </div>
        
        <div className="bg-[#151515] border border-violet-500/20 rounded-2xl p-6 h-full flex flex-col justify-between">
            <div>
                <h3 className="text-violet-400 font-bold mb-2">Consultor Inteligente</h3>
                <p className="text-sm text-gray-400">
                    Sua reserva de emergência atual no caixa é de <span className="text-white font-bold">R$ {emergencyFund?.current_amount || 0}</span>.
                </p>
            </div>
            <button className="w-full bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm mt-4">Ver Recomendações</button>
        </div>
      </div>
    </div>
  )
}