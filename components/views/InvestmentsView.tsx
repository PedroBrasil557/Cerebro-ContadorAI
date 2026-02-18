'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Target, ShieldCheck, Wallet, RefreshCw, 
  Lock, Plus, X, BrainCircuit 
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { Goal, Investment, PatrimonyHistory } from '@/types_db' 
import { formatCurrency } from '@/lib/utils'

// Importação dos Novos Componentes Modulares
import MarketTicker from '@/components/investments/MarketTicker'
import PortfolioManager from '@/components/investments/PortfolioManager'
import AllocationChart from '@/components/investments/AllocationChart'
import FinancialCalculators from '@/components/investments/FinancialCalculators'

// --- COMPONENTES UI (Mantidos do seu design system) ---
const GlassCard = ({ children, className = "", glow = false, onClick }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={onClick ? { y: -2 } : {}}
    onClick={onClick}
    className={`relative bg-[#09090b]/60 backdrop-blur-xl border border-white/[0.06] rounded-3xl overflow-hidden shadow-2xl ${className}`}
  >
    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
    {glow && <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />}
    <div className="relative z-10">{children}</div>
  </motion.div>
)

const SectionTitle = ({ icon: Icon, title, subtitle }: any) => (
  <div className="mb-4 md:mb-6">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="text-blue-400 h-5 w-5" />
      <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">{title}</h2>
    </div>
    {subtitle && <p className="text-xs md:text-sm text-gray-400 ml-7">{subtitle}</p>}
  </div>
)

// --- VIEW PRINCIPAL ---
interface InvestmentsViewProps {
  goals: Goal[]
  onAddGoal: (goal: any) => void
  onUpdateGoal?: (goal: any) => void
}

