'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Loader2,
  SlidersHorizontal,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import type { ActiveTab, Transaction } from '@/types_db'
import { buildBudgetAnalysis, type BudgetCategoryAnalysis } from '@/core/finance/budget'
import { isRealizedTransaction } from '@/core/finance/transactionMath'
import BudgetEditorModal from '@/modules/personal/components/BudgetEditorModal'
import { budgetService, type PersonalBudget } from '@/services/budgetService'
import { Button } from '@/core/ui/button'

interface BudgetViewProps {
  transactions: Transaction[]
  handleRedirect: (tab: ActiveTab) => void
}

function brl(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function monthStart(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
}

function isExpense(transaction: Transaction) {
  return transaction.type === 'despesa_fixa' || transaction.type === 'despesa_variavel'
}

function categoryTone(category: BudgetCategoryAnalysis) {
  if (category.state === 'exceeded') {
    return {
      label: 'Limite ultrapassado',
      text: 'text-[var(--color-status-danger)]',
      fill: 'bg-[var(--color-status-danger)]',
      badge: 'bg-[color-mix(in_srgb,var(--color-status-danger)_12%,transparent)]',
    }
  }
  if (category.state === 'attention') {
    return {
      label: 'Próxima do limite',
      text: 'text-[var(--color-status-warning)]',
      fill: 'bg-[var(--color-status-warning)]',
      badge: 'bg-[color-mix(in_srgb,var(--color-status-warning)_14%,transparent)]',
    }
  }
  if (category.state === 'unplanned') {
    return {
      label: 'Sem limite definido',
      text: 'text-[var(--color-text-helper)]',
      fill: 'bg-[var(--color-text-helper)]',
      badge: 'bg-[var(--color-action-ghost-hover)]',
    }
  }
  return {
    label: 'Dentro do esperado',
    text: 'text-[var(--color-status-success)]',
    fill: 'bg-[var(--color-status-success)]',
    badge: 'bg-[color-mix(in_srgb,var(--color-status-success)_12%,transparent)]',
  }
}

export default function BudgetView({ transactions, handleRedirect }: BudgetViewProps) {
  const [referenceDate, setReferenceDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [budget, setBudget] = useState<PersonalBudget | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)

  const selectedMonthStart = monthStart(referenceDate)

  const loadBudget = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setBudget(await budgetService.getBudget(selectedMonthStart))
    } catch {
      setError('Não foi possível carregar o orçamento deste mês.')
    } finally {
      setLoading(false)
    }
  }, [selectedMonthStart])

  useEffect(() => {
    void loadBudget()
  }, [loadBudget])

  const analysis = useMemo(
    () => buildBudgetAnalysis(transactions, budget, referenceDate),
    [budget, referenceDate, transactions],
  )

  const suggestedCategories = useMemo(
    () => [...new Set(
      transactions
        .filter((transaction) => isExpense(transaction))
        .map((transaction) => transaction.category?.trim())
        .filter((category): category is string => Boolean(category)),
    )],
    [transactions],
  )

  const realizedMonthCount = useMemo(() => {
    const key = selectedMonthStart.slice(0, 7)
    return transactions.filter((transaction) =>
      transaction.date.startsWith(key)
      && isExpense(transaction)
      && isRealizedTransaction(transaction),
    ).length
  }, [selectedMonthStart, transactions])

  const limitedCategories = analysis.categories.filter((category) => category.limit !== null)
  const insightCategory = analysis.categories.find((category) => category.state === 'exceeded')
    ?? analysis.categories.find((category) => category.state === 'attention')

  const insight = useMemo(() => {
    if (!budget) {
      return {
        title: 'Defina seu orçamento para comparar o planejado com o realizado.',
        description: realizedMonthCount > 0
          ? `${brl(analysis.used)} em despesas realizadas já foram registradas neste mês.`
          : 'Quando o planejamento estiver definido, o Cérebro mostrará limites e ritmo usando seus dados reais.',
      }
    }
    if (insightCategory?.state === 'exceeded' && insightCategory.limit != null) {
      return {
        title: `${insightCategory.category} ultrapassou o limite.`,
        description: `${brl(insightCategory.spent)} realizados para um limite de ${brl(insightCategory.limit)}.`,
      }
    }
    if (insightCategory?.state === 'attention' && insightCategory.limit != null) {
      return {
        title: `${insightCategory.category} está perto do limite.`,
        description: `${brl(insightCategory.spent)} realizados de ${brl(insightCategory.limit)} planejados para a categoria.`,
      }
    }
    if (analysis.forecastStatus === 'over' && analysis.forecast != null) {
      return {
        title: 'Seu ritmo atual pode ultrapassar o orçamento.',
        description: `A projeção determinística aponta ${brl(analysis.forecast)}, cerca de ${brl(Math.max(0, analysis.forecast - analysis.planned))} acima do planejado.`,
      }
    }
    if (analysis.forecast != null) {
      return {
        title: 'Seu ritmo atual segue dentro do planejado.',
        description: `A projeção para o fechamento está em ${brl(analysis.forecast)} diante de ${brl(analysis.planned)} planejados.`,
      }
    }
    return {
      title: 'Ainda não há base suficiente para projetar o fechamento.',
      description: 'A previsão aparece após pelo menos três dias do mês e quando existem despesas realizadas.',
    }
  }, [analysis, budget, insightCategory, realizedMonthCount])

  const previousMonth = () => setReferenceDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))
  const nextMonth = () => setReferenceDate((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 aria-label="Carregando orçamento" className="h-7 w-7 animate-spin text-[var(--color-action-primary)]" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-4 p-4 md:p-6 xl:p-7">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-action-primary)]">Orçamento</p>
          <h1 className="mt-2 text-[28px] font-bold leading-9 tracking-[-0.5px] text-[var(--color-text-primary)] md:text-[30px]">
            Orçamento de {new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(referenceDate)}
          </h1>
          <p className="mt-1 text-[13px] leading-5 text-[var(--color-text-secondary)]">
            Planeje limites e acompanhe o ritmo antes que o mês decida por você.
          </p>
        </div>
        <div className="flex h-[42px] items-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)]">
          <Button variant="ghost" size="icon-sm" aria-label="Mês anterior" onClick={previousMonth}>
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </Button>
          <span className="min-w-[150px] px-2 text-center text-xs font-medium capitalize text-[var(--color-text-secondary)]">
            {monthLabel(referenceDate)}
          </span>
          <Button variant="ghost" size="icon-sm" aria-label="Próximo mês" onClick={nextMonth}>
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {error ? (
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-status-danger)]/30 bg-[var(--color-card-fill)] p-6 text-center">
          <p className="text-sm text-[var(--color-status-danger)]">{error}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => void loadBudget()}>Tentar novamente</Button>
        </section>
      ) : null}

      {!budget && !error ? (
        <section className="rounded-[22px] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] px-6 py-8 md:px-8 md:py-10">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-helper)]">Planejamento mensal</p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-[var(--color-text-primary)]">Defina um orçamento para este mês.</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              Você já utilizou {brl(analysis.used)} em {realizedMonthCount} {realizedMonthCount === 1 ? 'despesa realizada' : 'despesas realizadas'}. O planejamento permite comparar esse valor com limites explícitos, sem estimativas inventadas.
            </p>
            <Button className="mt-6 gap-2" onClick={() => setEditorOpen(true)}>
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />Definir orçamento
            </Button>
          </div>
        </section>
      ) : null}

      {budget ? (
        <>
          <section className="relative overflow-hidden rounded-[22px] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-6 md:p-7">
            <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-20 h-64 w-64 rounded-full bg-[var(--color-card-accent-fill)] opacity-80 blur-[1px]" />
            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_294px] lg:items-end">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-helper)]">Utilizado</p>
                <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[34px] font-bold leading-none tracking-[-0.04em] text-[var(--color-text-primary)]">{brl(analysis.used)}</p>
                    <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">de {brl(analysis.planned)} planejados</p>
                  </div>
                  <div className="text-right lg:hidden">
                    <p className="text-3xl font-bold text-[var(--color-action-primary)]">{analysis.utilizationPercent == null ? '—' : `${Math.round(analysis.utilizationPercent)}%`}</p>
                    <p className="text-[11px] text-[var(--color-text-helper)]">do orçamento</p>
                  </div>
                </div>
                <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-[var(--color-progress-track)]">
                  <div
                    className={`h-full rounded-full ${analysis.remaining < 0 ? 'bg-[var(--color-status-danger)]' : 'bg-[var(--color-action-primary)]'}`}
                    style={{ width: `${Math.min(100, Math.max(0, analysis.utilizationPercent ?? 0))}%` }}
                  />
                </div>
                <p className={`mt-3 text-xs font-medium ${analysis.remaining < 0 ? 'text-[var(--color-status-danger)]' : 'text-[var(--color-status-success)]'}`}>
                  {analysis.remaining >= 0 ? `${brl(analysis.remaining)} ainda disponíveis` : `${brl(Math.abs(analysis.remaining))} acima do planejado`}
                </p>
              </div>

              <div className="relative space-y-3">
                <div className="hidden text-right lg:block">
                  <p className="text-[30px] font-bold leading-9 text-[var(--color-action-primary)]">{analysis.utilizationPercent == null ? '—' : `${Math.round(analysis.utilizationPercent)}%`}</p>
                  <p className="text-[11px] text-[var(--color-text-helper)]">do orçamento</p>
                </div>
                <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] p-4">
                  <p className="text-[10px] text-[var(--color-text-helper)]">Previsão para o fim do mês</p>
                  {analysis.forecast == null ? (
                    <p className="mt-2 text-sm font-semibold text-[var(--color-text-secondary)]">Ainda sem base suficiente</p>
                  ) : (
                    <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <p className="text-lg font-semibold text-[var(--color-text-primary)]">{brl(analysis.forecast)}</p>
                      <p className={`text-[11px] font-medium ${analysis.forecastStatus === 'over' ? 'text-[var(--color-status-danger)]' : 'text-[var(--color-status-success)]'}`}>
                        {analysis.forecastStatus === 'over' ? 'acima do planejado' : 'dentro do planejado'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="grid overflow-hidden rounded-[18px] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] md:grid-cols-3" aria-label="Resumo do orçamento">
            {[
              { label: 'Planejado', value: analysis.planned, icon: CircleDollarSign, tone: 'text-[var(--color-status-ai)]' },
              { label: 'Utilizado', value: analysis.used, icon: TrendingUp, tone: 'text-[var(--color-status-danger)]' },
              { label: 'Disponível', value: analysis.remaining, icon: TrendingDown, tone: analysis.remaining < 0 ? 'text-[var(--color-status-danger)]' : 'text-[var(--color-status-success)]' },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div key={item.label} className={`flex items-center gap-3 px-5 py-5 ${index > 0 ? 'border-t border-[var(--color-card-border)] md:border-l md:border-t-0' : ''}`}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-action-ghost-hover)]">
                    <Icon aria-hidden="true" className={`h-4 w-4 ${item.tone}`} />
                  </span>
                  <div>
                    <p className="text-[11px] text-[var(--color-text-helper)]">{item.label}</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--color-text-primary)]">{brl(item.value)}</p>
                  </div>
                </div>
              )
            })}
          </section>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.75fr)_minmax(300px,1fr)]">
            <section className="rounded-[20px] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-5" aria-labelledby="budget-category-analysis">
              <h2 id="budget-category-analysis" className="text-lg font-semibold text-[var(--color-text-primary)]">Gastos por categoria</h2>
              <p className="mt-1 text-[11px] text-[var(--color-text-helper)]">Quanto cada área já consumiu do seu limite</p>
              <div className="mt-5 space-y-4">
                {limitedCategories.length ? limitedCategories.slice(0, 4).map((category) => {
                  const tone = categoryTone(category)
                  const percent = category.utilizationPercent ?? 0
                  return (
                    <div key={category.category}>
                      <div className="mb-2 flex items-center gap-3 text-xs">
                        <span className="min-w-0 flex-1 truncate font-medium text-[var(--color-text-primary)]">{category.category}</span>
                        <span className="text-[11px] tabular-nums text-[var(--color-text-helper)]">{brl(category.spent)} / {brl(category.limit ?? 0)}</span>
                        <span className={`w-12 text-right text-[11px] font-medium tabular-nums ${tone.text}`}>{Math.round(percent)}%</span>
                      </div>
                      <div className="h-[7px] overflow-hidden rounded-full bg-[var(--color-progress-track)]">
                        <div className={`h-full rounded-full ${tone.fill}`} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
                      </div>
                    </div>
                  )
                }) : (
                  <p className="rounded-[var(--radius-md)] bg-[var(--color-action-ghost-hover)] p-4 text-sm text-[var(--color-text-helper)]">Nenhuma categoria possui limite específico neste mês.</p>
                )}
              </div>
            </section>

            <section className="rounded-[20px] border border-[var(--color-card-accent-border)] bg-[var(--color-card-accent-fill)] p-5" aria-labelledby="budget-insight-title">
              <div className="flex items-center gap-3">
                <Sparkles aria-hidden="true" className="h-4 w-4 text-[var(--color-status-ai)]" />
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">Insight do Cérebro</p>
              </div>
              <h2 id="budget-insight-title" className="mt-5 text-[22px] font-semibold leading-[29px] text-[var(--color-text-primary)]">{insight.title}</h2>
              <p className="mt-3 text-xs leading-5 text-[var(--color-text-secondary)]">{insight.description}</p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button variant="ai" size="sm" onClick={() => handleRedirect('transações')}>Ver gastos relacionados</Button>
                <Button variant="link" size="sm" onClick={() => setEditorOpen(true)}>Ajustar orçamento →</Button>
              </div>
            </section>
          </div>

          <section aria-labelledby="budget-month-categories">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 id="budget-month-categories" className="text-xl font-semibold text-[var(--color-text-primary)]">Categorias do mês</h2>
                <p className="mt-1 text-xs text-[var(--color-text-helper)]">Veja onde o orçamento está confortável e onde merece atenção.</p>
              </div>
              <Button variant="link" size="sm" onClick={() => setEditorOpen(true)}>Ajustar limites</Button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {analysis.categories.length ? analysis.categories.map((category) => {
                const tone = categoryTone(category)
                const percent = category.utilizationPercent
                return (
                  <article key={category.category} className="rounded-[18px] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-4">
                    <div className="flex items-start gap-3">
                      <span className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${tone.badge} ${tone.text}`}>
                        {category.category.charAt(0).toLocaleUpperCase('pt-BR')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-[13px] font-semibold text-[var(--color-text-primary)]">{category.category}</h3>
                            <p className="mt-1 text-[10px] text-[var(--color-text-helper)]">{tone.label}</p>
                          </div>
                          <span className={`text-xs font-semibold tabular-nums ${tone.text}`}>{percent == null ? '—' : `${Math.round(percent)}%`}</span>
                        </div>
                        <div className="mt-4 h-[7px] overflow-hidden rounded-full bg-[var(--color-progress-track)]">
                          <div className={`h-full rounded-full ${tone.fill}`} style={{ width: `${percent == null ? 0 : Math.min(100, Math.max(0, percent))}%` }} />
                        </div>
                        <p className="mt-2 text-[10px] text-[var(--color-text-helper)]">
                          {category.limit == null ? `${brl(category.spent)} realizados · sem limite definido` : `${brl(category.spent)} / ${brl(category.limit)}`}
                        </p>
                      </div>
                    </div>
                  </article>
                )
              }) : (
                <div className="md:col-span-2 rounded-[18px] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-8 text-center text-sm text-[var(--color-text-helper)]">
                  As categorias aparecerão quando você definir limites ou registrar despesas realizadas.
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}

      <BudgetEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        monthStart={selectedMonthStart}
        budget={budget}
        suggestedCategories={suggestedCategories}
        onSaved={loadBudget}
      />
    </div>
  )
}
