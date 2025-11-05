// components/transactions/TransactionDetailModal.tsx
'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Trash2, Edit } from 'lucide-react'
import { Transaction, NewTransaction } from '@/types_db'
import { CATEGORIES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { format, parseISO } from 'date-fns'

type TransactionDetailModalProps = {
  transaction: Transaction
  onClose: () => void
  onUpdate: (tx: Transaction) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function TransactionDetailModal({
  transaction,
  onClose,
  onUpdate,
  onDelete,
}: TransactionDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [description, setDescription] = useState(transaction.description)
  const [amount, setAmount] = useState(Math.abs(transaction.amount).toFixed(2)) // Sempre mostra positivo no campo
  const [category, setCategory] = useState(transaction.category)
  const [date, setDate] = useState(format(parseISO(transaction.date), 'yyyy-MM-dd'))

  const isIncome = transaction.amount > 0
  const categoryOptions = isIncome ? CATEGORIES.income : CATEGORIES.expense

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const updatedAmount = parseFloat(amount);

    if (isNaN(updatedAmount) || updatedAmount <= 0) {
        alert("O valor deve ser positivo.");
        return;
    }

    const updatedTx: Transaction = {
      ...transaction,
      description,
      category,
      date,
      // Aplicamos o sinal correto:
      amount: isIncome ? updatedAmount : -updatedAmount, 
    };

    onUpdate(updatedTx);
  };
  
  const handleDeleteClick = () => {
    if (confirm("ATENÇÃO: Deseja realmente excluir esta transação?")) {
        onDelete(transaction.id);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-text-dark dark:text-white">
                {isEditing ? 'Editar' : 'Detalhes'} ({isIncome ? 'Receita' : 'Despesa'})
            </h2>
            <button onClick={onClose} className="rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Campos de Visualização/Edição */}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Descrição"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                readOnly={!isEditing}
                className={`w-full rounded-md border p-2 ${isEditing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-100'} dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
              />
              <input
                type="number"
                placeholder="Valor"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                readOnly={!isEditing}
                className={`w-full rounded-md border p-2 ${isEditing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-100'} dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                readOnly={!isEditing}
                className={`w-full rounded-md border p-2 ${isEditing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-100'} dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={!isEditing}
                className={`w-full rounded-md border p-2 ${isEditing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-100'} dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Botões de Ação */}
            <div className="flex justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                {/* Botão de Excluir */}
                <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-200"
                >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                </button>

                {/* Botões de Edição/Salvamento */}
                {isEditing ? (
                    <button
                        type="submit"
                        className="flex items-center gap-2 rounded-lg bg-brand-violet px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-violet-dark"
                    >
                        <Save className="h-4 w-4" />
                        Salvar Alterações
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                    >
                        <Edit className="h-4 w-4" />
                        Editar
                    </button>
                )}
            </div>
          </form>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}