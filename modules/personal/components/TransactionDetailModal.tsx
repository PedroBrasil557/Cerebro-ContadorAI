'use client'

import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Edit,
  FileText,
  Landmark,
  Save,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import type { Transaction } from '@/core/action/transactions'

const CATEGORIES = {
  income: ['Salário', 'Investimentos', 'Freelance', 'Presente', 'Outros'],
  expense: ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Compras', 'Outros'],
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const inputClassName =
  'min-h-11 w-full rounded-[11px] border border-white/[0.09] bg-[#111722] px-3.5 text-sm text-[#F4F6F8] outline-none transition-colors duration-150 placeholder:text-[#6F7887] hover:border-white/[0.14] focus:border-[#665CFF]/60 focus:ring-2 focus:ring-[#665CFF]/15 disabled:cursor-not-allowed disabled:opacity-60'

type TransactionDetailModalProps = {
  isOpen: boolean
  transaction: Transaction | null
  onClose: () => void
  onUpdate: (transaction: Transaction, reason: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  loading?: boolean
}

export default function TransactionDetailModal({
  isOpen,
  transaction,
  onClose,
  onUpdate,
  onDelete,
  loading = false,
}: TransactionDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [description, setDescription] = useState(transaction?.description ?? '')
  const [amount, setAmount] = useState(transaction ? Math.abs(transaction.amount).toFixed(2) : '')
  const [category, setCategory] = useState(transaction?.category ?? '')
  const [date, setDate] = useState(
    transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : '',
  )
  const [type] = useState(transaction?.type ?? '')
  const [editReason, setEditReason] = useState('')

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (showDeleteConfirm) {
        setShowDeleteConfirm(false)
      } else {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, showDeleteConfirm])

  if (!isOpen || !transaction) return null

  const isIncome = type === 'receita'
  const categoryOptions = isIncome ? CATEGORIES.income : CATEGORIES.expense
  const toneText = isIncome ? 'text-[#28D7A1]' : 'text-[#FF5876]'
  const toneSurface = isIncome
    ? 'border-[#28D7A1]/18 bg-[#28D7A1]/10 text-[#28D7A1]'
    : 'border-[#FF5876]/18 bg-[#FF5876]/10 text-[#FF7890]'

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editReason || editReason.trim().length < 5) {
      alert('Por favor, descreva o motivo da edição para manter o histórico auditável.')
      return
    }

    setIsSaving(true)
    const numericAmount = Number.parseFloat(amount)
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      alert('O valor deve ser positivo.')
      setIsSaving(false)
      return
    }

    const updatedTransaction: Transaction = {
      ...transaction,
      description,
      category,
      date,
      amount: isIncome ? numericAmount : -Math.abs(numericAmount),
    }

    await onUpdate(updatedTransaction, editReason)
    setIsSaving(false)
    setIsEditing(false)
  }

  const confirmDelete = async () => {
    setIsSaving(true)
    await onDelete(transaction.id)
    setShowDeleteConfirm(false)
    onClose()
    setIsSaving(false)
  }

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-[3px]"
            onMouseDown={event => {
              if (event.target === event.currentTarget) onClose()
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="transaction-detail-title"
              aria-describedby="transaction-detail-description"
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.18 }}
              className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[16px] border border-white/[0.09] bg-[#0D1118] shadow-2xl shadow-black/40 custom-scrollbar"
            >
              <header className="flex items-start justify-between border-b border-white/[0.075] px-5 py-4 sm:px-6">
                <div className="flex min-w-0 items-start gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] border ${toneSurface}`}>
                    {isIncome ? <ArrowUpRight aria-hidden="true" className="h-5 w-5" /> : <ArrowDownLeft aria-hidden="true" className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0">
                    <h2 id="transaction-detail-title" className="text-lg font-semibold text-[#F4F6F8]">
                      {isEditing ? 'Editar transação' : 'Detalhes da transação'}
                    </h2>
                    <p id="transaction-detail-description" className="mt-1 text-sm text-[#A0A8B5]">
                      {isIncome ? 'Receita' : 'Despesa'} registrada no seu fluxo.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Fechar detalhes da transação"
                  onClick={onClose}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-[#A0A8B5] outline-none transition-colors duration-150 hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-[#665CFF]/50"
                >
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </header>

              <div className="p-5 sm:p-6">
                {isEditing ? (
                  <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="edit-transaction-description" className="block text-xs font-medium text-[#A0A8B5]">Descrição</label>
                      <input id="edit-transaction-description" name="description" type="text" required value={description} onChange={event => setDescription(event.target.value)} className={inputClassName} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label htmlFor="edit-transaction-amount" className="block text-xs font-medium text-[#A0A8B5]">Valor (R$)</label>
                        <input id="edit-transaction-amount" type="number" required step="0.01" value={amount} onChange={event => setAmount(event.target.value)} className={`${inputClassName} tabular-nums`} />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="edit-transaction-date" className="block text-xs font-medium text-[#A0A8B5]">Data</label>
                        <input id="edit-transaction-date" type="date" required value={date} onChange={event => setDate(event.target.value)} className={`${inputClassName} [color-scheme:dark]`} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="edit-transaction-category" className="block text-xs font-medium text-[#A0A8B5]">Categoria</label>
                      <select id="edit-transaction-category" value={category} onChange={event => setCategory(event.target.value)} className={`${inputClassName} cursor-pointer appearance-none [&>option]:bg-[#111722]`}>
                        {categoryOptions.map(option => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5 border-t border-white/[0.075] pt-4">
                      <label htmlFor="edit-transaction-reason" className="flex items-center gap-1.5 text-xs font-medium text-[#F5B942]">
                        <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
                        Motivo da edição (obrigatório)
                      </label>
                      <textarea id="edit-transaction-reason" value={editReason} onChange={event => setEditReason(event.target.value)} placeholder="Ex.: Digitei o valor errado..." rows={3} required className={`${inputClassName} min-h-[84px] resize-none py-3`} />
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-white/[0.075] pt-5 sm:flex-row sm:justify-end">
                      <button type="button" disabled={isSaving} onClick={() => setIsEditing(false)} className="min-h-11 rounded-[10px] border border-white/[0.09] px-4 text-sm font-medium text-[#A0A8B5] transition-colors duration-150 hover:bg-white/[0.05] hover:text-white disabled:opacity-50">Cancelar</button>
                      <button type="submit" disabled={isSaving} className="flex min-h-11 min-w-[132px] items-center justify-center gap-2 rounded-[10px] bg-[#665CFF] px-5 text-sm font-semibold text-white outline-none transition-colors duration-150 hover:bg-[#756CFF] focus-visible:ring-2 focus-visible:ring-[#8B84FF]/60 disabled:opacity-50">
                        <Save aria-hidden="true" className="h-4 w-4" />
                        {isSaving ? 'Salvando...' : 'Salvar alterações'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-5">
                    <div className="border-b border-white/[0.075] pb-5">
                      <p className={`text-[30px] font-bold tracking-[-0.03em] tabular-nums ${toneText}`}>
                        {isIncome ? '+' : '−'} {formatCurrency(Math.abs(transaction.amount))}
                      </p>
                      <p className="mt-1 break-words text-base font-semibold text-[#F4F6F8]">{transaction.description}</p>
                    </div>

                    <dl className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[12px] border border-white/[0.075] bg-[#111722] p-4">
                        <dt className="flex items-center gap-2 text-xs text-[#A0A8B5]"><Tag aria-hidden="true" className="h-4 w-4" />Categoria</dt>
                        <dd className="mt-2 text-sm font-medium text-[#F4F6F8]">{transaction.category}</dd>
                      </div>
                      <div className="rounded-[12px] border border-white/[0.075] bg-[#111722] p-4">
                        <dt className="flex items-center gap-2 text-xs text-[#A0A8B5]"><CheckCircle2 aria-hidden="true" className="h-4 w-4" />Status</dt>
                        <dd className="mt-2 flex items-center gap-2 text-sm font-medium text-[#F4F6F8]">
                          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${transaction.is_paid ? 'bg-[#28D7A1]' : 'bg-[#F5B942]'}`} />
                          {transaction.is_paid ? 'Pago / recebido' : 'Pendente'}
                        </dd>
                      </div>
                      <div className="rounded-[12px] border border-white/[0.075] bg-[#111722] p-4">
                        <dt className="flex items-center gap-2 text-xs text-[#A0A8B5]"><Calendar aria-hidden="true" className="h-4 w-4" />Data</dt>
                        <dd className="mt-2 text-sm font-medium tabular-nums text-[#F4F6F8]">{new Date(transaction.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</dd>
                      </div>
                      <div className="rounded-[12px] border border-white/[0.075] bg-[#111722] p-4">
                        <dt className="flex items-center gap-2 text-xs text-[#A0A8B5]"><Landmark aria-hidden="true" className="h-4 w-4" />Forma / cartão</dt>
                        <dd className="mt-2 truncate text-sm font-medium text-[#F4F6F8]">{transaction.payment_method || 'Conta'}</dd>
                      </div>
                    </dl>

                    {transaction.edit_note ? (
                      <div className="rounded-[12px] border border-white/[0.075] bg-[#111722] p-4">
                        <p className="flex items-center gap-2 text-xs text-[#A0A8B5]"><FileText aria-hidden="true" className="h-4 w-4" />Nota de edição</p>
                        <p className="mt-2 text-sm leading-5 text-[#F4F6F8]">&quot;{transaction.edit_note}&quot;</p>
                      </div>
                    ) : null}

                    <div className="grid grid-cols-2 gap-3 border-t border-white/[0.075] pt-5">
                      <button type="button" onClick={() => setIsEditing(true)} disabled={loading || isSaving} className="flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-white/[0.09] bg-[#111722] text-sm font-medium text-white outline-none transition-colors duration-150 hover:bg-[#151C29] focus-visible:ring-2 focus-visible:ring-[#665CFF]/50 disabled:opacity-50">
                        <Edit aria-hidden="true" className="h-4 w-4" />Editar
                      </button>
                      <button type="button" onClick={() => setShowDeleteConfirm(true)} disabled={loading || isSaving} className="flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-[#FF5876]/18 bg-[#FF5876]/8 text-sm font-medium text-[#FF7890] outline-none transition-colors duration-150 hover:bg-[#FF5876]/14 focus-visible:ring-2 focus-visible:ring-[#FF5876]/50 disabled:opacity-50">
                        <Trash2 aria-hidden="true" className="h-4 w-4" />Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm ? (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-[3px]">
            <motion.div role="alertdialog" aria-modal="true" aria-labelledby="delete-transaction-title" aria-describedby="delete-transaction-description" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.16 }} className="w-full max-w-sm rounded-[16px] border border-[#FF5876]/25 bg-[#0D1118] p-6 shadow-2xl shadow-black/45">
              <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#FF5876]/10 text-[#FF5876]">
                <AlertCircle aria-hidden="true" className="h-5 w-5" />
              </span>
              <h2 id="delete-transaction-title" className="mt-4 text-lg font-semibold text-[#F4F6F8]">Excluir transação?</h2>
              <p id="delete-transaction-description" className="mt-2 text-sm leading-5 text-[#A0A8B5]">
                Você está prestes a excluir <strong className="font-semibold text-white">&quot;{transaction.description}&quot;</strong>. Esta ação não pode ser desfeita.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setShowDeleteConfirm(false)} disabled={isSaving} className="min-h-11 rounded-[10px] border border-white/[0.09] text-sm font-medium text-[#A0A8B5] transition-colors duration-150 hover:bg-white/[0.05] hover:text-white disabled:opacity-50">Cancelar</button>
                <button type="button" onClick={confirmDelete} disabled={isSaving} className="min-h-11 rounded-[10px] bg-[#FF5876] px-4 text-sm font-semibold text-white outline-none transition-colors duration-150 hover:bg-[#FF6B84] focus-visible:ring-2 focus-visible:ring-[#FF5876]/55 disabled:opacity-50">{isSaving ? 'Excluindo...' : 'Excluir'}</button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
