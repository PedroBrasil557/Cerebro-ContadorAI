'use client'

import React, { useState } from 'react'
import { X, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react'
import { TransactionType, NewTransaction } from '@/types_db'

// Categorias simples para evitar erros de importação
const CATEGORIES = [
  'Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 
  'Educação', 'Serviços', 'Assinaturas', 'Salário', 'Investimento', 'Outros'
]

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (transaction: NewTransaction) => void
}

export default function AddTransactionModal({ isOpen, onClose, onSave }: AddTransactionModalProps) {
  const [type, setType] = useState<TransactionType>('despesa_variavel')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const numericAmount = parseFloat(amount.replace(',', '.'))
    if (!numericAmount || !description) return

    // Lógica de Sinal: Se for receita é positivo, se for despesa é negativo
    const finalAmount = type === 'receita' ? Math.abs(numericAmount) : -Math.abs(numericAmount)

    onSave({
      type,
      description,
      amount: finalAmount,
      category: category || 'Geral',
      date: new Date().toISOString(),
    })

    // Limpar e Fechar
    setDescription('')
    setAmount('')
    setCategory('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-6">Nova Transação</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Seletor de Tipo */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setType('receita')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${
                type === 'receita' 
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                  : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
              }`}
            >
              <TrendingUp className="h-5 w-5 mb-1" />
              <span className="text-xs font-bold">Receita</span>
            </button>

            <button
              type="button"
              onClick={() => setType('despesa_variavel')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${
                type === 'despesa_variavel' 
                  ? 'bg-red-500/20 border-red-500 text-red-400' 
                  : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
              }`}
            >
              <TrendingDown className="h-5 w-5 mb-1" />
              <span className="text-xs font-bold">Variável</span>
            </button>

            <button
              type="button"
              onClick={() => setType('despesa_fixa')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${
                type === 'despesa_fixa' 
                  ? 'bg-orange-500/20 border-orange-500 text-orange-400' 
                  : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
              }`}
            >
              <RefreshCcw className="h-5 w-5 mb-1" />
              <span className="text-xs font-bold">Fixa</span>
            </button>
          </div>

          {/* Valor */}
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase ml-1">Valor</label>
            <input 
              type="number"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-2xl font-bold text-white outline-none focus:border-violet-500 transition"
              autoFocus
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase ml-1">Descrição</label>
            <input 
              type="text"
              placeholder="Ex: Supermercado, Salário..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-violet-500 transition"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase ml-1">Categoria</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-violet-500 transition appearance-none"
            >
              <option value="">Selecione...</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-4 rounded-xl transition mt-4 shadow-lg shadow-violet-900/20"
          >
            Confirmar Transação
          </button>
        </form>
      </div>
    </div>
  )
}