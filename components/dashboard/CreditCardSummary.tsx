// components/dashboard/CreditCardSummary.tsx
'use client'

import React from 'react'
import { CreditCard } from '@/types_db'
import { CreditCard as CardIcon, ArrowRight } from 'lucide-react'

type CreditCardSummaryProps = {
  cards: CreditCard[]
  onCardClick: () => void // Novo prop para o redirecionamento
}

export default function CreditCardSummary({ cards, onCardClick }: CreditCardSummaryProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-xl font-semibold text-text-dark dark:text-white">
        Meus Cartões
      </h3>
      <div className="space-y-4">
        {cards.length > 0 ? (
          cards.map((card) => (
            // Card Clicável com Estilo Premium
            <div
              key={card.id}
              onClick={onCardClick} // Torna o card clicável
              className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all duration-150 hover:bg-gray-100 hover:shadow-md dark:border-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              <div className="flex items-center gap-3">
                <CardIcon className="h-6 w-6 text-brand-violet" />
                <div>
                  <p className="font-medium text-text-dark dark:text-white">
                    {card.name}
                  </p>
                  <p className="text-sm text-text-light">
                    Vencimento dia {card.due_day}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-red-500">R$ 0,00</p>
                <p className="text-xs text-text-light">Fatura atual</p>
                <ArrowRight className="mt-1 h-4 w-4 text-brand-violet" />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-text-light">
            Nenhum cartão de crédito cadastrado.
          </p>
        )}
      </div>
      {cards.length > 0 && (
        <button 
          onClick={onCardClick}
          className="mt-4 w-full text-brand-violet font-semibold text-sm flex items-center justify-center gap-1 hover:text-brand-violet-dark transition-colors"
        >
            Ver todas as transações <ArrowRight className='h-4 w-4' />
        </button>
      )}
    </div>
  )
}