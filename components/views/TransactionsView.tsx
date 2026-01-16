'use client'

import React from 'react'
import { Transaction } from '@/types_db'

// Define a interface para aceitar a prop que o MainAppLayout está enviando
interface TransactionsViewProps {
  transactions?: Transaction[]
  onAddTransaction?: (t: Transaction) => void
}

export default function TransactionsView({ transactions = [], onAddTransaction }: TransactionsViewProps) {
  return (
    <div className="p-8 text-white">
      <h2 className="text-2xl font-bold mb-4">Transações</h2>
      {/* Aqui você implementará a lista e o modal de adição depois */}
      <p className="text-gray-400">Histórico de transações será exibido aqui.</p>
      
      <div className="mt-4 space-y-2">
        {transactions.map((t) => (
            <div key={t.id} className="p-4 bg-[#111] border border-white/10 rounded-xl flex justify-between">
                <span>{t.description}</span>
                <span>R$ {t.amount}</span>
            </div>
        ))}
      </div>
    </div>
  )
}