'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Target, ShieldCheck, Wallet, RefreshCw, 
  Lock, Plus, X, BrainCircuit, Sparkles, TrendingUp, CheckCircle2 
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { Goal, Investment, PatrimonyHistory } from '@/types_db' 
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import UpgradeModal from '@/core/components/UpgradeModal'

// Importação dos Componentes Modulares
import MarketTicker from '@/modules/personal/components/investments/MarketTicker'
import PortfolioManager from '@/modules/personal/components/investments/PortfolioManager'
import AllocationChart from '@/modules/personal/components/investments/AllocationChart'
import FinancialCalculators from '@/modules/personal/components/investments/FinancialCalculators'

// --- COMPONENTE: GLASS CARD PREMIUM ---
const GlassCard = ({ children, className = "", glow = false, onClick, isLocked = false }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={onClick && !isLocked ? { y: -4, scale: 1.01 } : {}}
    onClick={onClick}
    className={`relative bg-[#09090b]/40 backdrop-blur-2xl border border-white/[0.05] rounded-[2.5rem] overflow-hidden shadow-2xl ${className} ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-gradient-to-br from-white to-transparent" />
    {glow && <div className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />}
    <div className={`relative z-10 h-full ${isLocked ? 'blur-md grayscale' : ''}`}>{children}</div>
  </motion.div>
)

const SectionTitle = ({ icon: Icon, title, subtitle, onAiClick, aiText, isLocked }: any) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
    <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
            <Icon size={20} />
        </div>
        <div>
            <h2 className="text-xl font-black text-white tracking-tight uppercase italic">{title}</h2>
            {subtitle && <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">{subtitle}</p>}
        </div>
    </div>
    {onAiClick && (
        <button 
            onClick={onAiClick} 
            className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl"
        >
            {isLocked ? <Lock size={12}/> : <Sparkles size={12}/>} {aiText || "Consultor IA"}
        </button>
    )}
  </div>
)

// --- VIEW PRINCIPAL ---
interface InvestmentsViewProps {
  user: any
  goals: Goal[]
  onAddGoal: (goal: any) => void
}

export default function InvestmentsView({ user, goals, onAddGoal }: InvestmentsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [investments, setInvestments] = useState<Investment[]>([])
  const [historyData, setHistoryData] = useState<PatrimonyHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPatrimony, setTotalPatrimony] = useState(0)

  const supabase = createClient()

  // 🛡️ Lógica de Plano
  const userPlan = user?.user_metadata?.plan_tier || 'free'
  const isFreePlan = userPlan !== 'pro' && userPlan !== 'premium'

  const fetchData = async () => {
    setLoading(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (authUser) {
      const { data: invData } = await supabase.from('investments').select('*').eq('user_id', authUser.id).order('amount_invested', { ascending: false })
      if (invData) {
         const items = invData as Investment[]
         setInvestments(items)
         setTotalPatrimony(items.reduce((acc, curr) => acc + (curr.quantity * curr.current_price), 0))
      }

      const { data: histData } = await supabase.from('patrimony_history').select('*').eq('user_id', authUser.id).order('record_date', { ascending: true }).limit(30)
      if (histData && histData.length > 0) {
        setHistoryData(histData as PatrimonyHistory[])
      } else {
        setHistoryData([
            { id: '1', user_id: authUser.id, total_balance: 0, record_date: new Date().toISOString() },
            { id: '2', user_id: authUser.id, total_balance: 0, record_date: new Date().toISOString() }
        ])
      }
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const chartData = useMemo(() => historyData.map(h => ({
      name: new Date(h.record_date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      value: Number(h.total_balance)
  })), [historyData])

  const triggerAiHelp = (prompt: string) => {
      if (isFreePlan) {
          setShowUpgradeModal(true)
          return
      }
      navigator.clipboard.writeText(prompt)
      toast.success("Estratégia copiada!", {
          description: "Cole no chat flutuante para processar a análise.",
          icon: <Sparkles className="text-indigo-400" />
      })
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 space-y-10 pb-32 max-w-7xl mx-auto animate-in fade-in duration-700">
      
      {/* HEADER PATRIMONIAL */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2 uppercase italic">Patrimônio</h1>
            <p className="text-gray-500 font-medium uppercase tracking-widest text-xs">Gestão de ativos e inteligência de alocação.</p>
          </div>
          <div className="bg-indigo-500/5 border border-indigo-500/20 px-8 py-5 rounded-[2rem] flex items-center gap-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-4 bg-indigo-600/20 rounded-2xl text-indigo-400"><Wallet size={28} /></div>
            <div>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-1">Montante Consolidado</p>
                {loading ? <div className="h-8 w-32 bg-white/5 animate-pulse rounded-lg" /> : <p className="text-3xl font-black text-white tracking-tighter">{formatCurrency(totalPatrimony)}</p>}
            </div>
            <button onClick={fetchData} className="ml-4 p-2 hover:bg-white/5 rounded-full text-gray-600 transition-colors"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
          </div>
      </header>

      <section className="-mx-4 px-4 md:mx-0 md:px-0"><MarketTicker /></section>

      {/* DASHBOARD GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* GRÁFICO DE EVOLUÇÃO (BLINDADO) */}
         <div className="lg:col-span-2 relative group">
            <GlassCard className="p-8 h-[450px]" glow>
                <div className="flex justify-between items-start mb-10">
                   <div>
                      <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Crescimento Histórico</h3>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Performance real da carteira</p>
                   </div>
                   <button onClick={() => triggerAiHelp("Análise de crescimento")} className="flex items-center gap-2 bg-indigo-600/20 text-indigo-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600/30 transition-all">
                        <Sparkles size={12}/> Analisar Curva
                   </button>
                </div>

                <div className="h-[280px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                         <defs>
                            <linearGradient id="colorPat" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 10, fontWeight: 'bold'}} dy={15} />
                         <YAxis hide domain={['auto', 'auto']} />
                         <Tooltip contentStyle={{ backgroundColor: '#0f0f13', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }} />
                         <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fill="url(#colorPat)" />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
            </GlassCard>
            {isFreePlan && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#050505]/40 backdrop-blur-md rounded-[2.5rem] border border-white/5 text-center p-8">
                    <Lock size={32} className="text-indigo-500 mb-4" />
                    <h4 className="text-white font-black uppercase tracking-widest mb-2">Análise de Curva Bloqueada</h4>
                    <p className="text-gray-400 text-xs mb-6 max-w-[240px]">O histórico de crescimento patrimonial é um recurso exclusivo para assinantes PRO.</p>
                    <button onClick={() => setShowUpgradeModal(true)} className="bg-white text-black font-black text-[10px] uppercase tracking-widest px-8 py-3 rounded-xl shadow-2xl">Ativar Evolução</button>
                </div>
            )}
         </div>

         <div className="h-[450px]"><AllocationChart investments={investments} /></div>
      </section>

      {/* CALCULADORAS */}
      <section>
          <SectionTitle icon={BrainCircuit} title="Cognição Financeira" subtitle="Simuladores de projeção de riqueza." isLocked={isFreePlan} onAiClick={() => triggerAiHelp("Selic vs Dívidas")} aiText="Decisão Estratégica" />
          <FinancialCalculators />
      </section>

      {/* PORTFÓLIO */}
      <section>
          <SectionTitle icon={TrendingUp} title="Gestão de Ativos" subtitle="Alocação em renda fixa, variável e cripto." isLocked={isFreePlan} onAiClick={() => triggerAiHelp("Sugestão de aporte")} aiText="Onde Investir?" />
          <PortfolioManager investments={investments} onUpdate={fetchData} />
      </section>

      {/* METAS */}
      <section>
          <SectionTitle icon={Target} title="Metas de Longo Prazo" subtitle="Progresso visual dos seus objetivos." isLocked={isFreePlan} onAiClick={() => triggerAiHelp("Plano agressivo para metas")} aiText="Acelerar Metas" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {goals.map((goal) => {
                const percentage = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
                return (
                   <GlassCard key={goal.id} className="p-6">
                      <div className="flex justify-between items-start mb-6">
                         <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-indigo-400"><Target size={20}/></div>
                         <span className="text-xl font-black text-white italic">{percentage.toFixed(0)}%</span>
                      </div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight mb-4 truncate">{goal.title}</h4>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-4">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                      </div>
                      <div className="flex justify-between text-[9px] font-black text-gray-500 uppercase tracking-widest">
                        <span>Faltam {formatCurrency(goal.target_amount - goal.current_amount)}</span>
                      </div>
                   </GlassCard>
                )
             })}
             <button onClick={() => setIsModalOpen(true)} className="min-h-[160px] rounded-[2rem] border-2 border-dashed border-white/5 text-gray-600 font-black uppercase tracking-[0.2em] hover:border-indigo-500/40 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all flex flex-col items-center justify-center gap-4 text-[10px]">
                <Plus size={32} /> <span>Nova Meta</span>
             </button>
          </div>
      </section>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      {/* MODAL NOVA META */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
             <motion.div initial={{scale: 0.9, y: 20}} animate={{scale: 1, y: 0}} exit={{scale: 0.9, opacity: 0}} className="w-full max-w-md bg-[#09090b] border border-white/10 rounded-[2.5rem] p-8 relative shadow-2xl">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors"><X size={20}/></button>
                <h2 className="text-2xl font-black text-white mb-8 uppercase italic tracking-tighter">Vincular Nova Meta</h2>
                <form onSubmit={(e) => {
                   e.preventDefault()
                   const formData = new FormData(e.currentTarget)
                   onAddGoal({ title: formData.get('title'), target_amount: formData.get('target'), deadline: formData.get('deadline'), color: '#6366f1' })
                   setIsModalOpen(false)
                }} className="space-y-6">
                   <div className="space-y-1"><label className="text-[10px] font-black text-gray-500 uppercase ml-1">Identificação</label><input name="title" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500/50" placeholder="Ex: Liberdade Financeira" /></div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><label className="text-[10px] font-black text-gray-500 uppercase ml-1">Montante Alvo</label><input name="target" type="number" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none" placeholder="0.00" /></div>
                      <div className="space-y-1"><label className="text-[10px] font-black text-gray-500 uppercase ml-1">Data Limite</label><input name="deadline" type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none [color-scheme:dark]" /></div>
                   </div>
                   <button type="submit" className="w-full bg-white text-black font-black py-5 rounded-2xl text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3">
                    <CheckCircle2 size={18}/> Consolidar Meta
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}