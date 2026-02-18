'use client'

import React, { useState } from 'react'
import { X, TrendingUp, TrendingDown, RefreshCcw, CheckCircle, Calendar } from 'lucide-react'
import { TransactionType, NewTransaction } from '@/types_db'

// Categorias simples
const CATEGORIES = [
  'Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 
  'Educação', 'Salário', 'Investimento', 'Serviços', 'Outros'
]

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (transaction: NewTransaction) => void
}

export default function AddTransactionModal({ isOpen, onClose, onSave }: Props) {
  const [type, setType] = useState<TransactionType>('despesa_variavel')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Outros')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  
  // Novos estados para suportar a tipagem do banco
  const [isPaid, setIsPaid] = useState(true)
  const [isFixed, setIsFixed] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const val = parseFloat(amount.replace(',', '.'))
    if (isNaN(val) || !description) return

    // Ajusta sinal baseado no tipo (Receita = Positivo, Despesa = Negativo)
    // Nota: O financeService pode lidar com isso, mas garantimos aqui a lógica visual
    const finalAmount = (type === 'receita') ? Math.abs(val) : -Math.abs(val)

    onSave({
      type,
      description,
      amount: finalAmount,
      category,
      date,
      // CAMPOS OBRIGATÓRIOS QUE FALTAVAM:
      is_paid: isPaid,
      is_fixed: isFixed,
      // Opcionais podem ir undefined ou null
      payment_method: 'Manual',
      card_id: undefined 
    })

    // Reset form
    setDescription('')
    setAmount('')
    setType('despesa_variavel')
    setIsFixed(false)
    setIsPaid(true)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#09090b] border border-white/10 rounded-3xl p-6 relative shadow-2xl">
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
            <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold text-white mb-6">Nova Transação</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Seletor de Tipo */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                    type="button"
                    onClick={() => { setType('receita'); setIsFixed(false); }}
                    className={`p-3 rounded-xl flex flex-col items-center gap-1 border transition-all ${
                        type === 'receita' 
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                        : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                    }`}
                >
                    <TrendingUp size={20} />
                    <span className="text-[10px] font-bold uppercase">Receita</span>
                </button>
                <button
                    type="button"
                    onClick={() => { setType('despesa_variavel'); setIsFixed(false); }}
                    className={`p-3 rounded-xl flex flex-col items-center gap-1 border transition-all ${
                        type === 'despesa_variavel' 
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400' 
                        : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                    }`}
                >
                    <TrendingDown size={20} />
                    <span className="text-[10px] font-bold uppercase">Despesa</span>
                </button>
                <button
                    type="button"
                    onClick={() => { setType('despesa_fixa'); setIsFixed(true); }}
                    className={`p-3 rounded-xl flex flex-col items-center gap-1 border transition-all ${
                        type === 'despesa_fixa' 
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                        : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                    }`}
                >
                    <RefreshCcw size={20} />
                    <span className="text-[10px] font-bold uppercase">Fixa</span>
                </button>
            </div>

            {/* Inputs Principais */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Descrição</label>
                <input 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors"
                    placeholder="Ex: Mercado, Aluguel..."
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Valor (R$)</label>
                    <input 
                        type="number"
                        step="0.01"
                        value={amount} 
                        onChange={e => setAmount(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors"
                        placeholder="0,00"
                        required
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Categoria</label>
                    <select 
                        value={category} 
                        onChange={e => setCategory(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 [color-scheme:dark]"
                    >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Data</label>
                <input 
                    type="date"
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 [color-scheme:dark]"
                    required
                />
            </div>

            {/* Checkboxes Extras */}
            <div className="flex gap-4 pt-2">
                <button 
                    type="button"
                    onClick={() => setIsPaid(!isPaid)}
                    className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                        isPaid ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-transparent text-gray-500'
                    }`}
                >
                    <CheckCircle size={16} />
                    <span className="text-xs font-bold">{isPaid ? 'Pago / Recebido' : 'Pendente'}</span>
                </button>
                
                {/* Opcional: Toggle manual de Fixo caso o usuário mude de ideia */}
                <button 
                    type="button"
                    onClick={() => setIsFixed(!isFixed)}
                    className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                        isFixed ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-white/5 border-transparent text-gray-500'
                    }`}
                >
                    <RefreshCcw size={16} />
                    <span className="text-xs font-bold">{isFixed ? 'Mensal/Fixo' : 'Único'}</span>
                </button>
            </div>

            <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl mt-4 shadow-lg shadow-blue-900/20 transition-all active:scale-95"
            >
                Salvar Transação
            </button>

        </form>
      </div>
    </div>
  )
}