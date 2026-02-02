'use client'

import React, { useState } from 'react'
import { X, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react'
import { TransactionType, NewTransaction } from '@/types_db' // Agora vai encontrar os tipos

// Categorias simples
const CATEGORIES = [
  'Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 
  'Educação', 'Serviços', 'Assinaturas', 'Salário', 'Investimento', 'Outros', 'Caixa Empresarial'
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

    // Converte string "1.200,50" para float
    const numericAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'))
    
    // Fallback simples se não tiver ponto de milhar
    const simpleNumeric = parseFloat(amount.replace(',', '.'))
    
    const finalVal = isNaN(numericAmount) ? simpleNumeric : numericAmount

    if (!finalVal || !description) return

    // Lógica de Sinal: Se for receita é positivo, se for despesa é negativo
    // Transferência geralmente é tratada como saída ou neutra, aqui vou tratar como saída do caixa pessoal
    const signedAmount = (type === 'receita') ? Math.abs(finalVal) : -Math.abs(finalVal)

    onSave({
      type,
      description,
      amount: signedAmount,
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
      <div className="w-full max-w-md bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
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
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400' 
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
              type="text" // Mudado para text para facilitar digitar virgula
              placeholder="0,00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-2xl font-bold text-white outline-none focus:border-blue-500 transition"
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
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase ml-1">Categoria</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition appearance-none"
            >
              <option value="" className="bg-[#09090b]">Selecione...</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat} className="bg-[#09090b]">{cat}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition mt-4 shadow-lg shadow-blue-900/20"
          >
            Confirmar Transação
          </button>
        </form>
      </div>
    </div>
  )
}