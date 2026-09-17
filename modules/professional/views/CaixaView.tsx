'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Briefcase, Calculator, FileText, Loader2, Plus, Settings2, ShieldCheck, Sparkles, Target, Wallet, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { businessFinanceService } from '@/services/businessFinanceService'
import { summarizeBusinessFinance } from '@/lib/business/finance'
import { formatCurrency } from '@/lib/utils'
import { cfoEngine, type BusinessMetrics } from '@/modules/cfo/cfoEngine'
import { cfoRulesEngine } from '@/modules/cfo/cfoRulesEngine'
import { cfoSimulator } from '@/modules/cfo/cfoSimulator'
import type { BusinessSettings, BusinessWorkspace, Transaction } from '@/types_db'

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-3xl border border-white/[0.07] bg-[#09090b]/70 shadow-2xl backdrop-blur-xl ${className}`}>{children}</div>
)

function SimulatorWidget({ metrics }: { metrics: BusinessMetrics }) {
  const [monthlyContribution, setMonthlyContribution] = useState(0)
  const [months, setMonths] = useState(6)
  const simulation = useMemo(() => cfoSimulator.runSimulation(metrics, {
    cashInjection: monthlyContribution * months,
  }), [metrics, monthlyContribution, months])

  return (
    <Card className="flex h-full flex-col justify-between p-6 md:p-8">
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Settings2 className="text-emerald-400" size={20} />
          <h3 className="text-lg font-bold text-white">Simulador estratégico</h3>
        </div>
        <p className="mb-6 text-xs leading-relaxed text-gray-400">
          Hipótese educativa de aportes ao caixa. Não representa garantia de resultado.
        </p>
        <div className="space-y-6">
          <label className="block space-y-3">
            <span className="flex justify-between text-[10px] font-bold uppercase text-gray-500">
              <span>Aporte mensal hipotético</span>
              <span className="font-mono text-emerald-400">{formatCurrency(monthlyContribution)}</span>
            </span>
            <input type="range" min="0" max="5000" step="100" value={monthlyContribution} onChange={(event) => setMonthlyContribution(Number(event.target.value))} className="w-full accent-emerald-500" />
          </label>
          <label className="block space-y-3">
            <span className="flex justify-between text-[10px] font-bold uppercase text-gray-500">
              <span>Período da hipótese</span>
              <span className="font-mono text-white">{months} meses</span>
            </span>
            <input type="range" min="1" max="24" step="1" value={months} onChange={(event) => setMonths(Number(event.target.value))} className="w-full accent-blue-500" />
          </label>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/5 bg-black/40 p-4">
          <p className="text-[10px] font-bold uppercase text-gray-400">Indicador financeiro projetado</p>
          <p className="mt-1 text-2xl font-black text-white">{simulation.projectedScore}<span className="ml-1 text-xs text-gray-500">/100</span></p>
          <p className="text-[10px] text-gray-500">Regra interna, variação {simulation.scoreImpact >= 0 ? '+' : ''}{simulation.scoreImpact}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/30 p-4">
          <p className="text-[10px] font-bold uppercase text-emerald-200">Fôlego de caixa projetado</p>
          <p className="mt-1 text-2xl font-black text-white">{simulation.projectedRunway === null ? 'Dados insuficientes' : `${simulation.projectedRunway.toFixed(1)} meses`}</p>
        </div>
      </div>
      <p className="mt-4 text-[10px] leading-relaxed text-gray-500">
        Dados usados: receitas, despesas e saldo registrados. Limitações: não considera demanda futura nem eventos não cadastrados.
      </p>
    </Card>
  )
}

