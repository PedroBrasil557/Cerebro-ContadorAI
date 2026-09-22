'use client'

import { useMemo } from 'react'
import { ChevronRight, Sparkles } from 'lucide-react'
import type { ActiveTab, Goal, Transaction } from '@/types_db'
import { isRealizedTransaction } from '@/core/finance/transactionMath'
import { GoalProgress } from '@/core/finance-ui/GoalProgress'
import { Button } from '@/core/ui/button'
import { formatCurrency } from '@/lib/utils'

interface OverviewNorthStarSectionsProps {
  transactions: Transaction[]
  goals: Goal[]
  onNavigate: (tab: ActiveTab) => void
}

function isExpense(transaction: Transaction) {
  return transaction.type === 'despesa_fixa' || transaction.type === 'despesa_variavel'
}

function safeAmount(transaction: Transaction) {
  const value = Number(transaction.amount || 0)
  return Number.isFinite(value) ? Math.abs(value) : 0
}

function sameMonth(dateValue: string, reference: Date) {
  const date = new Date(dateValue)
  return !Number.isNaN(date.getTime())
    && date.getFullYear() === reference.getFullYear()
    && date.getMonth() === reference.getMonth()
}

function goalState(goal: Goal): 'on-track' | 'at-risk' | 'completed' {
  if (Number(goal.current_amount || 0) >= Number(goal.target_amount || 0)) return 'completed'
  const deadline = new Date(goal.deadline)
  if (!Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now()) return 'at-risk'
  return 'on-track'
}

function goalDeadline(deadline: string) {
  const date = new Date(deadline)
  if (Number.isNaN(date.getTime())) return 'Prazo não informado'
  return `Prazo: ${new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(date)}`
}

export function OverviewNorthStarSections({ transactions, goals, onNavigate }: OverviewNorthStarSectionsProps) {
  const data = useMemo(() => {
    const now = new Date()
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const currentByCategory = new Map<string, number>()
    const previousByCategory = new Map<string, number>()

    for (const transaction of transactions) {
      if (!isRealizedTransaction(transaction) || !isExpense(transaction)) continue
      const category = transaction.category?.trim() || 'Outros'
      const amount = safeAmount(transaction)
      if (sameMonth(transaction.date, now)) {
        currentByCategory.set(category, (currentByCategory.get(category) ?? 0) + amount)
      } else if (sameMonth(transaction.date, previous)) {
        previousByCategory.set(category, (previousByCategory.get(category) ?? 0) + amount)
      }
    }

    const categories = [...currentByCategory.entries()]
      .sort(([, left], [, right]) => right - left)
      .slice(0, 5)
      .map(([label, value]) => {
        const previousValue = previousByCategory.get(label) ?? 0
        const variation = previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : null
        return { label, value, previousValue, variation }
      })

    const currentTotal = [...currentByCategory.values()].reduce((sum, value) => sum + value, 0)
    const topCategory = categories[0]
    const topShare = topCategory && currentTotal > 0
      ? Math.round((topCategory.value / currentTotal) * 100)
      : null

    const highlightedGoals = [...goals]
      .sort((left, right) => {
        const leftDone = Number(left.current_amount || 0) >= Number(left.target_amount || 0)
        const rightDone = Number(right.current_amount || 0) >= Number(right.target_amount || 0)
        if (leftDone !== rightDone) return leftDone ? 1 : -1
        const leftDeadline = new Date(left.deadline).getTime()
        const rightDeadline = new Date(right.deadline).getTime()
        return (Number.isNaN(leftDeadline) ? Number.MAX_SAFE_INTEGER : leftDeadline)
          - (Number.isNaN(rightDeadline) ? Number.MAX_SAFE_INTEGER : rightDeadline)
      })
      .slice(0, 3)

    return { categories, topCategory, topShare, highlightedGoals }
  }, [goals, transactions])

  const insight = (() => {
    if (!data.topCategory) {
      return {
        title: 'Seu contexto financeiro aparece conforme você registra movimentações',
        evidence: 'Ainda não há despesas realizadas neste mês para destacar uma categoria.',
      }
    }

    if (data.topCategory.variation != null) {
      const direction = data.topCategory.variation <= 0 ? 'caiu' : 'subiu'
      return {
        title: `${data.topCategory.label} ${direction} ${Math.abs(data.topCategory.variation).toFixed(0)}% em relação ao mês anterior`,
        evidence: `${formatCurrency(data.topCategory.value)} neste mês contra ${formatCurrency(data.topCategory.previousValue)} no mês anterior.`,
      }
    }

    return {
      title: `${data.topCategory.label} é a maior categoria de despesa realizada do mês`,
      evidence: `${formatCurrency(data.topCategory.value)} registrados${data.topShare == null ? '' : `, equivalentes a ${data.topShare}% das despesas realizadas do mês`}.`,
    }
  })()

  return (
    <div className="mx-auto mt-6 w-full max-w-[1180px] space-y-5 px-4 pb-5 sm:px-6 lg:px-8">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-5" aria-labelledby="overview-cerebro-insight">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-card-accent-fill)] text-[var(--color-action-ai)]">
            <Sparkles aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p id="overview-cerebro-insight" className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-action-ai)]">Insight do Cérebro</p>
            <h2 className="mt-2 text-base font-semibold text-[var(--color-text-primary)]">{insight.title}</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{insight.evidence}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-5" aria-labelledby="overview-categories-title">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 id="overview-categories-title" className="text-base font-semibold">Categorias em destaque</h2>
              <p className="mt-1 text-xs text-[var(--color-text-helper)]">Despesas realizadas neste mês</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('orçamento')}>Ver orçamento <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" /></Button>
          </div>

          {data.categories.length ? (
            <div className="divide-y divide-[var(--color-card-border)]">
              {data.categories.map((category) => (
                <div key={category.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-action-ghost-hover)] text-xs font-semibold text-[var(--color-text-secondary)]">
                    {category.label.charAt(0).toLocaleUpperCase('pt-BR')}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{category.label}</span>
                  <span className="text-sm font-semibold tabular-nums">{formatCurrency(category.value)}</span>
                  <span className="w-20 text-right text-xs tabular-nums text-[var(--color-text-helper)]">
                    {category.variation == null
                      ? 'sem base'
                      : `${category.variation > 0 ? '+' : ''}${category.variation.toFixed(0)}%`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[var(--radius-md)] bg-[var(--color-action-ghost-hover)] px-4 py-8 text-center text-sm text-[var(--color-text-helper)]">
              Nenhuma despesa realizada neste mês.
            </div>
          )}
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-5" aria-labelledby="overview-goals-title">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 id="overview-goals-title" className="text-base font-semibold">Metas</h2>
              <p className="mt-1 text-xs text-[var(--color-text-helper)]">Progresso persistido dos seus objetivos</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('metas')}>Ver todas <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" /></Button>
          </div>

          {data.highlightedGoals.length ? (
            <div className="space-y-3">
              {data.highlightedGoals.map((goal) => (
                <GoalProgress
                  key={goal.id}
                  title={goal.title}
                  current={Number(goal.current_amount || 0)}
                  target={Number(goal.target_amount || 0)}
                  state={goalState(goal)}
                  helper={goalDeadline(goal.deadline)}
                  className="border-[var(--color-card-border)]"
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[var(--radius-md)] bg-[var(--color-action-ghost-hover)] px-4 py-8 text-center">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Nenhuma meta criada ainda.</p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={() => onNavigate('metas')}>Criar meta</Button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
