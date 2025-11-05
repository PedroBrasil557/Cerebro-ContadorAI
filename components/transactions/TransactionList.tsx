// components/transactions/TransactionList.tsx
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
  onTransactionClick: (transaction: Transaction) => void // NOVO PROP
}

export default function TransactionList({
  transactions,
  onTransactionClick, // Recebido
}: TransactionListProps) {
  const groupedTransactions = useMemo(() => {
    // ... (lógica de agrupamento omitida)
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
    // ... (mensagem de lista vazia omitida)
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
        <FileText className="h-12 w-12" />
        <p className="mt-2 text-lg font-medium">Nenhuma transação encontrada</p>
        <p className="text-sm">
          Clique no botão '+' para adicionar sua primeira transação.
        </p>
      </div>
    )
  }

  return (
    <div className="max-h-[70vh] overflow-y-auto">
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {sortedDates.map((date) => (
          <li key={date} className="py-4">
            <h4 className="mb-2 text-sm font-semibold text-text-dark dark:text-white">
              {format(parseISO(date), "dd 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
            </h4>
            <ul className="space-y-3">
              {groupedTransactions[date].map((tx) => (
                <motion.li
                  key={tx.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  // Transforma em botão clicável
                  onClick={() => onTransactionClick(tx)} 
                  className="flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        tx.amount > 0
                          ? 'bg-summary-green-bg text-summary-green-icon'
                          : 'bg-summary-red-bg text-summary-red-icon'
                      }`}
                    >
                      {tx.amount > 0 ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-text-dark dark:text-white">
                        {tx.description}
                      </p>
                      <p className="text-sm text-text-light">
                        {tx.category}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-medium ${
                      tx.amount > 0
                        ? 'text-summary-green-icon'
                        : 'text-summary-red-icon'
                    }`}
                  >
                    {formatCurrency(tx.amount)}
                  </p>
                </motion.li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}