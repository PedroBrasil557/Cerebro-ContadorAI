"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  Landmark,
  LineChart as LineChartIcon,
  Lock,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ActiveTab, Investment, Transaction } from "@/types_db";
import {
  calculateExpenses,
  calculateIncome,
} from "@/core/finance/transactionMath";
import { formatCurrency } from "@/lib/utils";
import UpgradeModal from "@/core/components/UpgradeModal";
import { useEntitlements } from "@/core/hooks/useEntitlements";

type ChartType = "area" | "bar";
type Accent = "primary" | "success" | "neutral" | "violet";

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

interface MetricCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: Accent;
  context?: string;
}

const accentStyles: Record<Accent, { icon: string; value: string }> = {
  primary: { icon: "bg-[#4F8CFF]/10 text-[#69A0FF]", value: "text-[#F4F6F8]" },
  success: { icon: "bg-[#28D7A1]/10 text-[#28D7A1]", value: "text-[#F4F6F8]" },
  neutral: { icon: "bg-white/[0.055] text-[#A0A8B5]", value: "text-[#F4F6F8]" },
  violet: { icon: "bg-[#665CFF]/12 text-[#8B84FF]", value: "text-[#F4F6F8]" },
};

function DashboardCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[16px] border border-white/[0.075] bg-[#0D1118] shadow-[0_1px_2px_rgba(0,0,0,0.18)] ${className}`}
    >
      {children}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
  context,
}: MetricCardProps) {
  const styles = accentStyles[accent];
  return (
    <DashboardCard className="flex h-[108px] min-w-0 items-center gap-3 p-4 sm:gap-4 sm:p-5">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${styles.icon}`}
      >
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-[#A0A8B5]">{label}</p>
        <p
          className={`mt-1 truncate text-lg font-bold tracking-[-0.02em] tabular-nums sm:text-[25px] ${styles.value}`}
        >
          {formatCurrency(value || 0)}
        </p>
        {context && (
          <p className="mt-0.5 truncate text-[11px] text-[#A0A8B5]">
            {context}
          </p>
        )}
      </div>
    </DashboardCard>
  );
}

function formatCompactCurrency(value: number) {
  if (value === 0) return "R$ 0";
  if (Math.abs(value) >= 1_000_000)
    return `R$ ${(value / 1_000_000).toFixed(1)} mi`;
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

  const stats = useMemo(() => {
    const now = new Date();
    const monthTransactions = initialTransactions.filter((transaction) => {
      const date = new Date(transaction.date);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });
    const income = calculateIncome(monthTransactions);
    const expense = calculateExpenses(monthTransactions);
    const localBanks =
      typeof window !== "undefined"
        ? (JSON.parse(localStorage.getItem("cerebro_banks") || "[]") as Array<{
            balance?: number;
          }>)
        : [];
    const bankBalance = localBanks.reduce(
      (total, bank) => total + Number(bank.balance ?? 0),
      0,
    );
    const totalInvestments = investments.reduce(
      (total, investment) => total + Number(investment.amount_invested || 0),
      0,
    );
    const score =
      expense > 0
        ? Math.min(Math.round((income / expense) * 100), 100)
        : income > 0
          ? 100
          : 0;
    const balance = initialSummary.balance + bankBalance;
    return {
      income,
      expense,
      totalInvestments,
      score,
      balance,
      patrimony: balance + totalInvestments,
      monthCount: monthTransactions.length,
    };
  }, [initialTransactions, initialSummary.balance, investments]);

  const flowData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, index) => ({
      label: new Date(selectedYear, index, 1).toLocaleDateString("pt-BR", {
        month: "short",
      }),
      receita: 0,
      despesa: 0,
    }));
    initialTransactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      if (date.getFullYear() !== selectedYear) return;
      const amount = Math.abs(Number(transaction.amount || 0));
      if (transaction.type === "receita")
        months[date.getMonth()].receita += amount;
      else if (
        transaction.type === "despesa_fixa" ||
        transaction.type === "despesa_variavel"
      )
        months[date.getMonth()].despesa += amount;
    });
    return months;
  }, [initialTransactions, selectedYear]);

  const hasFlowHistory = flowData.some(
    (month) => month.receita > 0 || month.despesa > 0,
  );
  const displayedTransactions = recentTransactions.slice(0, 5);
  const baseLabel = `${stats.monthCount} ${stats.monthCount === 1 ? "lançamento" : "lançamentos"}`;
  const healthStatus =
    stats.monthCount === 0
      ? "Sem dados neste mês"
      : stats.income === 0 && stats.expense > 0
        ? "Sem cobertura neste mês"
        : stats.expense === 0 && stats.income > 0
          ? "Sem despesas registradas"
          : stats.score >= 100
            ? "Despesas cobertas"
            : "Cobertura parcial";
  const gaugeColor =
    stats.score >= 100 ? "#28D7A1" : stats.score >= 50 ? "#4F8CFF" : "#FF5876";
  const circumference = Math.PI * 50;
  const gaugeOffset = circumference - (circumference * stats.score) / 100;

  return (
    <div className="-m-4 min-h-[calc(100vh-6rem)] bg-[#07090D] p-4 text-[#F4F6F8] md:-m-8 md:p-8">
      <div className="mx-auto w-full max-w-[1480px] space-y-4">
        <header className="flex min-h-[68px] items-center">
          <div>
            <h1 className="text-[26px] font-bold tracking-[-0.025em] text-[#F4F6F8]">
              Painel Central
            </h1>
            <p className="mt-1 text-sm text-[#A0A8B5]">
              Seu panorama financeiro de hoje.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <MetricCard
            label="Saldo em conta"
            value={stats.balance}
            icon={Wallet}
            accent="primary"
            context={stats.monthCount === 0 ? "Sem movimentação" : undefined}
          />
          <MetricCard
            label="Entradas no mês"
            value={stats.income}
            icon={ArrowUpRight}
            accent="success"
            context={stats.income === 0 ? "Sem movimentação" : undefined}
          />
          <MetricCard
            label="Investimentos"
            value={stats.totalInvestments}
            icon={TrendingUp}
            accent="neutral"
            context={
              stats.totalInvestments === 0 ? "Sem investimentos" : undefined
            }
          />
          <MetricCard
            label="Patrimônio"
            value={stats.patrimony}
            icon={Activity}
            accent="violet"
            context={
              !hasFlowHistory ? "Histórico ainda em formação" : undefined
            }
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-12">
          <DashboardCard className="flex h-[320px] min-w-0 flex-col p-4 sm:p-5 xl:col-span-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">Fluxo de caixa</h2>
                <p className="mt-0.5 text-xs text-[#A0A8B5]">
                  Receitas e despesas em {selectedYear}
                </p>
              </div>
              <div className="flex rounded-[10px] border border-white/[0.075] bg-[#080B11] p-1">
                <button
                  type="button"
                  aria-label="Exibir gráfico de linhas"
                  aria-pressed={chartType === "area"}
                  onClick={() => setChartType("area")}
                  className={`flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors duration-150 ${chartType === "area" ? "bg-white/[0.08] text-white" : "text-[#A0A8B5] hover:text-white"}`}
                >
                  <LineChartIcon aria-hidden="true" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Exibir gráfico de barras"
                  aria-pressed={chartType === "bar"}
                  onClick={() => setChartType("bar")}
                  className={`flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors duration-150 ${chartType === "bar" ? "bg-white/[0.08] text-white" : "text-[#A0A8B5] hover:text-white"}`}
                >
                  <BarChart3 aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="relative mt-3 min-h-0 flex-1">
              <ResponsiveContainer
                width="100%"
                height="100%"
                initialDimension={{ width: 760, height: 240 }}
              >
                {chartType === "area" ? (
                  <AreaChart
                    data={flowData}
                    margin={{ top: 8, right: 4, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.055)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      stroke="#A0A8B5"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={8}
                    />
                    <YAxis
                      stroke="#A0A8B5"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatCompactCurrency}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        backgroundColor: "#111722",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                        color: "#F4F6F8",
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "#A0A8B5" }}
                    />
                    <Area
                      type="monotone"
                      name="Receitas"
                      dataKey="receita"
                      stroke="#28D7A1"
                      fill="#28D7A1"
                      fillOpacity={0.055}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      name="Despesas"
                      dataKey="despesa"
                      stroke="#FF5876"
                      fill="#FF5876"
                      fillOpacity={0.045}
                      strokeWidth={2}
                    />
                  </AreaChart>
                ) : (
                  <BarChart
                    data={flowData}
                    margin={{ top: 8, right: 4, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.055)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      stroke="#A0A8B5"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={8}
                    />
                    <YAxis
                      stroke="#A0A8B5"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatCompactCurrency}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        backgroundColor: "#111722",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                        color: "#F4F6F8",
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "#A0A8B5" }}
                    />
                    <Bar
                      name="Receitas"
                      dataKey="receita"
                      fill="#28D7A1"
                      radius={[3, 3, 0, 0]}
                    />
                    <Bar
                      name="Despesas"
                      dataKey="despesa"
                      fill="#FF5876"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
              {!hasFlowHistory && (
                <p className="pointer-events-none absolute inset-x-0 bottom-5 text-center text-xs text-[#A0A8B5]">
                  Histórico ainda em formação
                </p>
              )}
              <p className="sr-only">
                Em {selectedYear}, o gráfico mostra somente as receitas e
                despesas registradas pelo usuário.
              </p>
            </div>
          </DashboardCard>

          <DashboardCard className="h-[320px] p-5 xl:col-span-4">
            {isFreePlan ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#665CFF]/10 text-[#8B84FF]">
                  <Lock aria-hidden="true" className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-base font-semibold">
                  Saúde financeira
                </h2>
                <p className="mt-2 max-w-xs text-sm leading-5 text-[#A0A8B5]">
                  A cobertura detalhada das despesas está disponível no plano
                  PRO.
                </p>
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(true)}
                  className="mt-5 min-h-11 rounded-[10px] bg-[#665CFF] px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#756CFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B84FF]"
                >
                  Conhecer o PRO
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-base font-semibold">Saúde financeira</h2>
                <div className="mt-2 flex justify-center">
                  <div className="relative h-[82px] w-[140px]">
                    <svg
                      viewBox="0 0 120 70"
                      className="h-full w-full"
                      role="img"
                      aria-label={`Cobertura das despesas: ${stats.score}%`}
                    >
                      <path
                        d="M 10 60 A 50 50 0 0 1 110 60"
                        fill="none"
                        stroke="rgba(255,255,255,0.075)"
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 10 60 A 50 50 0 0 1 110 60"
                        fill="none"
                        stroke={gaugeColor}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={gaugeOffset}
                      />
                    </svg>
                    <span className="absolute inset-x-0 bottom-0 text-center text-2xl font-bold tabular-nums">
                      {stats.score}%
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-center text-xs text-[#A0A8B5]">
                  Cobertura das despesas
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/[0.075] pt-4">
                  <div>
                    <dt className="text-[11px] text-[#A0A8B5]">Receitas</dt>
                    <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-[#28D7A1]">
                      {formatCurrency(stats.income)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-[#A0A8B5]">Despesas</dt>
                    <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-[#FF5876]">
                      {formatCurrency(stats.expense)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-[#A0A8B5]">
                      Base analisada
                    </dt>
                    <dd className="mt-0.5 text-sm font-medium">{baseLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-[#A0A8B5]">Status</dt>
                    <dd className="mt-0.5 text-sm font-medium text-[#A0A8B5]">
                      {healthStatus}
                    </dd>
                  </div>
                </dl>
              </>
            )}
          </DashboardCard>
        </div>

        <div className="grid gap-4 xl:grid-cols-12">
          <DashboardCard className="min-h-[212px] overflow-hidden xl:col-span-7">
            <div className="flex h-14 items-center justify-between border-b border-white/[0.075] px-5">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Receipt
                  aria-hidden="true"
                  className="h-4 w-4 text-[#69A0FF]"
                />
                Movimentações recentes
              </h2>
              <button
                type="button"
                onClick={() => onNavigate("transações")}
                className="min-h-11 text-xs font-medium text-[#A0A8B5] transition-colors duration-150 hover:text-white"
              >
                Ver detalhes
              </button>
            </div>
            <div className="px-2 py-1">
              {displayedTransactions.length === 0 ? (
                <div className="flex min-h-[150px] flex-col items-center justify-center px-4 text-center">
                  <p className="text-sm font-medium text-[#A0A8B5]">
                    Nenhuma movimentação recente
                  </p>
                  <p className="mt-1 text-xs text-[#A0A8B5]">
                    Seus lançamentos aparecerão aqui.
                  </p>
                </div>
              ) : (
                displayedTransactions.map((transaction) => {
                  const income = transaction.type === "receita";
                  return (
                    <div
                      key={transaction.id}
                      className="flex h-8 items-center justify-between gap-3 rounded-[9px] px-3 transition-colors duration-150 hover:bg-white/[0.035]"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] ${income ? "bg-[#28D7A1]/10 text-[#28D7A1]" : "bg-[#FF5876]/10 text-[#FF5876]"}`}
                        >
                          {income ? (
                            <ArrowUpRight
                              aria-hidden="true"
                              className="h-3.5 w-3.5"
                            />
                          ) : (
                            <ArrowDownRight
                              aria-hidden="true"
                              className="h-3.5 w-3.5"
                            />
                          )}
                        </span>
                        <p className="truncate text-sm font-medium">
                          {transaction.description}
                          <span className="ml-2 hidden text-[11px] font-normal text-[#A0A8B5] sm:inline">
                            {transaction.category}
                          </span>
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-semibold tabular-nums ${income ? "text-[#28D7A1]" : "text-[#F4F6F8]"}`}
                      >
                        {income ? "+" : "−"}{" "}
                        {formatCurrency(
                          Math.abs(Number(transaction.amount) || 0),
                        )}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </DashboardCard>

          <DashboardCard className="flex min-h-[212px] flex-col justify-between p-5 xl:col-span-5">
            <div>
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#665CFF]/10 text-[#8B84FF]">
                {isFreePlan ? (
                  <Lock aria-hidden="true" className="h-5 w-5" />
                ) : (
                  <Landmark aria-hidden="true" className="h-5 w-5" />
                )}
              </span>
              <h2 className="mt-4 text-base font-semibold">
                Central de Dívidas
              </h2>
              <p className="mt-1 max-w-md text-sm leading-5 text-[#A0A8B5]">
                {isFreePlan
                  ? "Organize um plano de quitação com os recursos do Cérebro PRO."
                  : "Organize e acompanhe seu plano de quitação."}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                isFreePlan
                  ? setShowUpgradeModal(true)
                  : onNavigate("central de dividas")
              }
              className="mt-5 flex min-h-11 items-center justify-between rounded-[10px] border border-white/[0.09] bg-[#111722] px-4 text-sm font-semibold transition-colors duration-150 hover:border-white/[0.16] hover:bg-[#151C29] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B84FF]"
            >
              <span>
                {isFreePlan ? "Conhecer o PRO" : "Abrir Central de Dívidas"}
              </span>
              <ChevronRight
                aria-hidden="true"
                className="h-4 w-4 text-[#8B84FF]"
              />
            </button>
          </DashboardCard>
        </div>
      </div>
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}
