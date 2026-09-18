'use client'

import { useMemo } from 'react'
import type { ActiveTab, Transaction } from '@/types_db'
import { CategoryBreakdownCard, type CategoryBreakdownItem } from '@/core/finance-ui/CategoryBreakdownCard'
import { CerebroAICard } from '@/core/finance-ui/CerebroAICard'
import { FinancialMetricCard } from '@/core/finance-ui/FinancialMetricCard'
import { SmartAlert } from '@/core/finance-ui/SmartAlert'

interface BudgetViewProps {
  transactions: Transaction[]
  handleRedirect: (tab: ActiveTab) => void
}

function amount(transaction: Transaction) {
  const value = typeof transaction.amount === 'number' ? transaction.amount : Number(transaction.amount)
  return Number.isFinite(value) ? Math.abs(value) : 0
}

function isExpense(transaction: Transaction) {
  return transaction.type === 'despesa_fixa' || transaction.type === 'despesa_variavel'
}

function sameMonth(date: Date, reference: Date) {
  return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth()
}

function brl(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function BudgetView({ transactions, handleRedirect }: BudgetViewProps) {
  const analysis = useMemo(() => {
    const now = new Date()
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const currentExpenses = transactions.filter((transaction) => {
      const date = new Date(transaction.date)
      return isExpense(transaction) && !Number.isNaN(date.getTime()) && sameMonth(date, now)
    })
    const previousExpenses = transactions.filter((transaction) => {
      const date = new Date(transaction.date)
      return isExpense(transaction) && !Number.isNaN(date.getTime()) && sameMonth(date, previous)
    })

    const currentTotal = currentExpenses.reduce((sum, transaction) => sum + amount(transaction), 0)
    const previousTotal = previousExpenses.reduce((sum, transaction) => sum + amount(transaction), 0)
    const variation = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : null

    const byCategory = new Map<string, number>()
    currentExpenses.forEach((transaction) => {
      const category = transaction.category?.trim() || 'Outros'
      byCategory.set(category, (byCategory.get(category) ?? 0) + amount(transaction))
    })

    const colors: CategoryBreakdownItem['color'][] = ['primary', 'secondary', 'positive', 'warning', 'negative']
    const categories: CategoryBreakdownItem[] = [...byCategory.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([label, value], index) => ({ label, value, color: colors[index] }))

    const top = categories[0]
    const topShare = top && currentTotal > 0 ? Math.round((top.value / currentTotal) * 100) : 0

    return { currentTotal, previousTotal, variation, categories, top, topShare }
  }, [transactions])

  const variationLabel = analysis.variation == null
    ? 'sem base anterior'
    : `${analysis.variation >= 0 ? '+' : ''}${analysis.variation.toFixed(1).replace('.', ',')}%`

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-6 p-4 md:p-6 xl:p-8">
      <div>
        <h1 className="text-[28px] font-bold leading-9 tracking-[-0.5px] text-[var(--color-text-primary)]">Orçamento</h1>
        <p className="mt-1 text-sm leading-5 text-[var(--color-text-secondary)]">
          Entenda o consumo do mês por categoria antes de definir limites personalizados.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 md:gap-[18px]">
        <FinancialMetricCard label="Gasto neste mês" value={brl(analysis.currentTotal)} helper="despesas registradas" />
        <FinancialMetricCard label="Mês anterior" value={brl(analysis.previousTotal)} helper="mesmo recorte mensal" />
        <FinancialMetricCard
          label="Variação"
          value={variationLabel}
          tone={analysis.variation != null && analysis.variation > 0 ? 'negative' : 'positive'}
          helper={analysis.variation == null ? 'adicione mais histórico para comparar' : 'comparado ao mês anterior'}
        />
      </div>

      <SmartAlert
        tone="info"
        title="Limites personalizados ainda não estão configurados"
        description="O Cérebro já consegue mostrar seu consumo real por categoria. A definição e persistência de limites será adicionada quando o contrato de orçamento existir no backend."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <CategoryBreakdownCard items={analysis.categories} />
        <CerebroAICard
          title={analysis.top ? `${analysis.top.label} concentra ${analysis.topShare}% das despesas do mês` : 'Adicione despesas para receber contexto do seu mês'}
          description={analysis.top
            ? `Foram registrados ${brl(analysis.top.value)} nessa categoria. Pergunte ao Cérebro para entender quais movimentações mais contribuíram para esse valor.`
            : 'Quando houver movimentações suficientes, o Cérebro destacará as categorias que mais influenciam seu resultado mensal.'}
          onAction={() => handleRedirect('cérebro')}
        />
      </div>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-5 md:p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Como esta tela evolui</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
          Nesta versão, Orçamento é uma leitura confiável das transações reais. Quando limites por categoria forem persistidos no backend, este mesmo espaço passa a comparar planejado × realizado sem alterar a fonte dos gastos.
        </p>
      </section>
    </div>
  )
}
