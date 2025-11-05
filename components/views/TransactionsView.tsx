// components/views/TransactionsView.tsx
'use client'

import React, { useState, useMemo } from 'react'
import { Transaction } from '@/types_db'
import TransactionList from '../transactions/TransactionList'
import TransactionDetailModal from '../TransactionDetailModal' // NOVO
import { format } from 'date-fns'

type TransactionsViewProps = {
  transactions: Transaction[]
  // Adicione handlers aqui para edição/exclusão se estivéssemos conectados
  // handleUpdate: (tx: Transaction) => Promise<void>
  // handleDelete: (id: string) => Promise<void>
}

export default function TransactionsView({
  transactions,
}: TransactionsViewProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  
  // Funções Mock para Edição/Exclusão
  const handleUpdate = async (tx: Transaction) => {
    alert(`Mock: Atualizando Transação ID: ${tx.id}. Consulte o console para o objeto completo.`);
    console.log("Atualização Mock:", tx);
    setSelectedTransaction(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Tem certeza que deseja excluir a transação ID: ${id}?`)) {
      alert(`Mock: Excluindo Transação ID: ${id}`);
      setSelectedTransaction(null);
    }
  };

  // Filtros (mantidos simples por enquanto)
  const currentMonth = format(new Date(), 'yyyy-MM');
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => tx.date.startsWith(currentMonth))
  }, [transactions, currentMonth]);

  return (
    <>
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-xl font-semibold text-text-dark dark:text-white">
            Histórico de Transações (Mês Atual)
          </h3>
          {/* TODO: Adicionar Filtros */}
        </div>
        <TransactionList 
          transactions={filteredTransactions} 
          onTransactionClick={setSelectedTransaction} // Define a transação para abrir o modal
        />
      </div>

      {/* Modal de Detalhes e Edição */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </>
  )
}