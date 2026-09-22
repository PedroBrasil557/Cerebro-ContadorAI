'use client'

import React, { useMemo } from 'react'
import { useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleDollarSign,
  PiggyBank,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ActiveTab, Goal, Investment, Transaction } from '@/types_db'
import {
  calculateRealizedExpenses,
  calculateRealizedIncome,
  isRealizedTransaction,
  normalizeTransactionAmount,
} from '@/core/finance/transactionMath'
import { calculateInvestmentPortfolioValue } from '@/core/finance/patrimony'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/core/ui/button'

interface DashboardViewProps {
  summary: {
    balance: number
    income: number
    expense: number
    emergencyTotal: number
  }
  recentTransactions: Transaction[]
  onNavigate: (tab: ActiveTab) => void
  transactions: Transaction[]
  investments: Investment[]
  goals: Goal[]
  displayName: string
}

function expense(transaction: Transaction) {
  return transaction.type === 'despesa_fixa' || transaction.type === 'despesa_variavel'
}

function sameMonth(value: string, reference: Date) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  return !Number.isNaN(date.getTime())
    && date.getFullYear() === reference.getFullYear()
    && date.getMonth() === reference.getMonth()
}

function variation(current: number, previous: number) {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}

function compactCurrency(value: number) {
  const absolute = Math.abs(value)
  if (absolute >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)} mi`
  if (absolute >= 1_000) return `R$ ${(value / 1_000).toFixed(0)} mil`
  return `R$ ${Math.round(value)}`
}

function shortCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function greeting(date: Date) {
  const hour = date.getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function Metric({
  label,
  value,
  helper,
  tone,
  icon: Icon,
  last = false,
}: {
  label: string
  value: string
  helper: string
  tone: 'success' | 'danger' | 'ai'
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  last?: boolean
}) {
  const tones = {
    success: 'bg-[color-mix(in_srgb,var(--color-status-success)_13%,transparent)] text-[var(--color-status-success)]',
    danger: 'bg-[color-mix(in_srgb,var(--color-status-danger)_12%,transparent)] text-[var(--color-status-danger)]',
    ai: 'bg-[var(--color-status-ai-surface)] text-[var(--color-status-ai)]',
  }

  return (
    <div className={`rounded-[18px] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-3 md:min-h-[108px] md:rounded-none md:border-0 md:p-4 xl:px-5 ${last ? '' : 'md:border-r md:border-[var(--color-card-border)]'}`}>
      <div className="flex items-center gap-2.5">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}>
          <Icon aria-hidden={true} className="h-4 w-4" />
        </span>
        <p className="text-[11px] text-[var(--color-text-helper)]">{label}</p>
      </div>
      <p className="mt-2 text-[20px] font-semibold leading-6 tracking-[-0.03em] text-[var(--color-text-primary)] md:text-[22px]">{value}</p>
      <p className={`mt-1 text-[10px] font-medium ${tone === 'danger' ? 'text-[var(--color-status-danger)]' : tone === 'success' ? 'text-[var(--color-status-success)]' : 'text-[var(--color-text-helper)]'}`}>{helper}</p>
    </div>
  )
}

function ProgressGoal({ goal }: { goal: Goal }) {
  const current = Math.max(0, Number(goal.current_amount || 0))
  const target = Math.max(0, Number(goal.target_amount || 0))
  const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0
  const emergency = (goal as Goal & { goal_type?: string }).goal_type === 'emergency_fund'

  return (
    <div className="py-2.5 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-xs font-medium text-[var(--color-text-primary)]">{goal.title}</p>
        <span className={`shrink-0 text-[10px] font-medium ${emergency ? 'text-[var(--color-status-success)]' : 'text-[var(--color-action-primary)]'}`}>{Math.round(percent)}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-progress-track)]">
        <div className={`h-full rounded-full ${emergency ? 'bg-[var(--color-status-success)]' : 'bg-[var(--color-action-primary)]'}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1.5 text-[10px] text-[var(--color-text-helper)]">{shortCurrency(current)} / {shortCurrency(target)}</p>
    </div>
  )
}

