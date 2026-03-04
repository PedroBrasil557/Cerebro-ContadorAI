'use client'

import React, { useMemo } from 'react'
import { Transaction } from '@/types_db'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TrendingUp, TrendingDown, FileText } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type TransactionListProps = {
  transactions: Transaction[]
  onTransactionClick: (transaction: Transaction) => void 
}

export default function TransactionList({
  transactions,
  onTransactionClick, 
}: TransactionListProps) {
  
  const groupedTransactions = useMemo(() => {
    return transactions.reduce(
        (acc: { [key: string]: Transaction[] }, tx) => {
          const dateKey = format(parseISO(tx.date), 'yyyy-MM-dd')
          if (!acc[dateKey]) {
            acc[dateKey] = []
          }
          acc[dateKey].push(tx)
          return acc
        },
        {}
      )
  }, [transactions])

  const sortedDates = Object.keys(groupedTransactions).sort().reverse()

  if (transactions.length === 0) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center text-center text-gray-500 bg-[#0a0a0c] rounded-3xl border border-white/5 shadow-inner">
         <div className="bg-white/5 p-4 rounded-2xl mb-4 text-gray-600">
            <FileText className="h-10 w-10" />
         </div>
         <p className="text-sm font-bold tracking-wide text-white">Nenhuma transação encontrada</p>
         <p className="text-[11px] mt-1 uppercase tracking-widest text-gray-600">
           Inicie o seu registro financeiro.
         </p>
      </div>
    )
  }

  return (
    <div className="max-h-[70vh] overflow-y-auto custom-scrollbar rounded-3xl border border-white/5 bg-[#050505] p-2">
      <ul className="space-y-6 p-4">
        {sortedDates.map((date) => (
          <li key={date} className="relative">
            {/* Cabecalho de Data com Estilo OS */}
            <div className="sticky top-0 z-10 bg-[#050505]/95 backdrop-blur-md pb-3 mb-2 border-b border-white/5 flex items-center gap-2">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                {format(parseISO(date), "dd 'de' MMMM", {
                  locale: ptBR,
                })}
              </h4>
            </div>

            <ul className="space-y-1.5">
              {groupedTransactions[date].map((tx) => {
                // ✅ CORREÇÃO TS: Isolando a propriedade e forçando conversão segura
                const amountNum = Number(tx.amount) || 0
                const isPositive = amountNum > 0

                return (
                  <motion.li
                    key={tx.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    onClick={() => onTransactionClick(tx)} 
                    className="flex cursor-pointer items-center justify-between rounded-2xl p-3 transition-all duration-300 bg-[#0a0a0c] border border-white/5 hover:border-white/10 hover:bg-[#0f0f13] group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Ícone Analítico */}
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                          isPositive
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400 group-hover:bg-rose-500/20'
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="h-5 w-5" strokeWidth={2.5} />
                        ) : (
                          <TrendingDown className="h-5 w-5" strokeWidth={2.5} />
                        )}
                      </div>
                      
                      {/* Identificação da Transação */}
                      <div>
                        <p className="text-sm font-bold text-white tracking-wide group-hover:text-indigo-300 transition-colors">
                          {tx.description}
                        </p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                          {tx.category}
                        </p>
                      </div>
                    </div>
                    
                    {/* Exibição Numérica */}
                    <div className="text-right">
                       <p
                         className={`text-sm font-black tracking-tight ${
                           isPositive ? 'text-emerald-400' : 'text-white'
                         }`}
                       >
                         {isPositive ? '+' : ''}{formatCurrency(amountNum)}
                       </p>
                       
                       {/* Label Status Opcional (se você usar depois) */}
                       {tx.status === 'pendente' && (
                          <span className="text-[9px] uppercase tracking-widest text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                             Pendente
                          </span>
                       )}
                    </div>
                  </motion.li>
                )
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}