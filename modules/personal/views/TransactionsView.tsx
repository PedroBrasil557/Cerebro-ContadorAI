'use client'

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Landmark,
  Loader2,
  Lock,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  type Transaction,
  updateTransaction,
} from '@/core/action/transactions'
import { calculateBalance, calculateExpenses, calculateIncome } from '@/core/finance/transactionMath'
import UpgradeModal from '@/core/components/UpgradeModal'
import FixedExpensesList from '@/modules/personal/components/FixedExpensesList'
import TransactionDetailModal from '@/modules/personal/components/TransactionDetailModal'
import { financeService } from '@/services/financeService'
import type { CreditCard as CreditCardRecord } from '@/types_db'
import type { User } from '@supabase/supabase-js'
import { toast } from 'sonner'

interface TransactionsViewProps {
  user: User
}

interface FilterOption<T extends string> {
  id: T
  label: string
}

interface CustomFilterProps<T extends string> {
  label: string
  value: T
  options: FilterOption<T>[]
  onChange: (value: T) => void
  isPro?: boolean
  onProClick?: () => void
}

interface CustomSelectProps {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  name: string
}

interface SummaryCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  tone: 'balance' | 'income' | 'expense'
  isNegative?: boolean
}

const CATEGORIES = {
  income: ['Salário', 'Investimentos', 'Freelance', 'Presente', 'Outros'],
  expense: ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Compras', 'Outros'],
}

const fieldClassName =
  'min-h-11 w-full rounded-[11px] border border-white/[0.09] bg-[#111722] px-3.5 text-sm text-[#F4F6F8] outline-none transition-colors duration-150 placeholder:text-[#6F7887] hover:border-white/[0.14] focus:border-[#665CFF]/60 focus:ring-2 focus:ring-[#665CFF]/15 disabled:cursor-not-allowed disabled:opacity-60'

function CustomFilter<T extends string>({
  label,
  value,
  options,
  onChange,
  isPro = false,
  onProClick,
}: CustomFilterProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const activeOption = options.find(option => option.id === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false)
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleButtonClick = () => {
    if (isPro) {
      onProClick?.()
      return
    }
    setIsOpen(open => !open)
  }

  return (
    <div className="relative min-w-0" ref={containerRef}>
      <span className="mb-1.5 block text-xs font-medium text-[#A0A8B5]">{label}</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${label}: ${isPro ? 'recurso PRO' : activeOption?.label || label}`}
        onClick={handleButtonClick}
        className="flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-[11px] border border-white/[0.09] bg-[#111722] px-3.5 text-sm font-medium text-[#F4F6F8] outline-none transition-colors duration-150 hover:border-white/[0.15] hover:bg-[#151C29] focus-visible:ring-2 focus-visible:ring-[#665CFF]/50"
      >
        <span className="truncate">{isPro ? `${label} (PRO)` : activeOption?.label || label}</span>
        {isPro ? (
          <Lock aria-hidden="true" className="h-4 w-4 shrink-0 text-[#8B84FF]" />
        ) : (
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 text-[#A0A8B5] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      <AnimatePresence>
        {isOpen && !isPro ? (
          <motion.div
            id={menuId}
            role="listbox"
            aria-label={label}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 mt-2 w-full min-w-[168px] overflow-hidden rounded-[12px] border border-white/[0.1] bg-[#111722] p-1 shadow-xl shadow-black/30"
          >
            {options.map(option => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={value === option.id}
                onClick={() => {
                  onChange(option.id)
                  setIsOpen(false)
                }}
                className={`min-h-10 w-full rounded-[9px] px-3 text-left text-sm outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#665CFF]/50 ${value === option.id ? 'bg-[#665CFF]/12 text-white' : 'text-[#A0A8B5] hover:bg-white/[0.05] hover:text-white'}`}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function CustomSelect({ label, value, options, onChange, name }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false)
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      <label className="block text-xs font-medium text-[#A0A8B5]">{label}</label>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${label}: ${value || 'Selecione'}`}
        onClick={() => setIsOpen(open => !open)}
        className={`${fieldClassName} flex items-center justify-between gap-3 text-left`}
      >
        <span className="truncate">{value || 'Selecione...'}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-[#A0A8B5] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <input type="hidden" name={name} value={value} />

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            id={menuId}
            role="listbox"
            aria-label={label}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[70] mt-2 max-h-48 w-full overflow-y-auto rounded-[12px] border border-white/[0.1] bg-[#111722] p-1 shadow-xl shadow-black/30 custom-scrollbar"
          >
            {options.map(option => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={value === option}
                onClick={() => {
                  onChange(option)
                  setIsOpen(false)
                }}
                className={`min-h-10 w-full rounded-[9px] px-3 text-left text-sm outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#665CFF]/50 ${value === option ? 'bg-[#665CFF]/12 text-white' : 'text-[#A0A8B5] hover:bg-white/[0.05] hover:text-white'}`}
              >
                {option}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, tone, isNegative = false }: SummaryCardProps) {
  const palette = {
    balance: {
      icon: 'bg-[#4F8CFF]/12 text-[#69A0FF]',
      border: 'border-[#4F8CFF]/20',
      value: isNegative ? 'text-[#FF5876]' : 'text-[#F4F6F8]',
    },
    income: {
      icon: 'bg-[#28D7A1]/10 text-[#28D7A1]',
      border: 'border-[#28D7A1]/18',
      value: 'text-[#28D7A1]',
    },
    expense: {
      icon: 'bg-[#FF5876]/10 text-[#FF5876]',
      border: 'border-[#FF5876]/18',
      value: 'text-[#FF5876]',
    },
  }[tone]

  return (
    <article className={`flex h-[108px] items-center gap-4 rounded-[16px] border bg-[#0D1118] p-5 ${palette.border}`}>
      <span aria-hidden="true" className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] ${palette.icon}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-[#A0A8B5]">{label}</p>
        <p className={`mt-1 truncate text-[24px] font-bold tracking-[-0.02em] tabular-nums ${palette.value}`}>{value}</p>
      </div>
    </article>
  )
}

function NewTransactionModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<'receita' | 'despesa_variavel'>('despesa_variavel')
  const [category, setCategory] = useState('Alimentação')
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro / Pix')
  const [userCards, setUserCards] = useState<CreditCardRecord[]>([])

  useEffect(() => {
    async function fetchCards() {
      const databaseCards = await financeService.getCards()
      setUserCards(databaseCards || [])
    }
    if (isOpen) void fetchCards()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const paymentOptions = useMemo(
    () => ['Dinheiro / Pix', ...userCards.map(card => card.name)],
    [userCards],
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const formData = new FormData(event.currentTarget)
    formData.set('type', type)
    const isFixed = (event.currentTarget.elements.namedItem('is_fixed') as HTMLInputElement).checked
    formData.set('is_fixed', isFixed ? 'true' : 'false')

    const result = await createTransaction(formData)
    setLoading(false)
    if (result.success) {
      toast.success('Sincronizado!')
      onSuccess()
      onClose()
    } else {
      toast.error(`Falha: ${result.error}`)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-[3px]"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-transaction-title"
        aria-describedby="new-transaction-description"
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.18 }}
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[16px] border border-white/[0.09] bg-[#0D1118] shadow-2xl shadow-black/40 custom-scrollbar"
      >
        <header className="flex items-start justify-between border-b border-white/[0.075] px-5 py-4 sm:px-6">
          <div>
            <h2 id="new-transaction-title" className="text-lg font-semibold text-[#F4F6F8]">Nova transação</h2>
            <p id="new-transaction-description" className="mt-1 text-sm text-[#A0A8B5]">
              Registre uma receita ou despesa no seu fluxo.
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar nova transação"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-[#A0A8B5] outline-none transition-colors duration-150 hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-[#665CFF]/50"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-[#A0A8B5]">Tipo da transação</legend>
            <div className="grid grid-cols-2 rounded-[12px] border border-white/[0.075] bg-[#080B11] p-1">
              <button
                type="button"
                aria-pressed={type !== 'receita'}
                onClick={() => {
                  setType('despesa_variavel')
                  setCategory('Alimentação')
                }}
                className={`flex min-h-10 items-center justify-center gap-2 rounded-[9px] text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#FF5876]/50 ${type !== 'receita' ? 'bg-[#FF5876]/12 text-[#FF7890]' : 'text-[#A0A8B5] hover:text-white'}`}
              >
                <ArrowDownLeft aria-hidden="true" className="h-4 w-4" />
                Despesa
              </button>
              <button
                type="button"
                aria-pressed={type === 'receita'}
                onClick={() => {
                  setType('receita')
                  setCategory('Salário')
                }}
                className={`flex min-h-10 items-center justify-center gap-2 rounded-[9px] text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#28D7A1]/50 ${type === 'receita' ? 'bg-[#28D7A1]/10 text-[#28D7A1]' : 'text-[#A0A8B5] hover:text-white'}`}
              >
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                Receita
              </button>
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="new-transaction-amount" className="block text-xs font-medium text-[#A0A8B5]">Valor</label>
              <input id="new-transaction-amount" name="amount" required type="number" step="0.01" placeholder="0,00" className={`${fieldClassName} text-base font-semibold tabular-nums`} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="new-transaction-description-field" className="block text-xs font-medium text-[#A0A8B5]">Descrição</label>
              <input id="new-transaction-description-field" name="description" required type="text" placeholder="Ex.: Aluguel" className={fieldClassName} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CustomSelect label="Categoria" value={category} options={CATEGORIES[type === 'receita' ? 'income' : 'expense']} onChange={setCategory} name="category" />
            <CustomSelect label="Forma / Cartão" value={paymentMethod} options={paymentOptions} onChange={setPaymentMethod} name="payment_method" />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="new-transaction-date" className="block text-xs font-medium text-[#A0A8B5]">Data</label>
            <input id="new-transaction-date" name="date" required type="date" defaultValue={new Date().toISOString().split('T')[0]} className={`${fieldClassName} [color-scheme:dark]`} />
          </div>

          <label htmlFor="is_fixed" className="flex min-h-14 cursor-pointer items-center gap-3 rounded-[12px] border border-white/[0.075] bg-[#080B11] px-4 transition-colors duration-150 hover:border-white/[0.13]">
            <input id="is_fixed" name="is_fixed" type="checkbox" className="peer sr-only" />
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/[0.18] text-transparent transition-colors peer-checked:border-[#665CFF] peer-checked:bg-[#665CFF] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#665CFF]/50">
              <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm font-medium text-[#A0A8B5]">Adicionar ao cronograma mensal</span>
          </label>

          <div className="flex justify-end gap-3 border-t border-white/[0.075] pt-5">
            <button type="button" onClick={onClose} disabled={loading} className="min-h-11 rounded-[10px] border border-white/[0.09] px-4 text-sm font-medium text-[#A0A8B5] transition-colors duration-150 hover:bg-white/[0.05] hover:text-white disabled:opacity-50">
              Cancelar
            </button>
            <button disabled={loading} type="submit" className="flex min-h-11 min-w-[154px] items-center justify-center gap-2 rounded-[10px] bg-[#665CFF] px-5 text-sm font-semibold text-white outline-none transition-colors duration-150 hover:bg-[#756CFF] focus-visible:ring-2 focus-visible:ring-[#8B84FF]/60 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <CheckCircle2 aria-hidden="true" className="h-4 w-4" />}
              {loading ? 'Salvando...' : 'Salvar transação'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function TransactionsView({ user }: TransactionsViewProps) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pago' | 'pendente'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [loadingAction, setLoadingAction] = useState(false)

  const userPlan = user?.user_metadata?.plan_tier || 'free'
  const isFreePlan = userPlan !== 'pro' && userPlan !== 'premium'
  const currentMonthLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const currentMonthStr = currentDate.toISOString().slice(0, 7)

  const loadData = async () => {
    const data = await getTransactions()
    setTransactions(data)
    setLoadingData(false)
  }

  useEffect(() => {
    void loadData()
  }, [])

  const monthTransactions = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : []
    return safeTransactions.filter(transaction => transaction.date.startsWith(currentMonthStr))
  }, [transactions, currentMonthStr])

  const filteredData = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('pt-BR')
    return monthTransactions.filter(transaction => {
      const matchesType =
        filterType === 'all'
          ? true
          : filterType === 'receita'
            ? transaction.type === 'receita'
            : transaction.type !== 'receita'
      const matchesStatus =
        filterStatus === 'all' ? true : filterStatus === 'pago' ? transaction.is_paid : !transaction.is_paid
      const matchesSearch =
        normalizedSearch === '' ||
        transaction.description.toLocaleLowerCase('pt-BR').includes(normalizedSearch) ||
        transaction.category.toLocaleLowerCase('pt-BR').includes(normalizedSearch)
      return matchesType && matchesStatus && matchesSearch
    })
  }, [monthTransactions, filterType, filterStatus, searchTerm])

  const totals = useMemo(
    () => ({
      income: calculateIncome(monthTransactions),
      expense: calculateExpenses(monthTransactions),
      balance: calculateBalance(monthTransactions),
    }),
    [monthTransactions],
  )

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const handleSuccessAction = async () => {
    await loadData()
    router.refresh()
  }

  const handlePrevMonth = () =>
    setCurrentDate(date => new Date(date.getFullYear(), date.getMonth() - 1, 1))

  const handleNextMonth = () =>
    setCurrentDate(date => new Date(date.getFullYear(), date.getMonth() + 1, 1))

  const generatePDF = async () => {
    if (isFreePlan) {
      setShowUpgradeModal(true)
      return
    }
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ])
    const doc = new jsPDF()
    doc.setFillColor(10, 10, 15)
    doc.rect(0, 0, 210, 45, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.text('CÉREBRO.OS', 15, 25)
    doc.setFillColor(30, 30, 40)
    doc.roundedRect(140, 10, 55, 25, 3, 3, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.text(formatCurrency(totals.balance), 145, 28)
    const rows = filteredData.map(transaction => [
      new Date(transaction.date).toLocaleDateString('pt-BR'),
      transaction.description.toUpperCase(),
      transaction.category,
      transaction.payment_method || 'CONTA',
      transaction.is_paid ? 'OK' : 'PEND',
      formatCurrency(transaction.amount),
    ])
    autoTable(doc, {
      head: [['DATA', 'DESCRIÇÃO', 'CATEGORIA', 'CONTA', 'STATUS', 'VALOR']],
      body: rows,
      startY: 55,
      headStyles: { fillColor: [79, 70, 229] },
    })
    doc.save(`Extrato_${currentMonthStr}.pdf`)
  }

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsEditModalOpen(true)
  }

  const handleUpdate = async (transaction: Transaction, reason: string) => {
    setLoadingAction(true)
    await updateTransaction(transaction, reason)
    await handleSuccessAction()
    setLoadingAction(false)
    setIsEditModalOpen(false)
  }

  const handleDelete = async (id: string) => {
    setLoadingAction(true)
    await deleteTransaction(id)
    await handleSuccessAction()
    setLoadingAction(false)
    setIsEditModalOpen(false)
  }

  if (loadingData) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#07090D] text-[#A0A8B5]">
        <Loader2 aria-label="Carregando transações" className="h-7 w-7 animate-spin text-[#4F8CFF]" />
      </div>
    )
  }

  const hasActiveFilters = searchTerm.trim() !== '' || filterType !== 'all' || filterStatus !== 'all'

  return (
    <div className="-m-4 min-h-[calc(100vh-6rem)] bg-[#07090D] p-4 pb-32 text-[#F4F6F8] md:-m-8 md:p-8 md:pb-32">
      <div className="mx-auto w-full max-w-[1480px] space-y-4">
        <header className="flex min-h-[68px] flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-[26px] font-bold tracking-[-0.03em] text-white">Transações</h1>
            <p className="mt-1 text-sm text-[#A0A8B5]">Acompanhe, filtre e organize seu fluxo financeiro.</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-[auto_auto_1fr] xl:flex xl:items-center">
            <div className="flex min-h-11 items-center overflow-hidden rounded-[11px] border border-white/[0.09] bg-[#0D1118] sm:col-span-1">
              <button type="button" aria-label="Mês anterior" onClick={handlePrevMonth} className="flex h-11 w-11 items-center justify-center text-[#A0A8B5] outline-none transition-colors duration-150 hover:bg-white/[0.05] hover:text-white focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#665CFF]/50">
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              </button>
              <span className="min-w-[150px] border-x border-white/[0.075] px-3 text-center text-sm font-medium capitalize text-[#F4F6F8] sm:min-w-[176px]">{currentMonthLabel}</span>
              <button type="button" aria-label="Próximo mês" onClick={handleNextMonth} className="flex h-11 w-11 items-center justify-center text-[#A0A8B5] outline-none transition-colors duration-150 hover:bg-white/[0.05] hover:text-white focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#665CFF]/50">
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <button type="button" onClick={generatePDF} className="flex min-h-11 items-center justify-center gap-2 rounded-[11px] border border-white/[0.1] bg-[#111722] px-4 text-sm font-medium text-[#F4F6F8] outline-none transition-colors duration-150 hover:border-white/[0.16] hover:bg-[#151C29] focus-visible:ring-2 focus-visible:ring-[#665CFF]/50">
              {isFreePlan ? <Lock aria-hidden="true" className="h-4 w-4 text-[#8B84FF]" /> : <Download aria-hidden="true" className="h-4 w-4" />}
              {isFreePlan ? 'Relatório PRO' : 'Exportar PDF'}
            </button>
            <button type="button" onClick={() => setIsCreateModalOpen(true)} className="flex min-h-11 items-center justify-center gap-2 rounded-[11px] bg-[#665CFF] px-5 text-sm font-semibold text-white outline-none transition-colors duration-150 hover:bg-[#756CFF] focus-visible:ring-2 focus-visible:ring-[#8B84FF]/60">
              <Plus aria-hidden="true" className="h-4 w-4" />
              Nova transação
            </button>
          </div>
        </header>

        <section aria-label="Resumo financeiro" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 [&>article:last-child]:sm:col-span-2 [&>article:last-child]:xl:col-span-1">
          <SummaryCard icon={Wallet} label="Saldo projetado" value={formatCurrency(totals.balance)} tone="balance" isNegative={totals.balance < 0} />
          <SummaryCard icon={TrendingUp} label="Entradas" value={formatCurrency(totals.income)} tone="income" />
          <SummaryCard icon={TrendingDown} label="Saídas" value={formatCurrency(Math.abs(totals.expense))} tone="expense" />
        </section>

        <FixedExpensesList transactions={transactions} currentDate={currentDate} />

        <section aria-label="Filtros de transações" className="grid gap-3 rounded-[16px] border border-white/[0.075] bg-[#0D1118] p-3 md:grid-cols-2 lg:grid-cols-[minmax(280px,1fr)_180px_180px] lg:items-end">
          <div className="relative md:col-span-2 lg:col-span-1">
            <label htmlFor="transaction-search" className="mb-1.5 block text-xs font-medium text-[#A0A8B5]">Buscar</label>
            <Search aria-hidden="true" className="absolute bottom-3.5 left-3.5 h-4 w-4 text-[#A0A8B5]" />
            <input id="transaction-search" type="search" placeholder="Buscar por descrição ou categoria" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} className={`${fieldClassName} pl-10`} />
          </div>
          <CustomFilter label="Tipo" value={filterType} options={[{ id: 'all', label: 'Todas' }, { id: 'receita', label: 'Receitas' }, { id: 'despesa', label: 'Despesas' }]} onChange={setFilterType} />
          <CustomFilter label="Status" value={filterStatus} isPro={isFreePlan} onProClick={() => setShowUpgradeModal(true)} options={[{ id: 'all', label: 'Todos' }, { id: 'pago', label: 'Pagos' }, { id: 'pendente', label: 'Pendentes' }]} onChange={setFilterStatus} />
        </section>

        <section aria-labelledby="transactions-list-title" className="overflow-hidden rounded-[16px] border border-white/[0.075] bg-[#0D1118]">
          <header className="flex min-h-16 items-center justify-between gap-4 border-b border-white/[0.075] px-4 sm:px-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#665CFF]/10 text-[#8B84FF]">
                <CalendarDays aria-hidden="true" className="h-[18px] w-[18px]" />
              </span>
              <div>
                <h2 id="transactions-list-title" className="text-base font-semibold">Movimentações do mês</h2>
                <p className="mt-0.5 text-xs text-[#A0A8B5]">{filteredData.length} {filteredData.length === 1 ? 'transação' : 'transações'}</p>
              </div>
            </div>
          </header>

          {filteredData.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center px-5 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-white/[0.04] text-[#A0A8B5]">
                <CalendarDays aria-hidden="true" className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-[#F4F6F8]">
                {monthTransactions.length === 0 ? 'Sem transações neste mês' : 'Nenhuma transação encontrada'}
              </h3>
              <p className="mt-1 max-w-sm text-sm text-[#A0A8B5]">
                {monthTransactions.length === 0
                  ? 'Adicione uma nova transação para começar a acompanhar seu fluxo.'
                  : 'Tente ajustar os filtros.'}
              </p>
              {monthTransactions.length === 0 ? (
                <button type="button" onClick={() => setIsCreateModalOpen(true)} className="mt-5 min-h-10 rounded-[10px] border border-white/[0.1] bg-[#111722] px-4 text-sm font-medium transition-colors duration-150 hover:bg-[#151C29]">
                  Nova transação
                </button>
              ) : null}
              {hasActiveFilters ? <span className="sr-only">Existem filtros ativos.</span> : null}
            </div>
          ) : (
            <>
              <div aria-hidden="true" className="hidden min-h-11 grid-cols-[minmax(180px,1.45fr)_minmax(120px,0.9fr)_minmax(140px,1fr)_110px_105px_minmax(120px,0.8fr)] items-center gap-4 border-b border-white/[0.06] bg-[#080B11]/55 px-5 text-[11px] font-medium text-[#A0A8B5] xl:grid">
                <span>Descrição</span><span>Categoria</span><span>Conta / forma</span><span>Data</span><span>Status</span><span className="text-right">Valor</span>
              </div>
              <div className="divide-y divide-white/[0.06]">
                {filteredData.map(transaction => {
                  const isIncome = transaction.type === 'receita'
                  const formattedDate = new Date(transaction.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                  return (
                    <button
                      key={transaction.id}
                      type="button"
                      onClick={() => handleTransactionClick(transaction)}
                      aria-label={`Abrir detalhes de ${transaction.description}, ${formatCurrency(Math.abs(Number(transaction.amount)))}`}
                      className="group block min-h-[84px] w-full px-4 py-4 text-left outline-none transition-colors duration-150 hover:bg-white/[0.025] focus-visible:bg-[#665CFF]/[0.06] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#665CFF]/45 xl:grid xl:min-h-[64px] xl:grid-cols-[minmax(180px,1.45fr)_minmax(120px,0.9fr)_minmax(140px,1fr)_110px_105px_minmax(120px,0.8fr)] xl:items-center xl:gap-4 xl:px-5 xl:py-0"
                    >
                      <span className="flex min-w-0 items-center justify-between gap-3 overflow-hidden xl:block">
                        <span className="min-w-0 truncate text-sm font-semibold text-[#F4F6F8]">{transaction.description}</span>
                        <span className={`shrink-0 text-sm font-semibold tabular-nums xl:hidden ${isIncome ? 'text-[#28D7A1]' : 'text-[#FF5876]'}`}>
                          {isIncome ? '+' : '−'} {formatCurrency(Math.abs(Number(transaction.amount)))}
                        </span>
                      </span>
                      <span className="mt-1 block min-w-0 truncate text-xs text-[#A0A8B5] xl:mt-0 xl:text-sm">{transaction.category}</span>
                      <span className="mt-2 flex min-w-0 items-center gap-1.5 truncate text-xs text-[#A0A8B5] xl:mt-0 xl:text-sm">
                        <Landmark aria-hidden="true" className="h-3.5 w-3.5 shrink-0 xl:hidden" />
                        {transaction.payment_method || 'Conta'}
                      </span>
                      <span className="mt-1 block text-xs tabular-nums text-[#A0A8B5] xl:mt-0 xl:text-sm">{formattedDate}</span>
                      <span className={`mt-2 inline-flex min-h-6 w-fit items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium xl:mt-0 ${transaction.is_paid ? 'border-[#28D7A1]/20 bg-[#28D7A1]/8 text-[#28D7A1]' : 'border-[#F5B942]/20 bg-[#F5B942]/8 text-[#F5B942]'}`}>
                        <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${transaction.is_paid ? 'bg-[#28D7A1]' : 'bg-[#F5B942]'}`} />
                        {transaction.is_paid ? 'Pago' : 'Pendente'}
                      </span>
                      <span className={`hidden text-right text-sm font-semibold tabular-nums xl:block ${isIncome ? 'text-[#28D7A1]' : 'text-[#FF5876]'}`}>
                        {isIncome ? '+' : '−'} {formatCurrency(Math.abs(Number(transaction.amount)))}
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </section>
      </div>

      <AnimatePresence>
        {isCreateModalOpen ? (
          <NewTransactionModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={handleSuccessAction} />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {isEditModalOpen && selectedTransaction ? (
          <TransactionDetailModal key={selectedTransaction.id} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} transaction={selectedTransaction} onUpdate={handleUpdate} onDelete={handleDelete} loading={loadingAction} />
        ) : null}
      </AnimatePresence>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  )
}
