'use client'

import { ArrowRight, Download, FileText, Sparkles } from 'lucide-react'
import type { TransactionPeriodContext } from '@/core/finance/transactionInsights'
import { Button } from '@/core/ui/button'

interface TransactionContextRailProps {
  context: TransactionPeriodContext
  currentMonthLabel: string
  realizedCount: number
  pendingCount: number
  transferCount: number
  isFreePlan: boolean
  onExportPDF: () => void
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export default function TransactionContextRail({
  context,
  currentMonthLabel,
  realizedCount,
  pendingCount,
  transferCount,
  isFreePlan,
  onExportPDF,
}: TransactionContextRailProps) {
  return (
    <aside aria-label="Contexto das transações" className="hidden space-y-4 xl:block">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-action-ai)]">
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          Insight do Cérebro
        </div>
        <h2 className="mt-4 text-lg font-semibold leading-7 text-[var(--color-text-primary)]">
          {context.insight.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
          {context.insight.evidence}
        </p>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-5" aria-labelledby="transactions-period-summary">
        <h2 id="transactions-period-summary" className="text-base font-semibold text-[var(--color-text-primary)]">Resumo do período</h2>
        <p className="mt-1 text-xs capitalize text-[var(--color-text-helper)]">{currentMonthLabel} · saídas realizadas</p>

        {context.categories.length ? (
          <div className="mt-4 divide-y divide-[var(--color-card-border)]">
            {context.categories.map((category) => (
              <div key={category.category} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-action-ghost-hover)] text-[10px] font-semibold text-[var(--color-text-secondary)]">
                    {category.category.charAt(0).toLocaleUpperCase('pt-BR')}
                  </span>
                  <span className="truncate text-sm text-[var(--color-text-secondary)]">{category.category}</span>
                </div>
                <span className="text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">{formatCurrency(category.amount)}</span>
                <span className="w-10 text-right text-xs tabular-nums text-[var(--color-text-helper)]">{category.share.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-action-ghost-hover)] px-3 py-4 text-sm text-[var(--color-text-helper)]">
            Nenhuma saída realizada para distribuir por categoria.
          </p>
        )}
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-5" aria-labelledby="transactions-context-title">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-helper)]">Contexto</p>
        <h2 id="transactions-context-title" className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">Situação das movimentações</h2>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-[var(--radius-md)] bg-[var(--color-action-ghost-hover)] px-2 py-3">
            <dt className="text-[10px] text-[var(--color-text-helper)]">Realizadas</dt>
            <dd className="mt-1 text-base font-semibold tabular-nums">{realizedCount}</dd>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[var(--color-action-ghost-hover)] px-2 py-3">
            <dt className="text-[10px] text-[var(--color-text-helper)]">Pendentes</dt>
            <dd className="mt-1 text-base font-semibold tabular-nums">{pendingCount}</dd>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[var(--color-action-ghost-hover)] px-2 py-3">
            <dt className="text-[10px] text-[var(--color-text-helper)]">Transfer.</dt>
            <dd className="mt-1 text-base font-semibold tabular-nums">{transferCount}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
          <FileText aria-hidden="true" className="h-4 w-4 text-[var(--color-text-helper)]" />
          Relatório do período
        </div>
        <p className="mt-2 text-sm leading-5 text-[var(--color-text-secondary)]">
          Exporte as transações filtradas em PDF quando precisar revisar fora do Cérebro.
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={onExportPDF} className="mt-3 gap-2 px-0 text-[var(--color-nav-active-text)] hover:bg-transparent">
          <Download aria-hidden="true" className="h-4 w-4" />
          {isFreePlan ? 'Relatório PDF (PRO)' : 'Exportar PDF'}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Button>
      </section>
    </aside>
  )
}
