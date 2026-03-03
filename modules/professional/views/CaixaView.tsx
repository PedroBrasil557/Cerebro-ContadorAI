'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, AlertTriangle, TrendingUp, Lock, CalendarClock, 
  Settings2, AlertOctagon, Landmark, PiggyBank, History, Activity,
  ArrowRight, Sparkles, Loader2, Briefcase, Calculator, Receipt, TrendingDown, Target
} from 'lucide-react'
import { CaixaData, Transaction } from '@/types_db' 
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

// Importando a Camada de Domínio (O Cérebro do Negócio)
import { cfoEngine, BusinessMetrics } from '@/modules/cfo/cfoEngine'
import { cfoRulesEngine } from '@/modules/cfo/cfoRulesEngine'
import { cfoInterpreter } from '@/modules/cfo/cfoInterpreter'
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
  
  // Roda a simulação pelo Motor do CFO
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

export default function CaixaView({ data, transactions = [] }: CaixaViewProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [cfoAnalysis, setCfoAnalysis] = useState<string | null>(null)

  const safeData = data || { currentBalance: 0, monthlyGoal: 15000, taxRate: 6, entries: [] }

  // 1. CONSTRUÇÃO DO DOMÍNIO (Data Prep)
  const metrics: BusinessMetrics = useMemo(() => {
    const today = new Date()
    const thisMonth = today.getMonth()
    
    const revenue = transactions.filter(t => t.type === 'receita' && new Date(t.date).getMonth() === thisMonth).reduce((acc, t) => acc + Number(t.amount), 0)
    const expenses = transactions.filter(t => t.type !== 'receita' && new Date(t.date).getMonth() === thisMonth).reduce((acc, t) => acc + Number(t.amount), 0)

    return {
        revenue,
        expenses,
        cashReserve: safeData.currentBalance,
        taxRate: safeData.taxRate,
        activeClients: 1, // Exemplo mock: Pode vir do banco no futuro
        totalHoursWorked: 160 // Exemplo mock
    }
  }, [transactions, safeData])

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
      const prompt = cfoInterpreter.generatePrompt(metrics)
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      })

      const result = await response.json()
      setCfoAnalysis(result.response)
      toast.success("Análise estratégica concluída!")
    } catch (error) {
      toast.error("Erro ao consultar o CFO Virtual.")
    } finally {
      setAnalyzing(false)
    }
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
         
         <button 
            onClick={handleAnalyzeCash}
            disabled={analyzing}
            className="group flex items-center gap-3 bg-white text-black px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:bg-emerald-400 active:scale-95 disabled:opacity-50"
         >
            {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="group-hover:animate-pulse" />}
            Consultar CFO Virtual
         </button>
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

      {/* MÉTRICAS (Alimentadas pela cfoEngine) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          <div className="lg:col-span-1 min-w-[160px] p-4 rounded-2xl bg-gradient-to-br from-[#09090b] to-[#111] border border-white/10 flex flex-col justify-between h-36 relative overflow-hidden">
             <div className="absolute -right-4 -bottom-4 opacity-10"><Target size={80}/></div>
             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Business Score</p>
             <div>
                <h3 className="text-4xl font-black text-white">{score}</h3>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-1">/ 100 pontos</p>
             </div>
          </div>
          <KPICard label="Faturamento" value={formatCurrency(metrics.revenue)} subtext="Mês atual" icon={TrendingUp} />
          <KPICard label="Pró-labore Seguro" value={formatCurrency(safeDraw)} subtext="Teto sugerido para saque" icon={PiggyBank} colorClass="text-purple-400" bgClass="bg-purple-500/10" />
          <KPICard label="Runway Atual" value={`${runway.toFixed(1)} Meses`} subtext="Sobrevivência do negócio" icon={Activity} colorClass={status === 'healthy' ? 'text-emerald-400' : 'text-rose-400'} bgClass={status === 'healthy' ? 'bg-emerald-500/10' : 'bg-rose-500/10'} />
          <KPICard label="Reserva DAS/MEI" value={formatCurrency(taxReserve)} subtext={`Taxa: ${metrics.taxRate}%`} icon={Calculator} colorClass="text-blue-400" bgClass="bg-blue-500/10" />
      </section>

      {/* RESERVA E SIMULADOR */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <GlassCard className="lg:col-span-2 p-8 flex flex-col justify-between min-h-[350px]">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-4 bg-emerald-500/20 rounded-2xl text-emerald-400 border border-emerald-500/20">
                    <Lock size={32} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Caixa de Segurança</h2>
                    <p className="text-xs text-emerald-200/50 font-bold uppercase tracking-widest">Capital Líquido da Empresa</p>
                  </div>
                </div>
                <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter mb-10">
                  {formatCurrency(safeData.currentBalance)}
                </h1>
              </div>

              <div className="relative z-10 space-y-4">
                  <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <span>Meta: {formatCurrency(safeData.monthlyGoal)}</span>
                    <span className="text-emerald-400">{((safeData.currentBalance / safeData.monthlyGoal) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((safeData.currentBalance / safeData.monthlyGoal) * 100, 100)}%` }} className="h-full bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                  </div>
              </div>
          </GlassCard>

          {/* Integração do novo Módulo Simulador */}
          <SimulatorWidget metrics={metrics} />
      </section>

      {/* ALERTAS DO SISTEMA (Baseados no cfoRulesEngine) */}
      {alerts.length > 0 && (
         <section className="space-y-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Diagnóstico Operacional</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {alerts.map((alert, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl border flex gap-4 ${alert.severity === 'critical' ? 'bg-rose-500/10 border-rose-500/20' : alert.severity === 'medium' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                     <div className={`mt-0.5 ${alert.severity === 'critical' ? 'text-rose-400' : alert.severity === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {alert.severity === 'critical' ? <AlertOctagon size={18}/> : alert.severity === 'medium' ? <AlertTriangle size={18}/> : <ShieldCheck size={18}/>}
                     </div>
                     <div>
                        <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${alert.severity === 'critical' ? 'text-rose-400' : alert.severity === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>{alert.metric}</p>
                        <p className="text-sm text-gray-200 font-medium">{alert.message}</p>
                     </div>
                  </div>
               ))}
            </div>
         </section>
      )}
    </div>
  )
}