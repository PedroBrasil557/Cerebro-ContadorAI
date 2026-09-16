'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, ArrowDownRight, ArrowUpRight, Briefcase, Calculator, FileText, Loader2, Plus, Sparkles, Target, Wallet, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { businessFinanceService } from '@/services/businessFinanceService'
import { summarizeBusinessFinance } from '@/lib/business/finance'
import { formatCurrency } from '@/lib/utils'
import type { BusinessSettings, BusinessWorkspace, Transaction } from '@/types_db'

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-3xl border border-white/[0.07] bg-[#09090b]/70 shadow-2xl backdrop-blur-xl ${className}`}>{children}</div>
)

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

  const summary = useMemo(() => summarizeBusinessFinance(transactions, {
    taxRate: workspace?.tax_rate ?? settings?.tax_rate ?? null,
    monthlyGoal: settings?.monthly_goal ?? null,
  }), [settings, transactions, workspace])
  const currentBalance = (Number(settings?.current_balance) || 0) + summary.balance
  const runway = summary.expenses > 0 ? Math.max(currentBalance, 0) / summary.expenses : null
  const safeDraw = summary.taxReserve === null || summary.balance <= 0
    ? null
    : Math.max(summary.balance - summary.taxReserve, 0) * 0.4

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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Receitas observadas', value: formatCurrency(summary.revenue), icon: ArrowUpRight },
          { label: 'Despesas observadas', value: formatCurrency(summary.expenses), icon: ArrowDownRight },
          { label: 'Retirada estimada', value: safeDraw === null ? 'Dados insuficientes' : formatCurrency(safeDraw), icon: Wallet },
          { label: 'Fôlego de caixa', value: runway === null ? 'Dados insuficientes' : `${runway.toFixed(1)} meses`, icon: Activity },
          { label: 'Reserva para impostos', value: summary.taxReserve === null ? 'Não configurada' : formatCurrency(summary.taxReserve), icon: Calculator },
        ].map(({ label, value, icon: Icon }) => <Card key={label} className="p-5"><Icon className="mb-5 text-indigo-400" size={20}/><p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</p><p className="mt-2 text-lg font-black text-white">{value}</p></Card>)}
      </section>

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

      <AnimatePresence>{modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/70" onClick={() => setModalOpen(false)}/><motion.form onSubmit={submit} initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}} className="relative z-10 w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-[#0a0a0c] p-6"><div className="flex justify-between"><h2 className="font-bold text-white">Novo lançamento</h2><button type="button" onClick={() => setModalOpen(false)}><X/></button></div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setType('receita')} className={`rounded-xl p-3 text-sm ${type === 'receita' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-gray-400'}`}>Receita</button><button type="button" onClick={() => setType('despesa_variavel')} className={`rounded-xl p-3 text-sm ${type !== 'receita' ? 'bg-rose-500/20 text-rose-300' : 'bg-white/5 text-gray-400'}`}>Despesa</button></div><input required value={form.description} onChange={(e) => setForm({...form,description:e.target.value})} placeholder="Descrição" className="w-full rounded-xl border border-white/10 bg-black p-3 text-white"/><input required min="0.01" step="0.01" type="number" value={form.amount} onChange={(e) => setForm({...form,amount:e.target.value})} placeholder="Valor" className="w-full rounded-xl border border-white/10 bg-black p-3 text-white"/><input value={form.category} onChange={(e) => setForm({...form,category:e.target.value})} placeholder="Categoria" className="w-full rounded-xl border border-white/10 bg-black p-3 text-white"/><button disabled={submitting} className="w-full rounded-xl bg-indigo-600 p-3 font-bold text-white disabled:opacity-50">{submitting ? 'Salvando…' : 'Salvar lançamento'}</button></motion.form></div>}</AnimatePresence>
    </div>
  )
}