export default function InvestmentsView({ goals, onAddGoal }: InvestmentsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [investments, setInvestments] = useState<Investment[]>([])
  const [historyData, setHistoryData] = useState<PatrimonyHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPatrimony, setTotalPatrimony] = useState(0)

  const displayGoals = Array.isArray(goals) ? goals : []
  const supabase = createClient()

  // Função para buscar dados reais do Supabase
  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // 1. Buscar Investimentos
      const { data: invData } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .order('amount_invested', { ascending: false })
      
      if (invData) {
         const items = invData as Investment[]
         setInvestments(items)
         // Calcula total: Quantidade * Preço Atual
         const total = items.reduce((acc, curr) => acc + (curr.quantity * curr.current_price), 0)
         setTotalPatrimony(total)
      }

      // 2. Buscar Histórico (Opcional, se existir dados)
      const { data: histData } = await supabase
        .from('patrimony_history')
        .select('*')
        .eq('user_id', user.id)
        .order('record_date', { ascending: true })
        .limit(30)
      
      if (histData && histData.length > 0) {
        setHistoryData(histData as PatrimonyHistory[])
      } else {
        // Fallback visual se não tiver histórico ainda
        setHistoryData([
            { id: '1', user_id: user.id, total_balance: totalPatrimony * 0.9, record_date: 'Início' },
            { id: '2', user_id: user.id, total_balance: totalPatrimony, record_date: 'Hoje' }
        ])
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, []) // Carrega ao montar

  // Prepara dados para o gráfico de área
  const chartData = historyData.map(h => ({
      name: new Date(h.record_date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      value: Number(h.total_balance)
  }))

  return (
    <div className="space-y-8 md:space-y-10 pb-32">
      
      {/* HEADER & TOTAL */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6">
         <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-1 md:mb-2">Investimentos</h1>
            <p className="text-sm md:text-base text-gray-400 font-light flex items-center gap-2">
               Gestão profissional de portfólio em tempo real.
            </p>
         </div>
         
         {/* Card de Patrimônio Total com Refresh */}
         <div className="bg-[#09090b] border border-white/10 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-2xl hover:border-blue-500/30 transition-colors group">
            <div className="p-3 bg-blue-600/20 rounded-xl group-hover:bg-blue-600/30 transition-colors">
                <Wallet className="text-blue-500" size={24} />
            </div>
            <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Patrimônio Total</p>
                {loading ? (
                    <div className="h-8 w-32 bg-white/10 animate-pulse rounded mt-1" />
                ) : (
                    <p className="text-2xl font-black text-white tracking-tight">
                        {formatCurrency(totalPatrimony)}
                    </p>
                )}
            </div>
            <button 
                onClick={fetchData} 
                className="ml-4 p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors"
                title="Atualizar cotações"
            >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
         </div>
      </header>

      {/* MARKET TICKER (NOVO - Real Time) */}
      <section className="-mx-4 px-4 md:mx-0 md:px-0 overflow-x-hidden">
         <MarketTicker />
      </section>

      {/* DASHBOARD GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
         
         {/* EVOLUÇÃO PATRIMONIAL (Com dados reais) */}
         <GlassCard className="lg:col-span-2 p-6 md:p-8 flex flex-col h-[400px]" glow>
            <div className="flex justify-between items-start mb-6">
               <div>
                  <h3 className="text-base md:text-lg font-bold text-white">Evolução Patrimonial</h3>
                  <p className="text-xs text-gray-400">Crescimento da carteira consolidada</p>
               </div>
               <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck size={14} className="text-emerald-400"/>
                  <span className="text-[10px] md:text-xs font-bold text-emerald-200 uppercase tracking-wide">Carteira Ativa</span>
               </div>
            </div>

            <div className="flex-1 w-full min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                     <defs>
                        <linearGradient id="colorPatrimony" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                           <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10}} dy={10} minTickGap={30} />
                     <YAxis hide domain={['auto', 'auto']} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid #333', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} 
                        itemStyle={{ color: '#fff' }} 
                        formatter={(value: any) => [formatCurrency(value), 'Patrimônio']} 
                     />
                     <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPatrimony)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </GlassCard>

         {/* GRÁFICO DE ALOCAÇÃO (NOVO - Componente Modular) */}
         <div className="h-[400px]">
             <AllocationChart investments={investments} />
         </div>
      </section>

      {/* CALCULADORAS & SIMULADORES (NOVO - Engine Financeira) */}
      <section>
          <SectionTitle icon={BrainCircuit} title="Inteligência Financeira" subtitle="Simuladores avançados para projeção de riqueza." />
          <FinancialCalculators />
      </section>

      {/* GERENCIADOR DE PORTFÓLIO (NOVO - Tabela Real) */}
      <section>
          <SectionTitle icon={Wallet} title="Minha Carteira" subtitle="Gerencie seus ativos de renda fixa, variável e cripto." />
          <PortfolioManager investments={investments} onUpdate={fetchData} />
      </section>

      {/* METAS (Mantido do original) */}
      <section>
          <SectionTitle icon={Target} title="Metas Financeiras" subtitle="Progresso visual dos seus objetivos." />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {displayGoals.length > 0 ? displayGoals.map((goal) => {
                const percentage = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
                return (
                   <GlassCard key={goal.id} className="p-5 group hover:border-white/20 transition-all cursor-pointer">
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-white">
                               {goal.title.includes('Carro') ? <Lock size={18}/> : <Target size={18}/>}
                            </div>
                            <div>
                               <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">{goal.title}</h4>
                               <p className="text-[10px] text-gray-500">Prazo: {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'Indefinido'}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-lg font-black text-white">{percentage.toFixed(0)}%</p>
                         </div>
                      </div>
                      <div className="h-2 w-full bg-[#1a1a1a] rounded-full overflow-hidden p-[1px]">
                         <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className="h-full rounded-full bg-blue-500" />
                      </div>
                      <div className="flex justify-between mt-2 text-[10px] font-medium">
                         <span className="text-gray-400">Atual: <span className="text-white">{formatCurrency(goal.current_amount)}</span></span>
                         <span className="text-gray-500">Meta: {formatCurrency(goal.target_amount)}</span>
                      </div>
                   </GlassCard>
                )
             }) : (
                <div className="p-8 text-center border-2 border-dashed border-white/10 rounded-3xl col-span-full">
                    <p className="text-gray-500 text-sm">Nenhuma meta definida ainda.</p>
                </div>
             )}
             
             {/* Botão Adicionar Meta */}
             <button onClick={() => setIsModalOpen(true)} className="h-full min-h-[140px] rounded-3xl border border-dashed border-white/10 text-gray-500 font-bold uppercase tracking-widest hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center gap-2 text-xs">
                <Plus size={24} /> <span>Nova Meta</span>
             </button>
          </div>
      </section>

      {/* ADD GOAL MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} exit={{scale: 0.9, opacity: 0}} className="w-full max-w-md bg-[#09090b] border border-white/10 rounded-3xl p-6 relative shadow-2xl">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X /></button>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Target className="text-blue-500" /> Nova Meta</h2>
                <form onSubmit={(e) => {
                   e.preventDefault()
                   const formData = new FormData(e.currentTarget)
                   onAddGoal({
                      title: formData.get('title'),
                      target_amount: formData.get('target'),
                      deadline: formData.get('deadline'),
                      color: '#3b82f6'
                   })
                   setIsModalOpen(false)
                }} className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome</label>
                      <input name="title" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500" placeholder="Ex: Viagem..." />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Alvo (R$)</label>
                      <input name="target" type="number" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500" placeholder="0.00" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Prazo</label>
                      <input name="deadline" type="date" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 [color-scheme:dark]" />
                   </div>
                   <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl mt-4">Criar Meta</button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}