export default function CaixaView() {
  const [workspace, setWorkspace] = useState<BusinessWorkspace | null>(null)
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [type, setType] = useState<'receita' | 'despesa_variavel'>('receita')
  const [form, setForm] = useState({ description: '', amount: '', category: 'Geral' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await businessFinanceService.getDashboardData()
      setWorkspace(data.workspace)
      setSettings(data.settings)
      setTransactions(data.transactions)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível carregar o financeiro.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const confirmedTaxRate = workspace?.tax_rate_confirmed_at
    ? workspace.tax_rate
    : settings?.tax_rate_confirmed_at
      ? settings.tax_rate
      : null
  const summary = useMemo(() => summarizeBusinessFinance(transactions, {
    taxRate: confirmedTaxRate,
    monthlyGoal: settings?.monthly_goal ?? null,
  }), [confirmedTaxRate, settings?.monthly_goal, transactions])
  const openingBalance = Number.isFinite(Number(settings?.current_balance)) ? Number(settings?.current_balance) : 0
  const currentBalance = openingBalance + summary.balance
  const metrics = useMemo<BusinessMetrics>(() => ({
    revenue: summary.revenue,
    expenses: summary.expenses,
    cashReserve: Math.max(currentBalance, 0),
    taxRate: confirmedTaxRate,
    activeClients: 0,
    totalHoursWorked: 0,
  }), [confirmedTaxRate, currentBalance, summary.expenses, summary.revenue])
  const { score: financialIndicator, alerts } = useMemo(() => cfoRulesEngine.evaluateHealth(metrics), [metrics])
  const runway = useMemo(() => cfoEngine.calculateRunway(metrics.cashReserve, metrics.expenses), [metrics])
  const safeDraw = useMemo(
    () => confirmedTaxRate === null ? null : cfoRulesEngine.calculateSafeDraw(metrics),
    [confirmedTaxRate, metrics],
  )

  const analyze = async () => {
    setAnalyzing(true)
    try {
      const response = await fetch('/api/cfo-analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const result = await response.json() as { analysis?: string; error?: { message?: string } }
      if (!response.ok || !result.analysis) throw new Error(result.error?.message ?? 'Falha na análise.')
      setAnalysis(result.analysis)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível gerar a análise.')
    } finally {
      setAnalyzing(false)
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await businessFinanceService.createTransaction({
        description: form.description,
        amount: Number(form.amount),
        type,
        category: form.category,
      })
      setModalOpen(false)
      setForm({ description: '', amount: '', category: 'Geral' })
      await load()
      toast.success('Lançamento salvo.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 p-4 pb-32 md:p-10">
      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-black text-white md:text-4xl">Financeiro do negócio</h1>
          <p className="mt-2 text-sm text-gray-400">Receitas, despesas e indicadores do ambiente {workspace?.name ?? 'profissional'}.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white"><Plus size={16}/> Novo lançamento</button>
          <button onClick={analyze} disabled={analyzing} className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-bold text-black disabled:opacity-50">{analyzing ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>} Análise do negócio com IA</button>
        </div>
      </header>

      {analysis && <Card className="p-6"><div className="mb-3 flex items-center justify-between text-sm font-bold text-indigo-300"><span className="flex items-center gap-2"><Briefcase size={16}/> Análise educativa</span><button onClick={() => setAnalysis(null)} aria-label="Fechar"><X size={16}/></button></div><p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">{analysis}</p></Card>}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: 'Receitas observadas', value: formatCurrency(summary.revenue), icon: ArrowUpRight },
          { label: 'Despesas observadas', value: formatCurrency(summary.expenses), icon: ArrowDownRight },
          { label: 'Retirada estimada', value: safeDraw === null ? 'Dados insuficientes' : formatCurrency(safeDraw), icon: Wallet },
          { label: 'Fôlego de caixa', value: runway === null ? 'Dados insuficientes' : `${runway.toFixed(1)} meses`, icon: Activity },
          { label: 'Reserva para impostos', value: summary.taxReserve === null ? 'Não configurada' : formatCurrency(summary.taxReserve), icon: Calculator },
          { label: 'Indicador financeiro', value: `${financialIndicator}/100`, icon: ShieldCheck },
        ].map(({ label, value, icon: Icon }) => <Card key={label} className="p-5"><Icon className="mb-5 text-indigo-400" size={20}/><p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</p><p className="mt-2 text-lg font-black text-white">{value}</p></Card>)}
      </section>

      {confirmedTaxRate === null && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs leading-relaxed text-amber-100">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <p>A taxa de imposto ainda não foi confirmada. Valores legados foram preservados, mas não são usados silenciosamente como configuração tributária.</p>
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.2fr_2fr]">
        <Card className="p-8">
          <Target className="text-emerald-400"/>
          <p className="mt-8 text-xs font-bold uppercase tracking-widest text-gray-500">Saldo observado</p>
          <p className="mt-2 text-4xl font-black text-white">{formatCurrency(currentBalance)}</p>
          <p className="mt-6 text-sm text-gray-400">Meta mensal: {summary.monthlyGoal && summary.monthlyGoal > 0 ? formatCurrency(summary.monthlyGoal) : 'não configurada'}</p>
          <p className="mt-1 text-sm text-gray-400">Progresso: {summary.goalProgress === null ? 'dados insuficientes' : `${summary.goalProgress.toFixed(1)}%`}</p>
        </Card>
        <Card className="overflow-hidden">
          <div className="border-b border-white/5 p-5"><h2 className="font-bold text-white">Movimentações do negócio</h2></div>
          <div className="max-h-[440px] overflow-y-auto p-3">
            {loading ? <div className="flex h-44 items-center justify-center"><Loader2 className="animate-spin text-indigo-400"/></div> : transactions.length === 0 ? <div className="flex h-44 flex-col items-center justify-center text-gray-500"><FileText/><p className="mt-3 text-sm">Nenhum lançamento registrado.</p></div> : transactions.map((transaction) => <div key={transaction.id} className="flex items-center justify-between rounded-2xl p-4 hover:bg-white/[0.03]"><div><p className="font-medium text-white">{transaction.description}</p><p className="text-xs text-gray-500">{transaction.category} · {new Date(transaction.date).toLocaleDateString('pt-BR')}</p></div><p className={transaction.type === 'receita' ? 'font-bold text-emerald-400' : 'font-bold text-rose-400'}>{transaction.type === 'receita' ? '+' : '-'}{formatCurrency(transaction.amount)}</p></div>)}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <SimulatorWidget metrics={metrics} />
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <AlertTriangle className="text-amber-400" size={18} />
            <div>
              <h2 className="font-bold text-white">Alertas determinísticos</h2>
              <p className="text-xs text-gray-500">Regras locais calculadas somente com dados do workspace.</p>
            </div>
          </div>
          {alerts.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-sm text-gray-400">
              Não há alertas calculáveis com os dados atuais. Isso não representa garantia de saúde financeira.
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className={`rounded-2xl border p-4 ${alert.severity === 'critical' ? 'border-rose-500/20 bg-rose-500/10 text-rose-100' : alert.severity === 'medium' ? 'border-amber-500/20 bg-amber-500/10 text-amber-100' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'}`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{alert.metric === 'Runway' ? 'Fôlego de caixa' : alert.metric}</p>
                  <p className="mt-1 text-sm font-medium">{alert.message}</p>
                </div>
              ))}
            </div>
          )}
          <p className="mt-5 text-[10px] leading-relaxed text-gray-500">O indicador financeiro e os alertas são regras internas de apoio à organização; não constituem diagnóstico, garantia ou aconselhamento tributário.</p>
        </Card>
      </section>

      <AnimatePresence>{modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/70" onClick={() => setModalOpen(false)}/><motion.form onSubmit={submit} initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}} className="relative z-10 w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-[#0a0a0c] p-6"><div className="flex justify-between"><h2 className="font-bold text-white">Novo lançamento</h2><button type="button" onClick={() => setModalOpen(false)}><X/></button></div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setType('receita')} className={`rounded-xl p-3 text-sm ${type === 'receita' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-gray-400'}`}>Receita</button><button type="button" onClick={() => setType('despesa_variavel')} className={`rounded-xl p-3 text-sm ${type !== 'receita' ? 'bg-rose-500/20 text-rose-300' : 'bg-white/5 text-gray-400'}`}>Despesa</button></div><input required value={form.description} onChange={(e) => setForm({...form,description:e.target.value})} placeholder="Descrição" className="w-full rounded-xl border border-white/10 bg-black p-3 text-white"/><input required min="0.01" step="0.01" type="number" value={form.amount} onChange={(e) => setForm({...form,amount:e.target.value})} placeholder="Valor" className="w-full rounded-xl border border-white/10 bg-black p-3 text-white"/><input value={form.category} onChange={(e) => setForm({...form,category:e.target.value})} placeholder="Categoria" className="w-full rounded-xl border border-white/10 bg-black p-3 text-white"/><button disabled={submitting} className="w-full rounded-xl bg-indigo-600 p-3 font-bold text-white disabled:opacity-50">{submitting ? 'Salvando…' : 'Salvar lançamento'}</button></motion.form></div>}</AnimatePresence>
    </div>
  )
}
