'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, ArrowRight, Target, ShieldCheck, Wallet, Sparkles, 
  PieChart as PieIcon, Calculator, Plus, Lock, BrainCircuit, X, 
  ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid 
} from 'recharts'
import { Goal } from '@/types_db' 
import { formatCurrency } from '@/lib/utils'

// ... (MOCKS IGUAIS) ...
const MOCK_MARKET = [
  { id: 'selic', name: 'Taxa Selic', value: '11.25%', change: 0, trend: 'neutral' },
  { id: 'cdi', name: 'CDI Hoje', value: '11.15%', change: 0.02, trend: 'up' },
  { id: 'dolar', name: 'Dólar Ptax', value: 'R$ 5.29', change: -0.45, trend: 'down' },
  { id: 'btc', name: 'Bitcoin', value: 'R$ 342k', change: 2.3, trend: 'up' },
]

const ALLOCATION_DATA = [
  { name: 'Renda Fixa', value: 65, color: '#3b82f6' },
  { name: 'Cripto', value: 15, color: '#8b5cf6' },
  { name: 'Reserva', value: 20, color: '#10b981' },
]

const EVOLUTION_DATA = [
  { name: 'Jan', value: 45000 },
  { name: 'Fev', value: 48000 },
  { name: 'Mar', value: 52000 },
  { name: 'Abr', value: 53500 },
  { name: 'Mai', value: 58000 },
  { name: 'Jun', value: 65000 },
]

// ... (UI COMPONENTS IGUAIS) ...
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

const MarketCard = ({ data }: { data: any }) => (
  // CORREÇÃO: min-w-[160px] garante que não quebre e snap-center alinha no scroll
  <div className="min-w-[160px] snap-center bg-white/[0.03] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.05] transition-colors group cursor-default flex flex-col justify-between h-32 md:h-auto">
    <div className="flex justify-between items-start mb-2">
      <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">{data.name}</span>
      {data.trend === 'up' ? <ArrowUpRight size={14} className="text-emerald-400"/> : data.trend === 'down' ? <ArrowDownRight size={14} className="text-rose-400"/> : <ArrowRight size={14} className="text-gray-400"/>}
    </div>
    <div>
      <h4 className="text-lg md:text-xl font-bold text-white">{data.value}</h4>
      <p className={`text-[10px] font-bold ${data.change > 0 ? 'text-emerald-400' : data.change < 0 ? 'text-rose-400' : 'text-gray-400'}`}>
        {data.change > 0 ? '+' : ''}{data.change}% (24h)
      </p>
    </div>
  </div>
)

// ... (SmartSimulator IGUAL) ...
const SmartSimulator = () => {
  const [amount, setAmount] = useState(1000)
  const [months, setMonths] = useState(12)
  const simulationData = useMemo(() => {
    const rate = 0.009 
    const totalInvested = amount
    const totalYield = amount * Math.pow(1 + rate, months)
    return [
      { name: 'Investido', valor: totalInvested },
      { name: 'Bruto', valor: totalYield },
    ]
  }, [amount, months])

  return (
    <GlassCard className="p-6 md:p-8 h-full flex flex-col" glow>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-purple-500/20 rounded-xl text-purple-400"><Calculator size={22}/></div>
        <div>
          <h3 className="text-lg font-bold text-white">Simulador Selic</h3>
          <p className="text-xs text-gray-400">Projeção baseada na taxa atual.</p>
        </div>
      </div>
      <div className="space-y-5 mb-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Valor a Investir</label>
          <div className="relative">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">R$</span>
             <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white font-mono focus:border-purple-500/50 outline-none transition-colors" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tempo (Meses)</label>
          <div className="flex items-center gap-2">
             <button onClick={() => setMonths(Math.max(1, months - 1))} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors text-lg font-bold">-</button>
             <div className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-center flex items-center justify-center">{months}</div>
             <button onClick={() => setMonths(months + 1)} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors text-lg font-bold">+</button>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={simulationData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" tick={{fill: '#9ca3af', fontSize: 11, fontWeight: 600}} width={65} axisLine={false} tickLine={false}/>
            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#09090b', border: '1px solid #333', borderRadius: '12px' }} formatter={(value: any) => [formatCurrency(value), 'Valor']} />
            <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={24}>
              {simulationData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#3f3f46' : '#a855f7'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex justify-between items-center">
         <div className="flex flex-col">
            <span className="text-xs text-purple-200 font-bold">Resultado Estimado</span>
            <span className="text-[10px] text-purple-300/50 uppercase tracking-wider">*Selic 11.25% a.a.</span>
         </div>
         <span className="text-lg md:text-xl font-black text-purple-400">{formatCurrency(simulationData[1].valor)}</span>
      </div>
    </GlassCard>
  )
}

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
  emergencyFund?: any 
  userProfile?: any   
  onUpdateEmergencyFund?: any
}

