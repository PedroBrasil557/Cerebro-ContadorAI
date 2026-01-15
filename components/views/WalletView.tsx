'use client'

import React from 'react'
import { CreditCard as CardIcon, Plus, Trash2, Smartphone } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function WalletView({ cards, onAddCard, onDeleteCard }: any) {
  const addMockCard = () => {
    onAddCard({
      id: Math.random().toString(),
      name: 'Nubank Platinum',
      limit: 8500,
      due_day: 12,
      closing_day: 5,
      user_id: '1',
      created_at: new Date().toISOString()
    })
  }

  return (
    <div className="space-y-8 p-6 md:p-10 animate-in fade-in zoom-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Minha Carteira</h2>
          <p className="text-gray-400">Gerencie seus cartões e limites em um só lugar.</p>
        </div>
        <button onClick={addMockCard} className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 font-medium text-white hover:bg-brand-primary-dark transition">
          <Plus className="h-5 w-5" /> Novo Cartão
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card: any, idx: number) => (
          <div key={card.id} className={`group relative flex h-56 flex-col justify-between overflow-hidden rounded-2xl p-6 shadow-2xl transition-all hover:-translate-y-2
            ${idx % 2 === 0 ? 'bg-gradient-to-br from-indigo-600 to-purple-700' : 'bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700'}`}>
            
            {/* Chip & Logo */}
            <div className="flex justify-between items-start">
              <div className="h-8 w-10 rounded bg-gradient-to-br from-yellow-200 to-yellow-500 opacity-80" />
              <CardIcon className="h-8 w-8 text-white/50" />
            </div>

            {/* Info */}
            <div>
              <p className="font-mono text-lg text-white/90 tracking-widest">**** **** **** 4242</p>
              <div className="mt-4 flex justify-between">
                <div>
                  <p className="text-[10px] uppercase text-white/60">Titular</p>
                  <p className="font-medium text-white">{card.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase text-white/60">Limite</p>
                  <p className="font-bold text-white">{formatCurrency(card.limit)}</p>
                </div>
              </div>
            </div>

            {/* Delete Action */}
            <button 
              onClick={() => onDeleteCard(card.id)}
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-white/80 hover:text-red-400"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
        
        {/* Placeholder para adicionar */}
        <button onClick={addMockCard} className="flex h-56 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-800 bg-transparent text-gray-500 hover:border-brand-primary hover:text-brand-primary transition">
           <Plus className="h-8 w-8" />
           <span className="font-medium">Adicionar outro cartão</span>
        </button>
      </div>
    </div>
  )
}