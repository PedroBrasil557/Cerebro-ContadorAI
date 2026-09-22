'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, Download, Filter, Loader2, Lock, Plus, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  type Transaction,
  updateTransaction,
} from '@/core/action/transactions'
import {
  buildTransactionPeriodContext,
  matchesTransactionSearch,
  matchesTransactionType,
  type TransactionTypeFilter,
} from '@/core/finance/transactionInsights'
import { isRealizedTransaction } from '@/core/finance/transactionMath'
import UpgradeModal from '@/core/components/UpgradeModal'
import FixedExpensesList from '@/modules/personal/components/FixedExpensesList'
import TransactionContextRail from '@/modules/personal/components/TransactionContextRail'
import TransactionDetailModal from '@/modules/personal/components/TransactionDetailModal'
import { financeService } from '@/services/financeService'
import type { CreditCard as CreditCardRecord } from '@/types_db'
import { toast } from 'sonner'
import { useEntitlements } from '@/core/hooks/useEntitlements'
import { TransactionRow } from '@/core/finance-ui/TransactionRow'
import { Button } from '@/core/ui/button'
import { Input } from '@/core/ui/input'
import { Modal } from '@/core/ui/Modal'
import CustomSelect from '@/core/ui/CustomSelect'

const CATEGORIES = {
  income: ['Salário', 'Investimentos', 'Freelance', 'Presente', 'Outros'],
  expense: ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Compras', 'Outros'],
}

const PAGE_SIZE = 10

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

  const paymentOptions = useMemo(() => ['Dinheiro / Pix', ...userCards.map((card) => card.name)], [userCards])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const formData = new FormData(event.currentTarget)
    formData.set('type', type)
    formData.set('category', category)
    formData.set('payment_method', paymentMethod)
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova transação">
      <p className="-mt-3 mb-5 text-sm text-[var(--color-text-secondary)]">Registre uma receita ou despesa no seu fluxo.</p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <fieldset>
          <legend className="mb-2 text-xs font-medium text-[var(--color-text-secondary)]">Tipo da transação</legend>
          <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-md)] bg-[var(--color-action-ghost-hover)] p-1">
            <Button type="button" variant={type === 'despesa_variavel' ? 'secondary' : 'ghost'} aria-pressed={type === 'despesa_variavel'} onClick={() => { setType('despesa_variavel'); setCategory('Alimentação') }}>Despesa</Button>
            <Button type="button" variant={type === 'receita' ? 'secondary' : 'ghost'} aria-pressed={type === 'receita'} onClick={() => { setType('receita'); setCategory('Salário') }}>Receita</Button>
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-xs font-medium text-[var(--color-text-secondary)]"><span>Valor</span><Input name="amount" required type="number" step="0.01" placeholder="0,00" className="text-base font-semibold tabular-nums" /></label>
          <label className="space-y-1.5 text-xs font-medium text-[var(--color-text-secondary)]"><span>Descrição</span><Input name="description" required type="text" placeholder="Ex.: Aluguel" /></label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-xs font-medium text-[var(--color-text-secondary)]"><span>Categoria</span><CustomSelect value={category} options={CATEGORIES[type === 'receita' ? 'income' : 'expense']} onChange={setCategory} name="category" aria-label="Categoria" /></label>
          <label className="space-y-1.5 text-xs font-medium text-[var(--color-text-secondary)]"><span>Forma / Cartão</span><CustomSelect value={paymentMethod} options={paymentOptions} onChange={setPaymentMethod} name="payment_method" aria-label="Forma ou cartão" /></label>
        </div>

        <label className="space-y-1.5 text-xs font-medium text-[var(--color-text-secondary)]"><span>Data</span><Input name="date" required type="date" defaultValue={new Date().toISOString().split('T')[0]} /></label>
        <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-card-border)] bg-[var(--color-action-ghost-hover)] px-4"><input id="is_fixed" name="is_fixed" type="checkbox" className="h-4 w-4 accent-[var(--color-action-primary)]" /><span className="text-sm font-medium text-[var(--color-text-secondary)]">Adicionar ao cronograma mensal</span></label>

        <div className="flex justify-end gap-3 border-t border-[var(--color-card-border)] pt-5">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button disabled={loading} type="submit" className="min-w-[154px] gap-2">{loading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <CheckCircle2 aria-hidden="true" className="h-4 w-4" />}{loading ? 'Salvando...' : 'Salvar transação'}</Button>
        </div>
      </form>
    </Modal>
  )
}