export default function InvestmentsView({ goals, onAddGoal }: InvestmentsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const displayGoals = Array.isArray(goals) ? goals : []

  return (
    <div className="space-y-8 md:space-y-10 pb-32">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6">
         <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-1 md:mb-2">Investimentos</h1>
            <p className="text-sm md:text-base text-gray-400 font-light flex items-center gap-2">
               Acompanhe, simule e planeje seu crescimento patrimonial.
            </p>
         </div>
      </header>

      {/* MARKET PANEL (Carrossel Contido) */}
      <section className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:grid md:grid-cols-4 pb-4 md:pb-0 scrollbar-hide">
         {MOCK_MARKET.map((item) => (
            <div key={item.id} className="min-w-[160px] md:min-w-0 snap-center">
                <MarketCard data={item} />
            </div>
         ))}
      </section>

      {/* PATRIMONY OVERVIEW */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
         
         <GlassCard className="lg:col-span-2 p-6 md:p-8 flex flex-col h-[350px] md:h-[420px]" glow>
            <div className="flex justify-between items-start mb-6">
               <div>
                  <div className="flex items-center gap-2 mb-1">
                     <Wallet className="text-blue-400 h-4 w-4 md:h-5 md:w-5" />
                     <h3 className="text-base md:text-lg font-bold text-white">Evolução Patrimonial</h3>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mt-1 md:mt-2">
                     R$ 65.000,00
                  </h2>
               </div>
               <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
                  <ShieldCheck size={14} className="text-blue-400"/>
                  <span className="text-[10px] md:text-xs font-bold text-blue-200 uppercase tracking-wide">Perfil Moderado</span>
               </div>
            </div>

            <div className="flex-1 w-full min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={EVOLUTION_DATA}>
                     <defs>
                        <linearGradient id="colorPatrimony" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                           <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                     <YAxis hide domain={['auto', 'auto']} />
                     <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #333', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} formatter={(value: any) => [formatCurrency(value), 'Patrimônio']} />
                     <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPatrimony)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </GlassCard>

         <GlassCard className="p-6 md:p-8 flex flex-col h-[300px] md:h-[420px]">
            <div className="flex items-center gap-2 mb-2">
               <PieIcon className="text-violet-400 h-5 w-5" />
               <h3 className="text-lg font-bold text-white">Alocação</h3>
            </div>
            <div className="flex-1 relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={ALLOCATION_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {ALLOCATION_DATA.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Pie>
                     <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #333', borderRadius: '12px' }} formatter={(value: any) => [`${value}%`, 'Alocação']} />
                  </PieChart>
               </ResponsiveContainer>
               <div className="absolute bottom-0 w-full flex justify-center gap-4">
                   {ALLOCATION_DATA.map(d => (
                       <div key={d.name} className="flex items-center gap-1.5">
                           <div className="w-2 h-2 rounded-full" style={{backgroundColor: d.color}}/>
                           <span className="text-[10px] text-gray-400 uppercase font-bold">{d.name}</span>
                       </div>
                   ))}
               </div>
            </div>
         </GlassCard>
      </section>

      {/* GOALS & SIMULATOR */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
         <div className="space-y-6">
            <SectionTitle icon={Target} title="Minhas Metas" subtitle="Acompanhe o progresso dos seus sonhos." />
            <div className="space-y-4">
               {displayGoals.length > 0 ? displayGoals.map((goal) => {
                  const percentage = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
                  return (
                     <GlassCard key={goal.id} className="p-5 md:p-6 group hover:border-white/20 transition-all cursor-pointer">
                        <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-white">
                                 {goal.title.includes('Carro') ? <Lock size={18}/> : <Target size={18}/>}
                              </div>
                              <div>
                                 <h4 className="text-sm md:text-base font-bold text-white group-hover:text-blue-300 transition-colors">{goal.title}</h4>
                                 <p className="text-[10px] md:text-xs text-gray-500">Prazo: {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'Indefinido'}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-base md:text-lg font-black text-white">{percentage.toFixed(0)}%</p>
                           </div>
                        </div>
                        <div className="h-3 w-full bg-[#1a1a1a] rounded-full overflow-hidden p-0.5 border border-white/5">
                           <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full rounded-full relative overflow-hidden" style={{ backgroundColor: goal.color || '#3b82f6' }}>
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
                           </motion.div>
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] md:text-xs font-medium">
                           <span className="text-gray-400">Atual: <span className="text-white">{formatCurrency(goal.current_amount)}</span></span>
                           <span className="text-gray-500">Meta: {formatCurrency(goal.target_amount)}</span>
                        </div>
                     </GlassCard>
                  )
               }) : (
                   <div className="p-8 text-center border-2 border-dashed border-white/10 rounded-3xl">
                       <Target className="mx-auto text-gray-600 mb-2 opacity-50" size={32} />
                       <p className="text-gray-500 text-sm mb-4">Nenhuma meta definida ainda.</p>
                   </div>
               )}
               <button onClick={() => setIsModalOpen(true)} className="w-full py-4 rounded-2xl border border-dashed border-white/10 text-gray-500 font-bold uppercase tracking-widest hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/5 transition-all flex items-center justify-center gap-2 text-xs md:text-sm">
                  <Plus size={18} /> Nova Meta
               </button>
            </div>
         </div>
         <div className="space-y-8">
            <SectionTitle icon={BrainCircuit} title="Inteligência Financeira" subtitle="Ferramentas para acelerar sua liberdade." />
            <div className="h-[500px] md:h-[550px]">
               <SmartSimulator />
            </div>
         </div>
      </section>

      {/* ADD GOAL MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} exit={{scale: 0.9, opacity: 0}} className="w-full max-w-md bg-[#09090b] border border-white/10 rounded-3xl p-6 md:p-8 relative shadow-2xl">
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
                   <div>
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome da Meta</label>
                      <input name="title" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 focus:bg-white/10 transition-all" placeholder="Ex: Viagem, Carro..." />
                   </div>
                   <div>
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Valor Alvo (R$)</label>
                      <input name="target" type="number" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 focus:bg-white/10 transition-all" placeholder="0.00" />
                   </div>
                   <div>
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Prazo</label>
                      <input name="deadline" type="date" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 focus:bg-white/10 transition-all [color-scheme:dark]" />
                   </div>
                   <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl mt-4 shadow-lg shadow-blue-900/20 transition-all active:scale-95">Criar Meta</button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}