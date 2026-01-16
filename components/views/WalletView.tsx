'use client'

import React, { useState } from 'react'
import { Plus, CreditCard, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function WalletView({ cards, onAddCard, onDeleteCard }: any) {
  const [showForm, setShowForm] = useState(false)
  const [newCard, setNewCard] = useState({ alias: '', lastFour: '', limit: '', dueDay: '' })

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      onAddCard({
          alias: newCard.alias,
          lastFour: newCard.lastFour,
          limit: Number(newCard.limit),
          dueDay: Number(newCard.dueDay)
      })
      setShowForm(false)
      setNewCard({ alias: '', lastFour: '', limit: '', dueDay: '' })
  }

  return (
    <div className="p-8 animate-in fade-in space-y-8">
      <div className="flex justify-between items-center">
         <h2 className="text-3xl font-bold text-white">Minha Carteira</h2>
         <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-bold transition">
            <Plus className="h-5 w-5" /> Novo Cartão
         </button>
      </div>

      {showForm && (
          <div className="bg-[#111] border border-white/10 rounded-xl p-6 mb-6">
              <h3 className="text-white font-bold mb-4">Adicionar Cartão Seguro</h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input placeholder="Apelido (Ex: Nubank)" value={newCard.alias} onChange={e => setNewCard({...newCard, alias: e.target.value})} className="bg-black/40 border border-white/10 p-3 rounded-lg text-white" required />
                  <input placeholder="Últimos 4 dígitos" maxLength={4} value={newCard.lastFour} onChange={e => setNewCard({...newCard, lastFour: e.target.value})} className="bg-black/40 border border-white/10 p-3 rounded-lg text-white" required />
                  <input placeholder="Limite (R$)" type="number" value={newCard.limit} onChange={e => setNewCard({...newCard, limit: e.target.value})} className="bg-black/40 border border-white/10 p-3 rounded-lg text-white" required />
                  <input placeholder="Dia Vencimento" type="number" max={31} value={newCard.dueDay} onChange={e => setNewCard({...newCard, dueDay: e.target.value})} className="bg-black/40 border border-white/10 p-3 rounded-lg text-white" required />
                  <button type="submit" className="md:col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold">Salvar Cartão</button>
              </form>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card: any) => (
          <div key={card.id} className="relative h-48 rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-white/10 p-6 flex flex-col justify-between group hover:border-violet-500/50 transition duration-300">
             <div className="flex justify-between items-start">
                <CreditCard className="h-8 w-8 text-violet-400" />
                <span className="font-mono text-white/50 text-sm tracking-widest">**** {card.last_four_digits}</span>
             </div>
             <div>
                <p className="text-gray-400 text-xs uppercase mb-1">{card.card_alias}</p>
                <p className="text-white font-bold text-xl">{formatCurrency(Number(card.limit_amount))}</p>
             </div>
             <div className="flex justify-between items-end">
                <p className="text-xs text-gray-500">Vence dia {card.due_day}</p>
                <button onClick={() => onDeleteCard(card.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition">
                    <Trash2 className="h-5 w-5" />
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}