function groupLabel(dateValue: string) {
  const date = new Date(`${dateValue.slice(0, 10)}T12:00:00`)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  if (sameDay(date, today)) return 'Hoje'
  if (sameDay(date, yesterday)) return 'Ontem'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
}

const typeOptions: Array<{ label: string; value: TransactionTypeFilter }> = [
  { label: 'Todas', value: 'all' },
  { label: 'Entradas', value: 'receita' },
  { label: 'Saídas', value: 'despesa' },
  { label: 'Transferências', value: 'transferencia' },
]

export default function TransactionsView() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [filterType, setFilterType] = useState<TransactionTypeFilter>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pago' | 'pendente'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [loadingAction, setLoadingAction] = useState(false)
  const [page, setPage] = useState(1)

  const { plan: userPlan } = useEntitlements()
  const isFreePlan = userPlan !== 'pro' && userPlan !== 'premium'
  const currentMonthLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

  const loadData = async () => {
    const data = await getTransactions()
    setTransactions(data)
    setLoadingData(false)
  }

  useEffect(() => { void loadData() }, [])

  const monthTransactions = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : []
    return safeTransactions.filter((transaction) => transaction.date.startsWith(currentMonthStr))
  }, [transactions, currentMonthStr])

  const periodContext = useMemo(() => buildTransactionPeriodContext(transactions, currentDate), [transactions, currentDate])

  const filteredData = useMemo(() => monthTransactions.filter((transaction) => {
    const matchesStatus = filterStatus === 'all' ? true : filterStatus === 'pago' ? transaction.is_paid : !transaction.is_paid
    return matchesTransactionType(transaction, filterType) && matchesStatus && matchesTransactionSearch(transaction, searchTerm)
  }), [monthTransactions, filterType, filterStatus, searchTerm])

  useEffect(() => setPage(1), [currentMonthStr, filterType, filterStatus, searchTerm])

  const realizedCount = monthTransactions.filter(isRealizedTransaction).length
  const pendingCount = monthTransactions.length - realizedCount
  const transferCount = monthTransactions.filter((transaction) => transaction.type === 'transferencia').length
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const handleSuccessAction = async () => { await loadData(); router.refresh() }
  const handlePrevMonth = () => setCurrentDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))
  const handleNextMonth = () => setCurrentDate((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))

  const generatePDF = async () => {
    if (isFreePlan) { setShowUpgradeModal(true); return }
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
    const doc = new jsPDF()
    doc.setFillColor(10, 10, 15); doc.rect(0, 0, 210, 45, 'F'); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(24); doc.text('CÉREBRO.OS', 15, 25)
    doc.setFillColor(30, 30, 40); doc.roundedRect(140, 10, 55, 25, 3, 3, 'F'); doc.setFontSize(14); doc.text(formatCurrency(periodContext.current.balance), 145, 28)
    const rows = filteredData.map((transaction) => [new Date(transaction.date).toLocaleDateString('pt-BR'), transaction.description.toUpperCase(), transaction.category, transaction.payment_method || 'CONTA', transaction.is_paid ? 'OK' : 'PEND', formatCurrency(Number(transaction.amount || 0))])
    autoTable(doc, { head: [['DATA', 'DESCRIÇÃO', 'CATEGORIA', 'CONTA', 'STATUS', 'VALOR']], body: rows, startY: 55, headStyles: { fillColor: [79, 70, 229] } })
    doc.save(`Extrato_${currentMonthStr}.pdf`)
  }

  const handleUpdate = async (transaction: Transaction, reason: string) => { setLoadingAction(true); await updateTransaction(transaction, reason); await handleSuccessAction(); setLoadingAction(false); setIsEditModalOpen(false) }
  const handleDelete = async (id: string) => { setLoadingAction(true); await deleteTransaction(id); await handleSuccessAction(); setLoadingAction(false); setIsEditModalOpen(false) }

  if (loadingData) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 aria-label="Carregando transações" className="h-7 w-7 animate-spin text-[var(--color-action-primary)]" /></div>

  const statusLabel = filterStatus === 'all' ? 'Todos os status' : filterStatus === 'pago' ? 'Pagos' : 'Pendentes'
  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageData = filteredData.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const groups = pageData.reduce<Array<{ label: string; items: Transaction[] }>>((acc, transaction) => {
    const label = groupLabel(transaction.date)
    const last = acc[acc.length - 1]
    if (last?.label === label) last.items.push(transaction)
    else acc.push({ label, items: [transaction] })
    return acc
  }, [])

  return (
    <div className="min-h-full bg-[var(--color-bg-canvas)] pb-24 text-[var(--color-text-primary)] md:pb-8">
      <div className="mx-auto w-full max-w-[1148px] space-y-4 px-4 py-5 sm:px-6 xl:px-0 xl:py-7">
        <header className="flex min-h-[86px] flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-action-primary)]">Transações</p>
            <h1 className="mt-2 text-[28px] font-bold leading-9 tracking-[-0.04em] md:text-[30px]">Entenda cada movimento sem perder o contexto.</h1>
            <p className="mt-1 text-[13px] capitalize text-[var(--color-text-secondary)]">{currentMonthLabel} · entradas, saídas e transferências em um só lugar.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-[42px] items-center rounded-[13px] border border-[var(--color-card-border)] bg-[var(--color-card-fill)]">
              <Button variant="ghost" size="icon-sm" aria-label="Mês anterior" onClick={handlePrevMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="min-w-[132px] px-2 text-center text-xs font-medium capitalize">{currentMonthLabel}</span>
              <Button variant="ghost" size="icon-sm" aria-label="Próximo mês" onClick={handleNextMonth}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)} className="h-[46px] gap-2 px-5"><Plus className="h-4 w-4" aria-hidden="true" />Nova transação</Button>
          </div>
        </header>

        <section aria-label="Resumo financeiro realizado" className="grid overflow-hidden rounded-[18px] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] md:grid-cols-3 md:shadow-[0_3px_10px_rgba(5,6,10,0.05)]">
          {[
            { label: 'Entradas', value: periodContext.current.income, previous: periodContext.previous.income, tone: 'text-[var(--color-status-success)]' },
            { label: 'Saídas', value: periodContext.current.expense, previous: periodContext.previous.expense, tone: 'text-[var(--color-status-danger)]' },
            { label: 'Saldo líquido', value: periodContext.current.balance, previous: periodContext.previous.balance, tone: periodContext.current.balance >= 0 ? 'text-[var(--color-status-success)]' : 'text-[var(--color-status-danger)]' },
          ].map((item, index) => (
            <div key={item.label} className={`min-h-[118px] px-5 py-5 ${index ? 'border-t border-[var(--color-card-border)] md:border-l md:border-t-0' : ''}`}>
              <p className="text-[11px] text-[var(--color-text-helper)]">{item.label}</p>
              <p className={`mt-2 text-[25px] font-semibold tracking-[-0.03em] ${item.tone}`}>{formatCurrency(item.value)}</p>
              <p className="mt-2 text-[10px] text-[var(--color-text-helper)]">Mês anterior: {formatCurrency(item.previous)}</p>
            </div>
          ))}
        </section>

        <section aria-labelledby="transaction-filters-title" className="rounded-[18px] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-4 md:p-[18px]">
          <h2 id="transaction-filters-title" className="sr-only">Buscar e filtrar</h2>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative lg:w-[430px] lg:shrink-0">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-helper)]" />
              <Input id="transaction-search" type="search" aria-label="Buscar transações" placeholder="Buscar por nome, categoria, forma ou valor" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="h-11 rounded-[13px] pl-9" />
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap gap-2" aria-label="Filtrar por tipo">
              {typeOptions.map((option) => (
                <button key={option.value} type="button" aria-pressed={filterType === option.value} onClick={() => setFilterType(option.value)} className={`h-10 rounded-[20px] border px-4 text-xs font-medium transition-colors ${filterType === option.value ? 'border-[var(--color-card-accent-border)] bg-[var(--color-nav-active-fill)] text-[var(--color-nav-active-text)]' : 'border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-action-ghost-hover)]'}`}>{option.label}</button>
              ))}
            </div>
            <div className="w-full lg:w-[170px]">
              {isFreePlan ? <Button variant="secondary" onClick={() => setShowUpgradeModal(true)} className="w-full justify-between"><span>Status (PRO)</span><Lock className="h-4 w-4" /></Button> : <CustomSelect value={statusLabel} options={['Todos os status', 'Pagos', 'Pendentes']} aria-label="Filtrar por status" onChange={(value) => setFilterStatus(value === 'Pagos' ? 'pago' : value === 'Pendentes' ? 'pendente' : 'all')} />}
            </div>
          </div>
        </section>

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,786px)_346px]">
          <section aria-labelledby="transactions-list-title" className="rounded-[18px] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-4 md:p-[18px]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-card-border)] pb-4">
              <div><h2 id="transactions-list-title" className="text-lg font-semibold">{filteredData.length} {filteredData.length === 1 ? 'transação' : 'transações'}</h2><p className="mt-1 text-[11px] capitalize text-[var(--color-text-helper)]">Movimentações de {currentMonthLabel}</p></div>
              <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-helper)]"><Filter className="h-3.5 w-3.5" aria-hidden="true" />Página {safePage} de {totalPages}</div>
            </div>

            {pageData.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center px-5 text-center"><h3 className="text-sm font-semibold">{monthTransactions.length === 0 ? 'Sem transações neste mês' : 'Nenhuma transação encontrada'}</h3><p className="mt-1 max-w-sm text-sm text-[var(--color-text-helper)]">{monthTransactions.length === 0 ? 'Adicione uma nova transação para começar a acompanhar seu fluxo.' : 'Tente ajustar os filtros.'}</p>{monthTransactions.length === 0 ? <Button variant="secondary" className="mt-5" onClick={() => setIsCreateModalOpen(true)}>Nova transação</Button> : null}</div>
            ) : (
              <div className="py-2">{groups.map((group) => <div key={group.label} className="py-2"><h3 className="mb-2 text-[11px] font-medium text-[var(--color-text-helper)]">{group.label}</h3><div className="space-y-2">{group.items.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} onClick={() => { setSelectedTransaction(transaction); setIsEditModalOpen(true) }} />)}</div></div>)}</div>
            )}

            {totalPages > 1 ? <div className="flex items-center justify-between gap-3 border-t border-[var(--color-card-border)] pt-4"><span className="text-xs text-[var(--color-text-helper)]">Página {safePage} de {totalPages}</span><div className="flex gap-2"><Button variant="secondary" size="sm" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</Button><Button variant="secondary" size="sm" disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Próxima</Button></div></div> : null}
          </section>

          <TransactionContextRail context={periodContext} currentMonthLabel={currentMonthLabel} realizedCount={realizedCount} pendingCount={pendingCount} transferCount={transferCount} isFreePlan={isFreePlan} onExportPDF={generatePDF} />
        </div>

        <div className="pt-1"><FixedExpensesList transactions={transactions} currentDate={currentDate} /></div>

        <div className="flex justify-end"><Button variant="ghost" onClick={generatePDF} className="gap-2 text-[var(--color-text-helper)]">{isFreePlan ? <Lock className="h-4 w-4" /> : <Download className="h-4 w-4" />}{isFreePlan ? 'Relatório PDF (PRO)' : 'Exportar PDF'}</Button></div>
      </div>

      <NewTransactionModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={handleSuccessAction} />
      {isEditModalOpen && selectedTransaction ? <TransactionDetailModal key={selectedTransaction.id} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} transaction={selectedTransaction} onUpdate={handleUpdate} onDelete={handleDelete} loading={loadingAction} /> : null}
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  )
}
