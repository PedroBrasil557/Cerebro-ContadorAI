"use client";

import React, { useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { BarChart3, ChevronRight, Landmark, LineChart as LineChartIcon, Lock, TrendingUp } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ActiveTab, Investment, Transaction } from "@/types_db";
import {
  calculateRealizedExpenses,
  calculateRealizedIncome,
  isRealizedTransaction,
} from "@/core/finance/transactionMath";
import { formatCurrency } from "@/lib/utils";
import UpgradeModal from "@/core/components/UpgradeModal";
import { useEntitlements } from "@/core/hooks/useEntitlements";
import { BalanceCard } from "@/core/finance-ui/BalanceCard";
import { FinancialMetricCard } from "@/core/finance-ui/FinancialMetricCard";
import { FinancialHealth } from "@/core/finance-ui/FinancialHealth";
import { SmartAlert } from "@/core/finance-ui/SmartAlert";
import { TransactionRow } from "@/core/finance-ui/TransactionRow";
import { Button } from "@/core/ui/button";

type ChartType = "area" | "bar";

interface DashboardViewProps {
  summary: {
    balance: number;
    income: number;
    expense: number;
    emergencyTotal: number;
  };
  recentTransactions: Transaction[];
  onNavigate: (tab: ActiveTab) => void;
  transactions: Transaction[];
  investments: Investment[];
}

