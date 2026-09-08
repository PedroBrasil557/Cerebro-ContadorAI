'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, AlertTriangle, TrendingUp, Lock, CalendarClock, 
  Settings2, AlertOctagon, Landmark, PiggyBank, History, Activity,
  ArrowRight, Sparkles, Loader2, Briefcase, Calculator, Receipt, 
  TrendingDown, Target, Wallet, Plus, Search, Filter, ArrowUpRight, ArrowDownRight, CheckCircle2, FileText, X
} from 'lucide-react'
import { CaixaData, Transaction } from '@/types_db' 
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

// Importando a Camada de Domínio (O Cérebro do Negócio)
import { cfoEngine, BusinessMetrics } from '@/modules/cfo/cfoEngine'
import { cfoRulesEngine } from '@/modules/cfo/cfoRulesEngine'
import { cfoSimulator } from '@/modules/cfo/cfoSimulator'

// --- COMPONENTES VISUAIS AUXILIARES ---
const GlassCard = ({ children, className = "", glow = false }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`relative bg-[#09090b]/60 backdrop-blur-xl border border-white/[0.06] rounded-3xl overflow-hidden shadow-2xl ${className}`}
  >
    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
    {glow && <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />}
    <div className="relative z-10">{children}</div>
  </motion.div>
)

const KPICard = ({ label, value, subtext, icon: Icon, colorClass = "text-emerald-400", bgClass = "bg-emerald-500/10" }: any) => (
  <div className="min-w-[160px] md:min-w-0 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group flex flex-col justify-between h-36">
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2 rounded-lg ${bgClass} ${colorClass} group-hover:scale-110 transition-transform`}>
        <Icon size={18} />
      </div>
    </div>
    <div>
      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-lg font-black text-white truncate">{value}</h3>
      {subtext && <p className="text-[10px] text-gray-400 mt-1 truncate font-medium">{subtext}</p>}
    </div>
  </div>
)

// --- MÓDULO SIMULADOR FRONT-END ---
const SimulatorWidget = ({ metrics }: { metrics: BusinessMetrics }) => {
  const [extraContribution, setExtraContribution] = useState(0)
  const [months, setMonths] = useState(6)
  
  const simResult = useMemo(() => {
      return cfoSimulator.runSimulation(metrics, {
          cashInjection: extraContribution * months
      })
  }, [metrics, extraContribution, months])

  return (
    <GlassCard className="p-6 md:p-8 h-full flex flex-col justify-between" glow>
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="text-emerald-400 h-5 w-5" />
          <h3 className="text-lg font-bold text-white">Simulador Estratégico</h3>
        </div>
        <p className="text-xs text-gray-400 mb-6 leading-relaxed">Projete o impacto de aportes extras no Score e Fôlego da sua empresa.</p>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
              <label>Aporte Mensal Extra</label>
              <span className="text-emerald-400 font-mono">{formatCurrency(extraContribution)}</span>
            </div>
            <input type="range" min="0" max="5000" step="100" value={extraContribution} onChange={(e) => setExtraContribution(Number(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
              <label>Tempo de Acúmulo</label>
              <span className="text-white font-mono">{months} meses</span>
            </div>
            <input type="range" min="1" max="24" step="1" value={months} onChange={(e) => setMonths(Number(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500" />
          </div>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
            <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-wide">Score Projetado</p>
            <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white">{simResult.projectedScore}</span>
            <span className={`text-xs font-bold ${simResult.scoreImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {simResult.scoreImpact >= 0 ? '+' : ''}{simResult.scoreImpact} pts
            </span>
            </div>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-black border border-emerald-500/20">
            <p className="text-[10px] text-emerald-200 font-bold mb-1 uppercase tracking-wide">Novo Runway</p>
            <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white">{simResult.projectedRunway.toFixed(1)}</span>
            <span className="text-xs font-bold text-gray-500">meses</span>
            </div>
        </div>
      </div>
    </GlassCard>
  )
}

// --- COMPONENTE PRINCIPAL ---
interface CaixaViewProps {
  data: CaixaData
  transactions?: Transaction[]
}

