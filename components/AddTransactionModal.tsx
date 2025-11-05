// components/AddTransactionModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { CreditCard, NewTransaction } from '@/types_db' // Usando alias
import { CATEGORIES } from '@/lib/constants' // Usando alias
import { format } from 'date-fns'
import { Modal } from '@/components/ui/Modal'; // Usando Modal genérico

type TransactionType = 'expense' | 'income';

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (transaction: Omit<NewTransaction, 'user_id'>) => Promise<void>
  cards: CreditCard[]
  initialType: TransactionType; // <--- CORREÇÃO: PROPRIEDADE FALTANDO
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSave,
  cards,
  initialType, // <--- Recebido aqui
}: ModalProps) {
  
  // CORREÇÃO: Usa initialType para definir o estado inicial
  const [type, setType] = useState<TransactionType>(initialType) 
  
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [category, setCategory] = useState('')
  const [creditCardId, setCreditCardId] = useState<string | null>(null)

  // Garante que o estado do modal se ajuste se a prop initialType mudar
  useEffect(() => {
    setType(initialType);
    setCategory('');
    setCreditCardId(null);
  }, [initialType]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!description || !amount || !date || !category) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

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
    onClose(); // Fechar após salvar
  }

  const categoryOptions =
    type === 'expense' ? CATEGORIES.expense : CATEGORIES.income

  return (
    <AnimatePresence>
      {isOpen && (
        <Modal 
          isOpen={isOpen} 
          onClose={onClose} 
          title={type === 'income' ? 'Registrar Receita' : 'Registrar Despesa'}
        >
            <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
              <button
                type="button"
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
                type="button"
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
                min="0"
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
                className="w-full rounded-lg bg-brand-violet px-4 py-2.5 font-medium text-white transition-colors hover:bg-brand-violet-dark"
              >
                Salvar Transação
              </button>
            </form>
        </Modal>
      )}
    </AnimatePresence>
  )
}