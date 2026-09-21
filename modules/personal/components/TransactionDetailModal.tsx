'use client'

import React, { useState } from 'react'
import { AlertCircle, AlertTriangle, Calendar, CheckCircle2, Edit, FileText, Landmark, Save, Tag, Trash2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Transaction } from '@/core/action/transactions'
import { Modal } from '@/core/ui/Modal'
import { Button } from '@/core/ui/button'
import { Input } from '@/core/ui/input'
import { Textarea } from '@/core/ui/textarea'
import CustomSelect from '@/core/ui/CustomSelect'

const CATEGORIES = {
  income: ['Salário', 'Investimentos', 'Freelance', 'Presente', 'Outros'],
  expense: ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Compras', 'Outros'],
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

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
  const [date, setDate] = useState(transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : '')
  const [type] = useState(transaction?.type ?? '')
  const [editReason, setEditReason] = useState('')

  if (!transaction) return null

  const isIncome = type === 'receita'
  const categoryOptions = isIncome ? CATEGORIES.income : CATEGORIES.expense

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
      <Modal isOpen={isOpen && !showDeleteConfirm} onClose={onClose} title={isEditing ? 'Editar transação' : 'Detalhes da transação'}>
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <label className="space-y-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
              <span>Descrição</span>
              <Input required value={description} onChange={event => setDescription(event.target.value)} />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
                <span>Valor (R$)</span>
                <Input type="number" required step="0.01" value={amount} onChange={event => setAmount(event.target.value)} className="tabular-nums" />
              </label>
              <label className="space-y-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
                <span>Data</span>
                <Input type="date" required value={date} onChange={event => setDate(event.target.value)} />
              </label>
            </div>

            <label className="space-y-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
              <span>Categoria</span>
              <CustomSelect value={category} options={categoryOptions} onChange={setCategory} aria-label="Categoria da transação" />
            </label>

            <label className="block space-y-1.5 border-t border-[var(--color-card-border)] pt-4 text-xs font-medium text-[var(--color-status-warning)]">
              <span className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />Motivo da edição (obrigatório)</span>
              <Textarea value={editReason} onChange={event => setEditReason(event.target.value)} placeholder="Ex.: Digitei o valor errado..." rows={3} required className="min-h-[84px] resize-none" />
            </label>

            <div className="flex flex-col-reverse gap-3 border-t border-[var(--color-card-border)] pt-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" disabled={isSaving} onClick={() => setIsEditing(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSaving} className="gap-2"><Save className="h-4 w-4" aria-hidden="true" />{isSaving ? 'Salvando...' : 'Salvar alterações'}</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="border-b border-[var(--color-card-border)] pb-5">
              <p className={`text-[30px] font-bold tracking-[-0.03em] tabular-nums ${isIncome ? 'text-[var(--color-status-success)]' : 'text-[var(--color-text-primary)]'}`}>
                {isIncome ? '+' : '−'} {formatCurrency(Math.abs(transaction.amount))}
              </p>
              <p className="mt-1 break-words text-base font-semibold">{transaction.description}</p>
              <p className="mt-1 text-xs text-[var(--color-text-helper)]">{isIncome ? 'Receita' : 'Despesa'} registrada no seu fluxo.</p>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <Detail label="Categoria" value={transaction.category} icon={Tag} />
              <Detail label="Status" value={transaction.is_paid ? 'Pago / recebido' : 'Pendente'} icon={CheckCircle2} />
              <Detail label="Data" value={new Date(transaction.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} icon={Calendar} />
              <Detail label="Forma / cartão" value={transaction.payment_method || 'Conta'} icon={Landmark} />
            </dl>

            {transaction.edit_note ? (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-card-border)] bg-[var(--color-action-ghost-hover)] p-4">
                <p className="flex items-center gap-2 text-xs text-[var(--color-text-helper)]"><FileText className="h-4 w-4" aria-hidden="true" />Nota de edição</p>
                <p className="mt-2 text-sm leading-5">&quot;{transaction.edit_note}&quot;</p>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3 border-t border-[var(--color-card-border)] pt-5">
              <Button type="button" variant="secondary" onClick={() => setIsEditing(true)} disabled={loading || isSaving} className="gap-2"><Edit className="h-4 w-4" aria-hidden="true" />Editar</Button>
              <Button type="button" variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={loading || isSaving} className="gap-2"><Trash2 className="h-4 w-4" aria-hidden="true" />Excluir</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Excluir transação?" role="alertdialog">
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-status-danger)] bg-[var(--color-status-danger-surface)] p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-status-danger)]" aria-hidden="true" />
            <p className="text-sm leading-5 text-[var(--color-text-secondary)]">Você está prestes a excluir <strong className="font-semibold text-[var(--color-text-primary)]">&quot;{transaction.description}&quot;</strong>. Esta ação não pode ser desfeita.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={isSaving}>Cancelar</Button>
            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={isSaving}>{isSaving ? 'Excluindo...' : 'Excluir'}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

function Detail({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-card-border)] bg-[var(--color-action-ghost-hover)] p-4">
      <dt className="flex items-center gap-2 text-xs text-[var(--color-text-helper)]"><Icon aria-hidden="true" className="h-4 w-4" />{label}</dt>
      <dd className="mt-2 truncate text-sm font-medium text-[var(--color-text-primary)]">{value}</dd>
    </div>
  )
}