export default function CaixaView({ data, transactions: initialTransactions = [] }: CaixaViewProps) {
  const supabase = createClient()
  
  // Estados do CFO Engine
  const [analyzing, setAnalyzing] = useState(false)
  const [cfoAnalysis, setCfoAnalysis] = useState<string | null>(null)
  
  // Estados Operacionais do Caixa
  const [liveTransactions, setLiveTransactions] = useState<Transaction[]>(initialTransactions)
  const [isTxLoading, setIsTxLoading] = useState(true)
  
  // Estados do Modal Rápido
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [txType, setTxType] = useState<'receita' | 'despesa_variavel'>('receita')
  const [newTx, setNewTx] = useState({ description: '', amount: '', category: 'Serviço' })

  const safeData = data || { currentBalance: 0, monthlyGoal: 15000, taxRate: 6, entries: [] }

  // 0. BUSCA REAL-TIME DAS TRANSAÇÕES
  const fetchTransactions = async () => {
    setIsTxLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const { data: fetchedTxs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('scope', 'business')
        .gte('date', startOfMonth)
        .order('date', { ascending: false })
      
      if (fetchedTxs) {
          // O TypeScript do Supabase pode retornar os dados de forma genérica.
          // O cast as unknown as Transaction[] força a tipagem correta.
          setLiveTransactions(fetchedTxs as unknown as Transaction[])
      }
    }
    setIsTxLoading(false)
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  // 1. CONSTRUÇÃO DO DOMÍNIO (Data Prep)
  const metrics: BusinessMetrics = useMemo(() => {
    // Calcula com base nas transações reais carregadas do Supabase
    const revenue = liveTransactions.filter(t => t.type === 'receita').reduce((acc, t) => acc + Number(t.amount), 0)
    const expenses = liveTransactions
      .filter(t => t.type === 'despesa_fixa' || t.type === 'despesa_variavel')
      .reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0)

    // O Saldo real atualizado
    const realBalance = (safeData.currentBalance || 0) + revenue - expenses

    return {
        revenue,
        expenses,
        cashReserve: realBalance > 0 ? realBalance : 0, // Garante que não fica negativo visualmente no CFO
        taxRate: safeData.taxRate,
        activeClients: 1, 
        totalHoursWorked: 160 
    }
  }, [liveTransactions, safeData])

  // 2. AVALIAÇÃO PELO MOTOR DO CFO
  const { score, alerts } = useMemo(() => cfoRulesEngine.evaluateHealth(metrics), [metrics])
  const safeDraw = useMemo(() => cfoRulesEngine.calculateSafeDraw(metrics), [metrics])
  const taxReserve = useMemo(() => cfoEngine.calculateTaxReserve(metrics.revenue, metrics.taxRate), [metrics])
  const runway = useMemo(() => cfoEngine.calculateRunway(metrics.cashReserve, metrics.expenses || 2000), [metrics])

  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length
  const status = criticalAlerts > 0 ? 'critical' : score < 50 ? 'warning' : 'healthy'

  // 3. IA CONSULTING (Integração com o Interpreter)
  const handleAnalyzeCash = async () => {
    setAnalyzing(true)
    try {
      const response = await fetch('/api/cfo-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caixaData: {
            currentBalance: metrics.cashReserve,
            monthlyGoal: safeData.monthlyGoal,
            taxRate: safeData.taxRate,
            reserveRate: safeData.reserveRate ?? 10,
          },
          recentTransactions: liveTransactions.slice(0, 50).map(({ amount, type }) => ({ amount, type })),
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Falha ao consultar o CFO Virtual.')
      setCfoAnalysis(result.analysis)
      toast.success("Análise estratégica concluída!")
    } catch (error) {
      toast.error("Erro ao consultar o CFO Virtual.")
    } finally {
      setAnalyzing(false)
    }
  }

  // 4. CADASTRO DE LANÇAMENTO
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      description: newTx.description,
      amount: parseFloat(newTx.amount),
      type: txType,
      scope: 'business',
      category: newTx.category,
      date: new Date().toISOString(),
      status: 'concluido'
    })

    if (!error) {
      setIsModalOpen(false)
      setNewTx({ description: '', amount: '', category: 'Serviço' })
      fetchTransactions() // Recarrega o painel e o CFO instantaneamente
      toast.success("Lançamento salvo com sucesso!")
    } else {
      toast.error(`Erro ao salvar: ${error.message}`)
    }
    setIsSubmitting(false)
  }

  return (
    <div className="p-4 md:p-10 space-y-8 max-w-[1600px] mx-auto pb-32 animate-in fade-in duration-700">
      
      {/* HEADER DINÂMICO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
         <div>
            <div className="flex items-center gap-3 mb-2">
               <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Caixa Empresarial</h1>
               <div className={`flex items-center gap-1 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${status === 'healthy' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : status === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                  {status === 'healthy' ? <ShieldCheck size={12}/> : <AlertTriangle size={12}/>}
                  {status === 'healthy' ? 'Saudável' : status === 'warning' ? 'Atenção' : 'Risco Crítico'}
               </div>
            </div>
            <p className="text-sm text-gray-400 font-medium">Motor de Gestão e Tesouraria Multi-tenant.</p>
         </div>
         
         <div className="flex gap-4 w-full md:w-auto">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
            >
              <Plus size={16} /> Lançar Movimentação
            </button>
            <button 
                onClick={handleAnalyzeCash}
                disabled={analyzing}
                className="group flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:bg-emerald-400 active:scale-95 disabled:opacity-50"
            >
                {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="group-hover:animate-pulse" />}
                Consultar CFO
            </button>
         </div>
      </header>

      {/* ANÁLISE IA (Interpretador) */}
      <AnimatePresence>
        {cfoAnalysis && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <GlassCard className="p-6 border-indigo-500/30 bg-indigo-500/5" glow>
              <div className="flex justify-between mb-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-[10px] tracking-widest">
                  <Briefcase size={14}/> Relatório do Conselho
                </div>
                <button onClick={() => setCfoAnalysis(null)} className="text-gray-500 hover:text-white"><Receipt size={16}/></button>
              </div>
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-300 leading-relaxed font-light">{cfoAnalysis}</div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MÉTRICAS SUPERIORES DO CFO */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          <div className="lg:col-span-1 min-w-[160px] p-4 rounded-2xl bg-gradient-to-br from-[#09090b] to-[#111] border border-white/10 flex flex-col justify-between h-36 relative overflow-hidden">
             <div className="absolute -right-4 -bottom-4 opacity-10"><Target size={80}/></div>
             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Business Score</p>
             <div>
                <h3 className="text-4xl font-black text-white">{score}</h3>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-1">/ 100 pontos</p>
             </div>
          </div>
          <KPICard label="Faturamento Real" value={formatCurrency(metrics.revenue)} subtext="No Mês Atual" icon={TrendingUp} />
          <KPICard label="Pró-labore Seguro" value={formatCurrency(safeDraw)} subtext="Teto sugerido para saque" icon={PiggyBank} colorClass="text-purple-400" bgClass="bg-purple-500/10" />
          <KPICard label="Runway Atual" value={`${runway.toFixed(1)} Meses`} subtext="Sobrevivência do negócio" icon={Activity} colorClass={status === 'healthy' ? 'text-emerald-400' : 'text-rose-400'} bgClass={status === 'healthy' ? 'bg-emerald-500/10' : 'bg-rose-500/10'} />
          <KPICard label="Reserva DAS/MEI" value={formatCurrency(taxReserve)} subtext={`Taxa: ${metrics.taxRate}%`} icon={Calculator} colorClass="text-blue-400" bgClass="bg-blue-500/10" />
      </section>

      {/* NÚCLEO DO CAIXA: RESERVA + EXTRATO + SIMULADOR */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Coluna Esquerda: Saldo e Extrato Real */}
          <div className="lg:col-span-2 space-y-6">
              <GlassCard className="p-8 flex flex-col justify-between min-h-[350px]">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-4 bg-emerald-500/20 rounded-2xl text-emerald-400 border border-emerald-500/20">
                        <Wallet size={32} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Caixa de Segurança (Saldo Atual)</h2>
                        <p className="text-xs text-emerald-200/50 font-bold uppercase tracking-widest">Capital Líquido da Empresa</p>
                      </div>
                    </div>
                    <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter mb-10">
                      {formatCurrency(metrics.cashReserve)}
                    </h1>
                  </div>

                  <div className="relative z-10 space-y-4">
                      <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <span>Meta de Caixa: {formatCurrency(safeData.monthlyGoal)}</span>
                        <span className="text-emerald-400">{((metrics.cashReserve / safeData.monthlyGoal) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((metrics.cashReserve / safeData.monthlyGoal) * 100, 100)}%` }} className="h-full bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                      </div>
                  </div>
              </GlassCard>

              {/* Tabela de Extrato Inteligente */}
              <div className="bg-[#050505] border border-white/5 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Extrato Recente</h3>
                    <div className="flex gap-2">
                        <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"><Search size={16} /></button>
                        <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"><Filter size={16} /></button>
                    </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                    {isTxLoading ? (
                        <div className="h-32 flex items-center justify-center text-indigo-400"><Loader2 className="animate-spin h-8 w-8" /></div>
                    ) : liveTransactions.length === 0 ? (
                        <div className="h-48 flex flex-col items-center justify-center text-center p-10">
                            <FileText size={32} className="text-gray-600 mb-3" />
                            <p className="text-sm font-bold text-gray-400">Nenhum lançamento no mês</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {liveTransactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.02] transition-colors group">
                                <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${tx.type === 'receita' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                    {tx.type === 'receita' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{tx.description}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-md">
                                            {tx.category}
                                        </span>
                                        <span className="text-[10px] text-gray-600 font-medium">
                                            {new Date(tx.date).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-base font-black ${tx.type === 'receita' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {tx.type === 'receita' ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </p>
                                    <p className="text-[10px] text-gray-500 font-medium uppercase mt-0.5 flex items-center justify-end gap-1">
                                        <CheckCircle2 size={10} className="text-emerald-500" /> Liquidado
                                    </p>
                                </div>
                            </div>
                            ))}
                        </div>
                    )}
                </div>
              </div>
          </div>

          {/* Coluna Direita: Simulador Estratégico e Alertas */}
          <div className="space-y-6">
            <SimulatorWidget metrics={metrics} />
            
            {alerts.length > 0 && (
                <div className="p-5 rounded-3xl border border-white/5 bg-[#0a0a0c] space-y-4">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-500" /> Diagnóstico Operacional
                    </h2>
                    <div className="flex flex-col gap-3">
                        {alerts.map((alert, idx) => (
                            <div key={idx} className={`p-3 rounded-2xl border flex gap-3 ${alert.severity === 'critical' ? 'bg-rose-500/10 border-rose-500/20' : alert.severity === 'medium' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                                <div className={`mt-0.5 ${alert.severity === 'critical' ? 'text-rose-400' : alert.severity === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {alert.severity === 'critical' ? <AlertOctagon size={16}/> : alert.severity === 'medium' ? <AlertTriangle size={16}/> : <ShieldCheck size={16}/>}
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{alert.metric}</p>
                                    <p className={`text-xs font-medium mt-0.5 ${alert.severity === 'critical' ? 'text-rose-200' : alert.severity === 'medium' ? 'text-amber-200' : 'text-emerald-200'}`}>{alert.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
      </section>

      {/* 🟢 MODAL DE LANÇAMENTO (ALTA VELOCIDADE) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-6 shadow-2xl w-full max-w-md relative z-10">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-black text-white">Novo Lançamento</h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
              </div>

              {/* Tabs Entrada/Saída */}
              <div className="flex p-1 bg-[#050505] rounded-xl mb-6">
                 <button 
                   type="button" onClick={() => setTxType('receita')}
                   className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${txType === 'receita' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500'}`}
                 >
                   + Receita
                 </button>
                 <button 
                   type="button" onClick={() => setTxType('despesa_variavel')}
                   className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${txType === 'despesa_variavel' ? 'bg-rose-500/20 text-rose-400' : 'text-gray-500'}`}
                 >
                   - Despesa
                 </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 block">Descrição</label>
                  <input required type="text" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} placeholder={txType === 'receita' ? "Ex: Alongamento Carol" : "Ex: Compra de Material"} className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 block">Valor (R$)</label>
                    <input required type="number" step="0.01" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} placeholder="0.00" className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 block">Categoria</label>
                    <select value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500 appearance-none">
                      {txType === 'receita' ? (
                        <>
                          <option value="Serviço">Serviço/Atendimento</option>
                          <option value="Produto">Venda de Produto</option>
                          <option value="Outros">Outros</option>
                        </>
                      ) : (
                        <>
                          <option value="Insumos">Materiais/Insumos</option>
                          <option value="Operacional">Custos Fixos/Aluguel</option>
                          <option value="Marketing">Marketing/Anúncios</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                   <button disabled={isSubmitting} type="submit" className={`w-full font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${txType === 'receita' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}>
                     {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (txType === 'receita' ? 'Confirmar Receita' : 'Registrar Despesa')}
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
