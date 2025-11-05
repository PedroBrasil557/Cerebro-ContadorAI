// components/AddTransactionModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { CreditCard, NewTransaction } from '@/types_db' // Usando alias
import { CATEGORIES } from '@/lib/constants' // Usando alias
import { format } from 'date-fns'

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  // A prop agora é onSave e espera o tipo NewTransaction (sem user_id)
  onSave: (transaction: Omit<NewTransaction, 'user_id'>) => Promise<void>
  cards: CreditCard[]
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSave, // Usando onSave
  cards,
}: ModalProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [category, setCategory] = useState('')
  const [creditCardId, setCreditCardId] = useState<string | null>(null)

  useEffect(() => {
    setCategory('')
    setCreditCardId(null)
  }, [type])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!description || !amount || !date || !category) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    // Chama onSave com os dados do formulário
    onSave({
      type,
      description,
      // IMPORTANTE: Despesas são negativas, Receitas são positivas
      amount: type === 'expense' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount)),
      date,
      category,
      credit_card_id: type === 'expense' ? creditCardId : null,
    })
    
    // Resetar formulário
    setDescription('')
    setAmount('')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setCategory('')
    setCreditCardId(null)
  }

  const categoryOptions =
    type === 'expense' ? CATEGORIES.expense : CATEGORIES.income

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="mb-6 text-xl font-bold">Adicionar Transação</h2>

            <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
              <button
                onClick={() => setType('expense')}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  type === 'expense'
                    ? 'bg-white text-gray-900 shadow dark:bg-gray-800 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Gasto
              </button>
              <button
                onClick={() => setType('income')}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  type === 'income'
                    ? 'bg-white text-gray-900 shadow dark:bg-gray-800 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Receita
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Descrição"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <input
                type="number"
                placeholder="Valor (ex: 50.99)"
                step="0.01"
                min="0" // O usuário digita um valor positivo
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-md border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-md border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="" disabled>
                  Selecione a Categoria
                </option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {type === 'expense' && cards.length > 0 && (
                <select
                  value={creditCardId || ''}
                  onChange={(e) =>
                    setCreditCardId(e.target.value || null)
                  }
                  className="w-full rounded-md border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Pagamento (Dinheiro/Débito)</option>
                  {cards.map((card) => (
                    <option key={card.id} value={card.id}>
                      Cartão: {card.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="submit"
                className="w-full rounded-lg bg-violet-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-violet-700"
              >
                Salvar Transação
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}