export default function DashboardView({
  summary,
  recentTransactions,
  onNavigate,
  transactions = [],
  investments = [],
  goals = [],
  displayName,
}: DashboardViewProps) {
  const reduceMotion = useReducedMotion()
  const now = useMemo(() => new Date(), [])
  const previous = useMemo(() => new Date(now.getFullYear(), now.getMonth() - 1, 1), [now])
  const firstName = displayName.split(' ')[0] || displayName

  const data = useMemo(() => {
    const currentTransactions = transactions.filter((transaction) => sameMonth(transaction.date, now))
    const previousTransactions = transactions.filter((transaction) => sameMonth(transaction.date, previous))
    const realizedCurrent = currentTransactions.filter(isRealizedTransaction)
    const income = calculateRealizedIncome(currentTransactions)
    const expenseValue = calculateRealizedExpenses(currentTransactions)
    const previousIncome = calculateRealizedIncome(previousTransactions)
    const previousExpense = calculateRealizedExpenses(previousTransactions)
    const investmentsValue = calculateInvestmentPortfolioValue(investments)

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const flow = Array.from({ length: daysInMonth }, (_, index) => ({
      day: index + 1,
      label: `${index + 1}`,
      receita: 0,
      despesa: 0,
    }))
    for (const transaction of realizedCurrent) {
      const parsed = new Date(`${transaction.date.slice(0, 10)}T12:00:00`)
      if (Number.isNaN(parsed.getTime())) continue
      const index = parsed.getDate() - 1
      if (transaction.type === 'receita') flow[index].receita += normalizeTransactionAmount(transaction.amount)
      if (expense(transaction)) flow[index].despesa -= normalizeTransactionAmount(transaction.amount)
    }

    const currentCategories = new Map<string, number>()
    const previousCategories = new Map<string, number>()
    for (const transaction of transactions) {
      if (!isRealizedTransaction(transaction) || !expense(transaction)) continue
      const category = transaction.category?.trim() || 'Outros'
      const amount = normalizeTransactionAmount(transaction.amount)
      if (sameMonth(transaction.date, now)) currentCategories.set(category, (currentCategories.get(category) ?? 0) + amount)
      if (sameMonth(transaction.date, previous)) previousCategories.set(category, (previousCategories.get(category) ?? 0) + amount)
    }

    const categories = [...currentCategories.entries()]
      .sort(([, left], [, right]) => right - left)
      .slice(0, 4)
      .map(([label, value]) => ({
        label,
        value,
        variation: variation(value, previousCategories.get(label) ?? 0),
      }))

    const highlightedGoals = [...goals]
      .sort((left, right) => {
        const lp = Number(left.target_amount || 0) > 0 ? Number(left.current_amount || 0) / Number(left.target_amount) : 0
        const rp = Number(right.target_amount || 0) > 0 ? Number(right.current_amount || 0) / Number(right.target_amount) : 0
        return rp - lp
      })
      .slice(0, 3)

    return {
      income,
      expense: expenseValue,
      previousIncome,
      previousExpense,
      investments: investmentsValue,
      realizedCount: realizedCurrent.length,
      flow,
      categories,
      highlightedGoals,
    }
  }, [goals, investments, now, previous, transactions])

  const topCategory = data.categories[0]
  const insight = !topCategory
    ? {
        title: 'Seu contexto financeiro fica mais claro a cada movimentação.',
        description: 'Ainda não há despesas realizadas neste mês para comparar categorias.',
      }
    : topCategory.variation == null
      ? {
          title: `${topCategory.label} é sua maior categoria de gasto neste mês.`,
          description: `${shortCurrency(topCategory.value)} em despesas realizadas até agora.`,
        }
      : {
          title: `Seus gastos com ${topCategory.label.toLocaleLowerCase('pt-BR')} ${topCategory.variation <= 0 ? 'caíram' : 'subiram'} ${Math.abs(topCategory.variation).toFixed(0)}% este mês.`,
          description: `${shortCurrency(topCategory.value)} agora, comparados ao mês anterior.`,
        }

  const incomeDelta = variation(data.income, data.previousIncome)
  const expenseDelta = variation(data.expense, data.previousExpense)
  const hasFlow = data.flow.some((point) => point.receita !== 0 || point.despesa !== 0)
  const dateLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(now)

  const safeSteps = [
    { title: 'Revisar orçamento do mês', helper: 'Compare planejado e realizado', tab: 'orçamento' as ActiveTab, icon: CircleDollarSign },
    ...(data.highlightedGoals[0] ? [{ title: `Acompanhar ${data.highlightedGoals[0].title}`, helper: `Meta: ${shortCurrency(Number(data.highlightedGoals[0].target_amount || 0))}`, tab: 'metas' as ActiveTab, icon: Target }] : []),
    { title: 'Revisar movimentações', helper: `${data.realizedCount} realizadas neste mês`, tab: 'transações' as ActiveTab, icon: Check },
  ].slice(0, 3)

  const recent = recentTransactions.slice(0, 5)

  const InsightCard = ({ mobile = false }: { mobile?: boolean }) => (
    <section className={`rounded-[20px] border border-[var(--color-card-accent-border)] bg-[var(--color-card-accent-fill)] ${mobile ? 'p-4' : 'p-5'}`} aria-labelledby={mobile ? 'overview-insight-mobile' : 'overview-insight-desktop'}>
      <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-primary)]"><Sparkles aria-hidden="true" className="h-4 w-4 text-[var(--color-action-ai)]" />Insight do Cérebro</div>
      <h2 id={mobile ? 'overview-insight-mobile' : 'overview-insight-desktop'} className={`${mobile ? 'mt-5 text-[19px] leading-[25px]' : 'mt-6 text-[21px] leading-7'} font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]`}>{insight.title}</h2>
      <p className="mt-2 text-xs leading-[18px] text-[var(--color-text-secondary)]">{insight.description}</p>
      <Button variant="secondary" size="icon" aria-label="Ver orçamento relacionado ao insight" className="mt-4 rounded-full bg-[var(--color-bg-surface)]" onClick={() => onNavigate('orçamento')}><ArrowRight className="h-4 w-4" /></Button>
    </section>
  )

  return (
    <div className="min-h-full bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)]">
      <div className="mx-auto w-full max-w-[1148px] space-y-4 px-4 py-[18px] sm:px-6 xl:px-0 xl:py-7">
        <h1 className="sr-only">Visão geral</h1>

        <section className="relative h-[190px] overflow-hidden rounded-[20px] bg-[var(--color-bg-canvas)] md:h-[176px]" aria-label="Resumo do dia">
          <div aria-hidden="true" className="absolute -right-8 -top-12 h-44 w-40 rounded-[40px] bg-[var(--color-card-accent-fill)] md:right-8 md:h-52 md:w-52" />
          <div aria-hidden="true" className="absolute right-2 top-[76px] h-16 w-32 rounded-[50%] bg-[var(--color-status-ai-surface)]/70 md:right-28 md:top-[72px] md:w-44" />
          <div aria-hidden="true" className="absolute bottom-1 right-0 h-20 w-[220px] rounded-tl-[90%] bg-[color-mix(in_srgb,var(--color-card-accent-fill)_86%,white)] md:right-16 md:w-[330px]" />

          <p className="relative z-10 pt-3 text-[11px] capitalize text-[var(--color-text-helper)] md:pt-5 md:text-xs">{dateLabel}</p>
          <p className="relative z-10 mt-5 text-[30px] font-bold leading-[38px] tracking-[-0.04em] md:mt-4 md:text-[42px] md:leading-[50px]">{greeting(now)}, {firstName}.</p>
          <p className="relative z-10 mt-1 text-[15px] text-[var(--color-text-secondary)] md:text-[20px]">{summary.balance >= 0 ? 'Seu mês continua positivo.' : 'Seu mês pede um pouco mais de atenção.'}</p>
          <div className="absolute bottom-4 right-2 z-10 w-[158px] text-right md:bottom-10 md:right-14 md:w-[220px]">
            <p className="text-xs font-semibold leading-[17px] md:text-sm md:leading-5">“Clareza hoje cria<br />mais opções amanhã.”</p>
            <p className="mt-2 text-[10px] text-[var(--color-text-helper)]">Cérebro</p>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-0 md:overflow-hidden md:rounded-[18px] md:border md:border-[var(--color-card-border)] md:bg-[var(--color-card-fill)] md:shadow-[0_4px_12px_rgba(5,6,10,0.08)]" aria-label="Indicadores principais">
          <Metric label="Saldo disponível" value={shortCurrency(summary.balance)} helper="movimentações realizadas" tone={summary.balance >= 0 ? 'success' : 'danger'} icon={WalletCards} />
          <Metric label="Receitas" value={shortCurrency(data.income)} helper={incomeDelta == null ? 'sem base anterior' : `${incomeDelta >= 0 ? '↑' : '↓'} ${Math.abs(incomeDelta).toFixed(1)}%`} tone="success" icon={TrendingUp} />
          <Metric label="Despesas" value={shortCurrency(data.expense)} helper={expenseDelta == null ? 'sem base anterior' : `${expenseDelta <= 0 ? '↓' : '↑'} ${Math.abs(expenseDelta).toFixed(1)}%`} tone={expenseDelta != null && expenseDelta <= 0 ? 'success' : 'danger'} icon={TrendingDown} />
          <Metric label="Investimentos" value={shortCurrency(data.investments)} helper={data.investments > 0 ? 'valor atual da carteira' : 'sem investimentos'} tone="ai" icon={ArrowUpRight} last />
        </section>

        <div className="xl:hidden"><InsightCard mobile /></div>

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_322px]">
          <div className="space-y-4">
            <section className="rounded-[18px] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-4 md:p-5" aria-labelledby="cashflow-title">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 id="cashflow-title" className="text-[18px] font-semibold md:text-xl">Fluxo de caixa</h2><p className="mt-1 text-[11px] text-[var(--color-text-helper)]">Entradas e saídas deste mês</p></div>
                <div className="flex items-center gap-4 text-[10px] text-[var(--color-text-helper)]"><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--color-status-success)]" />Entradas</span><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--color-status-danger)]" />Saídas</span></div>
              </div>
              <div className="mt-3 h-[250px] md:h-[300px]" role="img" aria-label="Fluxo de caixa diário realizado deste mês">
                {hasFlow ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart accessibilityLayer data={data.flow} margin={{ top: 12, right: 6, left: -8, bottom: 0 }} barCategoryGap="26%">
                      <CartesianGrid stroke="var(--color-chart-grid)" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={9} interval={6} stroke="var(--color-chart-axis)" />
                      <YAxis tickLine={false} axisLine={false} fontSize={9} width={58} tickFormatter={compactCurrency} stroke="var(--color-chart-axis)" />
                      <ReferenceLine y={0} stroke="var(--color-border-default)" />
                      <Tooltip formatter={(value) => formatCurrency(Math.abs(Number(value ?? 0)))} contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-card-border)', borderRadius: 12 }} />
                      <Bar dataKey="receita" name="Entradas" fill="var(--color-status-success)" radius={[4, 4, 0, 0]} isAnimationActive={!reduceMotion} animationDuration={240} />
                      <Bar dataKey="despesa" name="Saídas" fill="var(--color-status-danger)" radius={[0, 0, 4, 4]} isAnimationActive={!reduceMotion} animationDuration={240} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex h-full items-center justify-center text-center text-sm text-[var(--color-text-helper)]">Registre movimentações realizadas para visualizar o fluxo do mês.</div>}
              </div>
            </section>

            <div className="xl:hidden">
              <section className="rounded-[18px] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-4" aria-labelledby="steps-mobile-title">
                <div className="mb-3 flex items-center justify-between"><h2 id="steps-mobile-title" className="text-lg font-semibold">Próximos passos</h2></div>
                <div className="divide-y divide-[var(--color-card-border)]">{safeSteps.map((step) => <button key={step.title} type="button" onClick={() => onNavigate(step.tab)} className="flex w-full items-center gap-3 py-3 text-left"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-action-ghost-hover)] text-[var(--color-action-primary)]"><step.icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{step.title}</span><span className="mt-0.5 block truncate text-[10px] text-[var(--color-text-helper)]">{step.helper}</span></span><ChevronRight className="h-4 w-4 text-[var(--color-text-helper)]" /></button>)}</div>
              </section>
            </div>

            <section className="rounded-[18px] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-4 md:p-5" aria-labelledby="categories-title">
              <div className="mb-3 flex items-center justify-between gap-3"><h2 id="categories-title" className="text-lg font-semibold">Categorias em destaque</h2><Button variant="link" size="sm" onClick={() => onNavigate('orçamento')}>Ver todas</Button></div>
              {data.categories.length ? <div className="grid gap-x-5 md:grid-cols-2">{data.categories.map((category) => <div key={category.label} className="flex items-center gap-3 border-b border-[var(--color-card-border)] py-3 last:border-0"><span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[var(--color-action-ghost-hover)] text-[10px] font-semibold">{category.label.charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1 truncate text-xs font-medium">{category.label}</span><span className="text-xs font-medium tabular-nums">{shortCurrency(category.value)}</span><span className={`w-12 text-right text-[10px] ${category.variation == null ? 'text-[var(--color-text-helper)]' : category.variation <= 0 ? 'text-[var(--color-status-success)]' : 'text-[var(--color-status-warning)]'}`}>{category.variation == null ? '—' : `${category.variation <= 0 ? '↓' : '↑'} ${Math.abs(category.variation).toFixed(0)}%`}</span></div>)}</div> : <p className="py-6 text-center text-sm text-[var(--color-text-helper)]">Nenhuma despesa realizada neste mês.</p>}
            </section>

            <section className="rounded-[18px] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-4 md:p-5" aria-labelledby="overview-goals-title">
              <div className="mb-3 flex items-center justify-between"><h2 id="overview-goals-title" className="text-lg font-semibold">Metas</h2><Button variant="link" size="sm" onClick={() => onNavigate('metas')}>Ver todas</Button></div>
              {data.highlightedGoals.length ? <div className="divide-y divide-[var(--color-card-border)]">{data.highlightedGoals.map((goal) => <ProgressGoal key={goal.id} goal={goal} />)}</div> : <div className="py-6 text-center"><p className="text-sm text-[var(--color-text-helper)]">Nenhuma meta criada ainda.</p><Button variant="secondary" size="sm" className="mt-3" onClick={() => onNavigate('metas')}>Criar meta</Button></div>}
            </section>

            <div className="xl:hidden">
              <section className="rounded-[18px] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-4" aria-labelledby="recent-mobile-title">
                <div className="mb-3 flex items-center justify-between"><h2 id="recent-mobile-title" className="text-lg font-semibold">Transações recentes</h2><Button variant="link" size="sm" onClick={() => onNavigate('transações')}>Ver todas</Button></div>
                <div className="divide-y divide-[var(--color-card-border)]">{recent.map((transaction) => <div key={transaction.id} className="flex items-center gap-3 py-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-action-ghost-hover)] text-[10px] font-semibold">{transaction.description.charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{transaction.description}</span><span className="text-[10px] text-[var(--color-text-helper)]">{transaction.category}</span></span><span className={`text-xs font-semibold tabular-nums ${transaction.type === 'receita' ? 'text-[var(--color-status-success)]' : 'text-[var(--color-text-primary)]'}`}>{transaction.type === 'receita' ? '+' : expense(transaction) ? '−' : ''} {shortCurrency(normalizeTransactionAmount(transaction.amount))}</span></div>)}</div>
              </section>
            </div>
          </div>

          <aside className="hidden space-y-4 xl:block" aria-label="Contexto financeiro">
            <InsightCard />
            <section className="rounded-[18px] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-4" aria-labelledby="steps-title">
              <h2 id="steps-title" className="text-lg font-semibold">Próximos passos</h2>
              <div className="mt-3 divide-y divide-[var(--color-card-border)]">{safeSteps.map((step) => <button key={step.title} type="button" onClick={() => onNavigate(step.tab)} className="flex w-full items-center gap-3 py-3 text-left"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-action-ghost-hover)] text-[var(--color-action-primary)]"><step.icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{step.title}</span><span className="mt-0.5 block truncate text-[10px] text-[var(--color-text-helper)]">{step.helper}</span></span><ChevronRight className="h-4 w-4 text-[var(--color-text-helper)]" /></button>)}</div>
            </section>
            <section className="rounded-[18px] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-4" aria-labelledby="recent-title">
              <div className="mb-3 flex items-center justify-between"><h2 id="recent-title" className="text-lg font-semibold">Transações recentes</h2><Button variant="link" size="sm" onClick={() => onNavigate('transações')}>Ver todas</Button></div>
              <div className="divide-y divide-[var(--color-card-border)]">{recent.length ? recent.map((transaction) => <div key={transaction.id} className="flex items-center gap-3 py-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-action-ghost-hover)] text-[10px] font-semibold">{transaction.description.charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{transaction.description}</span><span className="text-[10px] text-[var(--color-text-helper)]">{transaction.category}</span></span><span className={`text-[11px] font-semibold tabular-nums ${transaction.type === 'receita' ? 'text-[var(--color-status-success)]' : 'text-[var(--color-text-primary)]'}`}>{transaction.type === 'receita' ? '+' : expense(transaction) ? '−' : ''} {shortCurrency(normalizeTransactionAmount(transaction.amount))}</span></div>) : <p className="py-4 text-center text-xs text-[var(--color-text-helper)]">Nenhuma movimentação recente.</p>}</div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