function formatCompactCurrency(value: number) {
  if (value === 0) return "R$ 0";
  if (Math.abs(value) >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)} mi`;
  if (Math.abs(value) >= 1_000) return `R$ ${(value / 1_000).toFixed(1)} mil`;
  return `R$ ${Math.round(value)}`;
}

export default function DashboardView({
  summary: initialSummary,
  recentTransactions,
  onNavigate,
  transactions: initialTransactions = [],
  investments = [],
}: DashboardViewProps) {
  const [chartType, setChartType] = useState<ChartType>("area");
  const [selectedYear] = useState(new Date().getFullYear());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { plan } = useEntitlements();
  const isFreePlan = plan === "free";
  const reduceMotion = useReducedMotion();

  const stats = useMemo(() => {
    const now = new Date();
    const monthTransactions = initialTransactions.filter((transaction) => {
      const date = new Date(transaction.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    const income = calculateRealizedIncome(monthTransactions);
    const expense = calculateRealizedExpenses(monthTransactions);
    const totalInvestments = investments.reduce(
      (total, investment) => total + Number(investment.amount_invested || 0),
      0,
    );
    const score = expense > 0 ? Math.min(Math.round((income / expense) * 100), 100) : income > 0 ? 100 : 0;
    const balance = initialSummary.balance;
    return {
      income,
      expense,
      totalInvestments,
      score,
      balance,
      patrimony: balance + totalInvestments,
      monthCount: monthTransactions.length,
      realizedMonthCount: monthTransactions.filter(isRealizedTransaction).length,
    };
  }, [initialTransactions, initialSummary.balance, investments]);

  const flowData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, index) => ({
      label: new Date(selectedYear, index, 1).toLocaleDateString("pt-BR", { month: "short" }),
      receita: 0,
      despesa: 0,
    }));
    initialTransactions.forEach((transaction) => {
      if (!isRealizedTransaction(transaction)) return;
      const date = new Date(transaction.date);
      if (date.getFullYear() !== selectedYear) return;
      const amount = Math.abs(Number(transaction.amount || 0));
      if (transaction.type === "receita") months[date.getMonth()].receita += amount;
      else if (transaction.type === "despesa_fixa" || transaction.type === "despesa_variavel") {
        months[date.getMonth()].despesa += amount;
      }
    });
    return months;
  }, [initialTransactions, selectedYear]);

  const hasFlowHistory = flowData.some((month) => month.receita > 0 || month.despesa > 0);
  const displayedTransactions = recentTransactions.slice(0, 5);
  const healthState = stats.score >= 100 ? "healthy" : stats.score >= 50 ? "attention" : "critical";
  const healthDescription =
    stats.realizedMonthCount === 0
      ? "Registre ou confirme movimentações realizadas para acompanhar sua cobertura financeira mensal."
      : stats.score >= 100
        ? "As receitas realizadas no mês cobrem as despesas realizadas até agora."
        : "As despesas realizadas estão acima da cobertura atual das receitas realizadas no mês.";

  return (
    <div className="min-h-full bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)]">
      <div className="mx-auto w-full max-w-[1180px] space-y-6 px-4 py-5 sm:px-6 md:py-7 lg:px-8">
        <header>
          <h1 className="text-2xl font-bold tracking-[-0.02em] md:text-[28px]">Visão geral</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Seu panorama financeiro em um só lugar.</p>
        </header>

        {!hasFlowHistory ? (
          <SmartAlert
            tone="info"
            title="Seu histórico realizado ainda está em formação"
            description="Continue registrando e confirmando movimentações para tornar os indicadores e o fluxo de caixa mais completos."
            actionLabel="Ver transações"
            onAction={() => onNavigate("transações")}
          />
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)]">
          <BalanceCard
            total={stats.patrimony}
            available={stats.balance}
            invested={stats.totalInvestments}
            description="Saldo realizado disponível somado aos investimentos registrados"
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <FinancialMetricCard
              label="Investimentos"
              value={formatCurrency(stats.totalInvestments)}
              helper={stats.totalInvestments === 0 ? "Sem investimentos registrados" : "Total investido"}
              tone="neutral"
            />
            <FinancialMetricCard
              label="Lançamentos neste mês"
              value={stats.monthCount}
              helper={stats.monthCount === 1 ? "movimentação registrada" : "movimentações registradas"}
              tone="neutral"
            />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <FinancialMetricCard label="Saldo disponível" value={formatCurrency(stats.balance)} helper="Somente movimentações realizadas" />
          <FinancialMetricCard label="Receitas realizadas" value={formatCurrency(stats.income)} helper="Neste mês" tone="positive" />
          <FinancialMetricCard label="Despesas realizadas" value={formatCurrency(stats.expense)} helper="Neste mês" tone="negative" />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
          <article className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-5 md:p-[22px]">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">Fluxo de caixa realizado</h2>
                <p className="mt-1 text-xs text-[var(--color-text-helper)]">Receitas e despesas confirmadas em {selectedYear}</p>
              </div>
              <div className="flex rounded-[var(--radius-sm)] bg-[var(--color-action-ghost-hover)] p-1" aria-label="Formato do gráfico">
                <Button
                  variant={chartType === "area" ? "secondary" : "ghost"}
                  size="icon-sm"
                  aria-label="Gráfico de linhas"
                  aria-pressed={chartType === "area"}
                  onClick={() => setChartType("area")}
                >
                  <LineChartIcon className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant={chartType === "bar" ? "secondary" : "ghost"}
                  size="icon-sm"
                  aria-label="Gráfico de barras"
                  aria-pressed={chartType === "bar"}
                  onClick={() => setChartType("bar")}
                >
                  <BarChart3 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--color-text-helper)]" aria-label="Legenda do fluxo de caixa">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-chart-primary)]" aria-hidden="true" />
                Receitas
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-chart-secondary)]" aria-hidden="true" />
                Despesas
              </span>
            </div>

            <div className="h-[280px] w-full" role="img" aria-label={`Fluxo de caixa realizado de ${selectedYear}: receitas e despesas por mês`}>
              {hasFlowHistory ? (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "area" ? (
                    <AreaChart accessibilityLayer data={flowData} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid stroke="var(--color-chart-grid)" vertical={false} />
                      <XAxis dataKey="label" stroke="var(--color-chart-axis)" tickLine={false} axisLine={false} fontSize={11} />
                      <YAxis stroke="var(--color-chart-axis)" tickLine={false} axisLine={false} fontSize={11} tickFormatter={formatCompactCurrency} width={72} />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value ?? 0))}
                        contentStyle={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-md)", color: "var(--color-text-primary)" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="receita"
                        name="Receitas"
                        stroke="var(--color-chart-primary)"
                        fill="var(--color-chart-primary)"
                        fillOpacity={0.12}
                        strokeWidth={2}
                        isAnimationActive={!reduceMotion}
                        animationDuration={240}
                        animationEasing="ease-out"
                      />
                      <Area
                        type="monotone"
                        dataKey="despesa"
                        name="Despesas"
                        stroke="var(--color-chart-secondary)"
                        fill="var(--color-chart-secondary)"
                        fillOpacity={0.08}
                        strokeWidth={2}
                        isAnimationActive={!reduceMotion}
                        animationDuration={240}
                        animationEasing="ease-out"
                      />
                    </AreaChart>
                  ) : (
                    <BarChart accessibilityLayer data={flowData} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid stroke="var(--color-chart-grid)" vertical={false} />
                      <XAxis dataKey="label" stroke="var(--color-chart-axis)" tickLine={false} axisLine={false} fontSize={11} />
                      <YAxis stroke="var(--color-chart-axis)" tickLine={false} axisLine={false} fontSize={11} tickFormatter={formatCompactCurrency} width={72} />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value ?? 0))}
                        contentStyle={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-md)", color: "var(--color-text-primary)" }}
                      />
                      <Bar
                        dataKey="receita"
                        name="Receitas"
                        fill="var(--color-chart-primary)"
                        radius={[5, 5, 0, 0]}
                        isAnimationActive={!reduceMotion}
                        animationDuration={240}
                        animationEasing="ease-out"
                      />
                      <Bar
                        dataKey="despesa"
                        name="Despesas"
                        fill="var(--color-chart-secondary)"
                        radius={[5, 5, 0, 0]}
                        isAnimationActive={!reduceMotion}
                        animationDuration={240}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-action-ghost-hover)] px-6 text-center text-sm text-[var(--color-text-helper)]">
                  Ainda não há movimentações realizadas suficientes para visualizar o fluxo anual.
                </div>
              )}
            </div>
          </article>

          {isFreePlan ? (
            <article className="flex min-h-[300px] flex-col justify-between rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-5 md:p-[22px]">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium"><Lock className="h-4 w-4 text-[var(--color-nav-active-text)]" aria-hidden="true" />Saúde financeira</div>
                <h3 className="mt-6 text-xl font-semibold">Acompanhe sua cobertura financeira</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">O indicador detalhado está disponível no plano PRO.</p>
              </div>
              <Button variant="secondary" onClick={() => setShowUpgradeModal(true)}>Conhecer PRO</Button>
            </article>
          ) : (
            <FinancialHealth
              score={stats.score}
              state={healthState}
              description={healthDescription}
              liquidity={stats.balance >= 0 ? "Positiva" : "Negativa"}
              reserve={initialSummary.emergencyTotal > 0 ? formatCurrency(initialSummary.emergencyTotal) : "Sem reserva"}
            />
          )}
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Movimentações recentes</h2>
              <p className="mt-1 text-xs text-[var(--color-text-helper)]">Seus últimos lançamentos registrados</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("transações")}>Ver todas <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" /></Button>
          </div>
          {displayedTransactions.length ? (
            <div className="space-y-2">
              {displayedTransactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)}
            </div>
          ) : (
            <div className="rounded-[var(--radius-md)] bg-[var(--color-action-ghost-hover)] px-4 py-8 text-center text-sm text-[var(--color-text-helper)]">Nenhuma movimentação recente.</div>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-status-info-surface)] text-[var(--color-status-info)]"><TrendingUp className="h-5 w-5" aria-hidden="true" /></span>
              <div><h2 className="font-semibold">Investimentos</h2><p className="text-xs text-[var(--color-text-helper)]">Patrimônio investido registrado</p></div>
            </div>
            <p className="mt-5 text-2xl font-semibold">{formatCurrency(stats.totalInvestments)}</p>
          </article>
          <article className="rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-action-ghost-hover)] text-[var(--color-text-secondary)]"><Landmark className="h-5 w-5" aria-hidden="true" /></span>
              <div><h2 className="font-semibold">Central de Dívidas</h2><p className="text-xs text-[var(--color-text-helper)]">Acompanhe compromissos e organização de dívidas</p></div>
            </div>
            <Button className="mt-5" variant="secondary" onClick={() => (isFreePlan ? setShowUpgradeModal(true) : onNavigate("central de dividas"))}>
              {isFreePlan ? <><Lock className="mr-2 h-4 w-4" aria-hidden="true" />Recurso PRO</> : "Abrir Central de Dívidas"}
            </Button>
          </article>
        </section>
      </div>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
}
