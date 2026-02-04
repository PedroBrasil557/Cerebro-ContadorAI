'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Trash2, Edit, Calendar, Tag, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react'
import { Transaction } from '@/types_db'
import { CATEGORIES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { format, parseISO } from 'date-fns'

type TransactionDetailModalProps = {
  isOpen: boolean // Adicionei para controlar a animação corretamente
  transaction: Transaction | null // CORREÇÃO: Aceita null
  onClose: () => void
  onUpdate: (tx: Transaction) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function TransactionDetailModal({
  isOpen,
  transaction,
  onClose,
  onUpdate,
  onDelete,
}: TransactionDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  
  // Estados com valores seguros (evita erro se transaction for null)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState('')

  // Atualiza os campos quando a transação muda ou o modal abre
  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description)
      setAmount(Math.abs(transaction.amount).toFixed(2))
      setCategory(transaction.category)
      setDate(format(parseISO(transaction.date), 'yyyy-MM-dd'))
      setIsEditing(false) // Sempre reseta para visualização ao abrir
    }
  }, [transaction, isOpen])

  if (!isOpen || !transaction) return null

  const isIncome = transaction.type === 'receita'
  const categoryOptions = isIncome ? CATEGORIES.income : CATEGORIES.expense

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const updatedAmount = parseFloat(amount)

    if (isNaN(updatedAmount) || updatedAmount <= 0) {
        alert("O valor deve ser positivo.")
        return
    }

    const updatedTx: Transaction = {
      ...transaction,
      description,
      category,
      date,
      amount: isIncome ? updatedAmount : -updatedAmount, // Mantém o sinal correto
    }

    await onUpdate(updatedTx)
    setIsEditing(false)
  }
  
  const handleDeleteClick = async () => {
    if (confirm("ATENÇÃO: Deseja realmente excluir esta transação?")) {
        await onDelete(transaction.id)
        onClose()
    }
  }

  // Visual Premium
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-[#09090b] border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative"
          >
            
            {/* --- CABEÇALHO COLORIDO --- */}
            <div className={`h-32 w-full flex items-center justify-center relative transition-colors duration-300 ${
                isIncome ? 'bg-emerald-500/10' : 'bg-rose-500/10'
            }`}>
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition z-10">
                    <X size={20} />
                </button>
                
                <div className="flex flex-col items-center">
                    <div className={`p-4 rounded-full mb-3 shadow-lg ${
                        isIncome ? 'bg-emerald-500 text-emerald-950 shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'
                    }`}>
                        {isIncome ? <ArrowUpRight size={32} /> : <ArrowDownLeft size={32} />}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-widest ${
                        isIncome ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                        {isEditing ? 'Editando...' : isIncome ? 'Receita Recebida' : 'Despesa Realizada'}
                    </span>
                </div>
            </div>

            {/* --- CORPO DO MODAL --- */}
            <div className="p-6">
                
                {isEditing ? (
                   /* --- MODO EDIÇÃO --- */
                   <form onSubmit={handleSave} className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Descrição</label>
                        <input
                          type="text"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Valor (R$)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Data</label>
                            <input
                              type="date"
                              value={date}
                              onChange={(e) => setDate(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition [color-scheme:dark]"
                            />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Categoria</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition [&>option]:bg-black"
                        >
                          {categoryOptions.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 hover:text-white transition">
                            Cancelar
                        </button>
                        <button type="submit" className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2">
                            <Save size={18} /> Salvar
                        </button>
                      </div>
                   </form>

                ) : (
                   /* --- MODO VISUALIZAÇÃO (PREMIUM) --- */
                   <div className="space-y-6">
                        {/* Valor Gigante */}
                        <div className="text-center border-b border-white/5 pb-6">
                            <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
                                {formatCurrency(Math.abs(transaction.amount))}
                            </h2>
                            <p className="text-lg text-gray-300 font-medium">{transaction.description}</p>
                        </div>

                        {/* Grid de Detalhes */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-2 text-gray-400 mb-1">
                                    <Tag size={14} /> <span className="text-xs font-bold uppercase">Categoria</span>
                                </div>
                                <p className="text-white font-medium">{transaction.category}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-2 text-gray-400 mb-1">
                                    <CheckCircle2 size={14} /> <span className="text-xs font-bold uppercase">Status</span>
                                </div>
                                <p className="text-white font-medium capitalize">{transaction.status || 'Concluído'}</p>
                            </div>
                        </div>

                        {/* Data */}
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Data do Lançamento</p>
                                <p className="text-white capitalize font-medium">
                                    {new Date(transaction.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                             <button 
                                onClick={() => setIsEditing(true)}
                                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition border border-white/5"
                             >
                                <Edit size={18} /> Editar
                             </button>
                             <button 
                                onClick={handleDeleteClick}
                                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold transition border border-red-500/10 hover:border-red-500/30"
                             >
                                <Trash2 size={18} /> Excluir
                             </button>
                        </div>
                   </div>
                )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}