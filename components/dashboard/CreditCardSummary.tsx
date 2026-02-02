'use client'

import React from 'react'
import { CreditCard } from '@/types_db'
import { formatCurrency } from '@/lib/utils'
import { CreditCard as CardIcon, Calendar } from 'lucide-react'

interface CreditCardSummaryProps {
  cards: CreditCard[]
}

export default function CreditCardSummary({ cards }: CreditCardSummaryProps) {
  if (!cards || cards.length === 0) {
    return (
      <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
        <div className="p-3 bg-white/5 rounded-full">
          <CardIcon className="h-6 w-6 text-gray-400" />
        </div>
        <div>
          <h3 className="text-white font-bold">Nenhum cartão cadastrado</h3>
          <p className="text-sm text-gray-500">Adicione seus cartões em "Minha Carteira".</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <CardIcon className="h-5 w-5 text-blue-500" />
        Cartões de Crédito
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => {
          // Calcula a porcentagem de uso
          const usagePercent = Math.min((card.current_invoice / card.limit) * 100, 100)
          
          // Formata a data de vencimento (se for data completa YYYY-MM-DD pega o dia, se for só dia mantém)
          const dueDayDisplay = card.due_date.includes('-') 
            ? new Date(card.due_date).getDate() + 1 // Ajuste de fuso simples se necessário
            : card.due_date

          return (
            <div key={card.id} className="bg-[#09090b] border border-white/10 rounded-xl p-5 relative overflow-hidden group hover:border-blue-500/30 transition-all">
              {/* Barra de Progresso de Uso (Fundo) */}
              <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full">
                <div 
                  className={`h-full transition-all duration-500 ${
                    usagePercent > 80 ? 'bg-rose-500' : usagePercent > 50 ? 'bg-orange-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-white text-lg">{card.name}</h4>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">{card.brand}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Fatura Atual</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(card.current_invoice)}</p>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Limite Disponível</p>
                  <p className="text-sm font-medium text-emerald-400">
                    {formatCurrency(card.limit - card.current_invoice)}
                  </p>
                </div>
                
                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg">
                  <Calendar className="h-3 w-3 text-blue-400" />
                  {/* CORREÇÃO AQUI: Usando due_date em vez de due_day */}
                  <p className="text-xs font-medium text-gray-300">
                    Vence dia {typeof dueDayDisplay === 'number' && isNaN(dueDayDisplay) ? card.due_date : dueDayDisplay}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}