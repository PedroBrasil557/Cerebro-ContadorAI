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
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)

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
    <aside aria-label="Contexto das transações" className="hidden w-[346px] space-y-4 xl:block">
      <section className="min-h-[202px] rounded-[20px] border border-[var(--color-card-accent-border)] bg-[var(--color-card-accent-fill)] p-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-primary)]">
          <Sparkles aria-hidden="true" className="h-4 w-4 text-[var(--color-action-ai)]" />
          Insight do Cérebro
        </div>
        <h2 className="mt-5 text-[20px] font-semibold leading-7 tracking-[-0.02em] text-[var(--color-text-primary)]">{context.insight.title}</h2>
        <p className="mt-2 text-xs leading-[18px] text-[var(--color-text-secondary)]">{context.insight.evidence}</p>
      </section>

      <section className="min-h-[212px] rounded-[18px] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-5" aria-labelledby="transactions-period-summary">
        <h2 id="transactions-period-summary" className="text-base font-semibold text-[var(--color-text-primary)]">Resumo do período</h2>
        <p className="mt-1 text-[10px] capitalize text-[var(--color-text-helper)]">{currentMonthLabel} · saídas realizadas</p>

        {context.categories.length ? (
          <div className="mt-4 divide-y divide-[var(--color-card-border)]">
            {context.categories.slice(0, 3).map((category) => (
              <div key={category.category} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2.5 py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-action-ghost-hover)] text-[10px] font-semibold text-[var(--color-text-secondary)]">{category.category.charAt(0).toLocaleUpperCase('pt-BR')}</span>
                  <span className="truncate text-xs text-[var(--color-text-secondary)]">{category.category}</span>
                </div>
                <span className="text-xs font-semibold tabular-nums text-[var(--color-text-primary)]">{formatCurrency(category.amount)}</span>
                <span className="w-9 text-right text-[10px] tabular-nums text-[var(--color-text-helper)]">{category.share.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        ) : <p className="mt-4 rounded-xl bg-[var(--color-action-ghost-hover)] px-3 py-4 text-xs text-[var(--color-text-helper)]">Nenhuma saída realizada para distribuir por categoria.</p>}
      </section>

      <section className="rounded-[18px] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-5" aria-labelledby="transactions-context-title">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-helper)]">Contexto</p>
        <h2 id="transactions-context-title" className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">Situação das movimentações</h2>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[['Realizadas', realizedCount], ['Pendentes', pendingCount], ['Transfer.', transferCount]].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl bg-[var(--color-action-ghost-hover)] px-2 py-3">
              <dt className="text-[9px] text-[var(--color-text-helper)]">{label}</dt>
              <dd className="mt-1 text-sm font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-[18px] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]"><FileText aria-hidden="true" className="h-4 w-4 text-[var(--color-text-helper)]" />Relatório do período</div>
        <p className="mt-2 text-xs leading-[18px] text-[var(--color-text-secondary)]">Exporte as transações filtradas em PDF quando precisar revisar fora do Cérebro.</p>
        <Button type="button" variant="ghost" size="sm" onClick={onExportPDF} className="mt-3 gap-2 px-0 text-[var(--color-nav-active-text)] hover:bg-transparent"><Download aria-hidden="true" className="h-4 w-4" />{isFreePlan ? 'Relatório PDF (PRO)' : 'Exportar PDF'}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Button>
      </section>
    </aside>
  )
}
