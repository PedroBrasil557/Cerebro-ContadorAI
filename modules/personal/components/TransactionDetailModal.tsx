'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Save, Trash2, Edit, Calendar, Tag, 
  ArrowUpRight, ArrowDownLeft, CheckCircle2, AlertTriangle, FileText, AlertCircle 
} from 'lucide-react'
import { Transaction } from '@/core/action/transactions'

// --- CONSTANTES LOCAIS ---
const CATEGORIES = {
  income: ['Salário', 'Investimentos', 'Freelance', 'Presente', 'Outros'],
  expense: ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Compras', 'Outros']
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

// --- PROPS ---
type TransactionDetailModalProps = {
  isOpen: boolean
  transaction: Transaction | null
  onClose: () => void
  onUpdate: (tx: Transaction, reason: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  loading?: boolean
}

export default function TransactionDetailModal({
  isOpen,
  transaction,
  onClose,
  onUpdate,
  onDelete,
  loading = false
}: TransactionDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Estado para o Modal de Confirmação de Exclusão (Substitui o window.confirm)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Estados do Formulário
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState('')
  const [editReason, setEditReason] = useState('')

  // Sincroniza dados ao abrir
  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description)
      setAmount(Math.abs(transaction.amount).toFixed(2))
      setCategory(transaction.category)
      const safeDate = transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : ''
      setDate(safeDate)
      setType(transaction.type)
      setEditReason('')
      setIsEditing(false)
      setShowDeleteConfirm(false)
    }
  }, [transaction, isOpen])

  if (!isOpen || !transaction) return null

  const isIncome = type === 'receita'
  const categoryOptions = isIncome ? CATEGORIES.income : CATEGORIES.expense

  // --- AÇÃO: SALVAR ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação de Auditoria
    if (!editReason || editReason.trim().length < 5) {
        alert("Por favor, descreva o motivo da edição para manter o histórico auditável.")
        return
    }

    setIsSaving(true)
    const numericAmount = parseFloat(amount)

    if (isNaN(numericAmount) || numericAmount <= 0) {
        alert("O valor deve ser positivo.")
        setIsSaving(false)
        return
    }

    const updatedTx: Transaction = {
      ...transaction,
      description,
      category,
      date,
      amount: isIncome ? numericAmount : -Math.abs(numericAmount),
    }

    await onUpdate(updatedTx, editReason)
    
    setIsSaving(false)
    setIsEditing(false)
  }
  
  // --- AÇÃO: DELETAR (Inicia o fluxo visual) ---
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  // --- AÇÃO: CONFIRMAR DELEÇÃO ---
  const confirmDelete = async () => {
    setIsSaving(true)
    await onDelete(transaction.id)
    setShowDeleteConfirm(false)
    onClose()
    setIsSaving(false)
  }

  // Cores Dinâmicas
  const headerBg = isIncome ? 'bg-emerald-500/10' : 'bg-rose-500/10'
  const iconBg = isIncome ? 'bg-emerald-500 text-emerald-950' : 'bg-rose-500 text-white'
  const textColor = isIncome ? 'text-emerald-500' : 'text-rose-500'

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          
          <div className="absolute inset-0" onClick={onClose}></div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-[#09090b] border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative z-10"
          >
            
            {/* CABEÇALHO */}
            <div className={`h-32 w-full flex items-center justify-center relative transition-colors duration-300 ${headerBg}`}>
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition z-10">
                    <X size={20} />
                </button>
                
                <div className="flex flex-col items-center animate-in zoom-in duration-300">
                    <div className={`p-4 rounded-full mb-3 shadow-lg ${iconBg}`}>
                        {isIncome ? <ArrowUpRight size={32} /> : <ArrowDownLeft size={32} />}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-widest ${textColor}`}>
                        {isEditing ? 'Editando Transação' : isIncome ? 'Receita Recebida' : 'Despesa Realizada'}
                    </span>
                </div>
            </div>

            {/* CONTEÚDO */}
            <div className="p-6">
                
                {isEditing ? (
                   /* === MODO EDIÇÃO === */
                   <form onSubmit={handleSave} className="space-y-4">
                      
                      {/* Descrição */}
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Descrição</label>
                        <input
                          type="text" required value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition"
                        />
                      </div>

                      {/* Valor e Data */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Valor (R$)</label>
                            <input
                              type="number" required step="0.01" value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Data</label>
                            <input
                              type="date" required value={date}
                              onChange={(e) => setDate(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition [color-scheme:dark]"
                            />
                        </div>
                      </div>

                      {/* Categoria */}
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Categoria</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition [&>option]:bg-black cursor-pointer appearance-none"
                        >
                          {categoryOptions.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      {/* CAMPO DE MOTIVO (AUDITORIA - OBRIGATÓRIO) */}
                      <div className="pt-2 border-t border-white/10 mt-2">
                        <label className="text-xs font-bold text-amber-500 uppercase mb-1 flex items-center gap-1">
                            <AlertTriangle size={12} /> Motivo da Edição (Obrigatório)
                        </label>
                        <textarea
                            value={editReason}
                            onChange={(e) => setEditReason(e.target.value)}
                            placeholder="Ex: Digitei o valor errado..."
                            rows={2}
                            required
                            className="w-full bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-white text-sm focus:border-amber-500 focus:outline-none resize-none"
                        />
                      </div>

                      {/* Botões */}
                      <div className="flex gap-3 pt-2">
                        <button 
                            type="button" disabled={isSaving} onClick={() => setIsEditing(false)} 
                            className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 hover:text-white transition"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" disabled={isSaving}
                            className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Save size={18} /> {isSaving ? 'Salvando...' : 'Salvar'}
                        </button>
                      </div>
                   </form>

                ) : (
                   /* === MODO VISUALIZAÇÃO === */
                   <div className="space-y-6">
                        {/* Valor Grande */}
                        <div className="text-center border-b border-white/5 pb-6">
                            <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
                                {formatCurrency(Math.abs(transaction.amount))}
                            </h2>
                            <p className="text-lg text-gray-300 font-medium">{transaction.description}</p>
                        </div>

                        {/* Grid de Detalhes */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <Tag size={14} /> <span className="text-xs font-bold uppercase">Categoria</span>
                                </div>
                                <p className="text-white font-medium">{transaction.category}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <CheckCircle2 size={14} /> <span className="text-xs font-bold uppercase">Status</span>
                                </div>
                                <p className="text-white font-medium capitalize flex items-center gap-2">
                                    <span className={`h-2 w-2 rounded-full ${transaction.is_paid ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                    {transaction.is_paid ? 'Pago / Recebido' : 'Pendente'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Data do Lançamento</p>
                                <p className="text-white capitalize font-medium text-lg">
                                    {new Date(transaction.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                </p>
                            </div>
                        </div>

                        {/* Motivo da última edição (Auditoria) */}
                        {transaction.edit_note && (
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                                    <FileText size={12} /> Nota de Edição
                                </p>
                                <p className="text-gray-300 text-sm italic">"{transaction.edit_note}"</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-2">
                             <button 
                                onClick={() => setIsEditing(true)}
                                disabled={loading || isSaving}
                                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition border border-white/5 group"
                             >
                                <Edit size={18} className="group-hover:text-blue-400 transition-colors" /> Editar
                             </button>
                             <button 
                                onClick={handleDeleteClick}
                                disabled={loading || isSaving}
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

    {/* --- OVERLAY DE CONFIRMAÇÃO DE EXCLUSÃO (PREMIUM) --- */}
    <AnimatePresence>
        {showDeleteConfirm && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-sm bg-[#09090b] border border-red-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
                    
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500 animate-pulse">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Tem certeza?</h3>
                        <p className="text-sm text-gray-400">
                            Você está prestes a excluir <span className="text-white font-bold">"{transaction?.description}"</span>. Esta ação não pode ser desfeita.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={confirmDelete}
                            disabled={isSaving}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold hover:opacity-90 shadow-lg shadow-red-900/20 transition flex items-center justify-center gap-2"
                        >
                            {isSaving ? 'Excluindo...' : 'Sim, Excluir'}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
    </>
  )
}