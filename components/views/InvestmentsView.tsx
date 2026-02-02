'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, ArrowRight, Target, ShieldCheck, Wallet, Sparkles, 
  PieChart as PieIcon, Calculator, Plus, Lock, BrainCircuit, X 
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid 
} from 'recharts'
import { Goal } from '@/types_db' 
import { formatCurrency } from '@/lib/utils'

// --- MOCKS VISUAIS ---
const MOCK_MARKET = [
  { id: 'selic', name: 'Taxa Selic', value: '11.25%', change: 0, trend: 'neutral', data: [10.5, 10.75, 11.25, 11.25, 11.25] },
  { id: 'cdi', name: 'CDI Hoje', value: '11.15%', change: 0.02, trend: 'up', data: [10.4, 10.65, 11.15, 11.15, 11.15] },
  { id: 'dolar', name: 'Dólar Ptax', value: 'R$ 5.29', change: -0.45, trend: 'down', data: [5.10, 5.15, 5.35, 5.32, 5.29] },
  { id: 'btc', name: 'Bitcoin', value: 'R$ 342k', change: 2.3, trend: 'up', data: [310, 325, 318, 335, 342] },
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

// --- UI COMPONENTS ---

const GlassCard = ({ children, className = "", glow = false }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`relative bg-[#09090b]/60 backdrop-blur-xl border border-white/[0.06] rounded-3xl overflow-hidden shadow-2xl ${className}`}
  >
    {glow && <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />}
    <div className="relative z-10">{children}</div>
  </motion.div>
)

const MarketCard = ({ data }: { data: any }) => (
  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.05] transition-colors group cursor-default">
    <div className="flex justify-between items-start mb-2">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{data.name}</span>
      {data.trend === 'up' ? <TrendingUp size={14} className="text-emerald-400"/> : <ArrowRight size={14} className="text-gray-400"/>}
    </div>
    <div className="flex items-end justify-between">
      <div>
        <h4 className="text-xl font-bold text-white">{data.value}</h4>
        <p className={`text-[10px] font-bold ${data.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {data.change > 0 ? '+' : ''}{data.change}% (24h)
        </p>
      </div>
    </div>
  </div>
)

const SmartSimulator = () => {
  const [amount, setAmount] = useState(1000)
  const [months, setMonths] = useState(12)
  
  const simulationData = useMemo(() => {
    const rate = 0.009 // ~0.9% a.m.
    const totalInvested = amount
    const totalYield = amount * Math.pow(1 + rate, months)
    
    return [
      { name: 'Investido', valor: totalInvested },
      { name: 'Bruto', valor: totalYield },
    ]
  }, [amount, months])

  return (
    <GlassCard className="p-6 h-full flex flex-col" glow>
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><Calculator size={20}/></div>
        <div>
          <h3 className="text-lg font-bold text-white">Simulador Selic</h3>
          <p className="text-xs text-gray-400">Projeção baseada na taxa atual.</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase">Valor a Investir</label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:border-purple-500/50 outline-none transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase">Tempo (Meses)</label>
          <div className="flex items-center gap-2">
             <button onClick={() => setMonths(Math.max(1, months - 1))} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors">-</button>
             <div className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-center">{months}</div>
             <button onClick={() => setMonths(months + 1)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors">+</button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={simulationData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" tick={{fill: '#9ca3af', fontSize: 12}} width={60} axisLine={false} tickLine={false}/>
            <Tooltip 
              cursor={{fill: 'transparent'}}
              contentStyle={{ backgroundColor: '#09090b', border: '1px solid #333', borderRadius: '12px' }}
              formatter={(value: any) => [formatCurrency(value), 'Valor']}
            />
            <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={32}>
              {simulationData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#3f3f46' : '#a855f7'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex justify-between items-center">
         <div className="flex flex-col">
            <span className="text-xs text-purple-200">Resultado Estimado (Bruto)</span>
            <span className="text-[10px] text-purple-300/50">*Baseado na Selic de 15% a.a.</span>
         </div>
         <span className="text-xl font-bold text-purple-400">{formatCurrency(simulationData[1].valor)}</span>
      </div>
    </GlassCard>
  )
}

const SectionTitle = ({ icon: Icon, title, subtitle }: any) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="text-blue-400 h-5 w-5" />
      <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-gray-400 ml-7">{subtitle}</p>}
  </div>
)

// --- INTERFACE PRINCIPAL ---
interface InvestmentsViewProps {
  goals: Goal[]
  onAddGoal: (goal: any) => void
}

export default function InvestmentsView({ goals, onAddGoal }: InvestmentsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Garante que goals seja array
  const displayGoals = Array.isArray(goals) ? goals : []

  return (
    <div className="p-6 md:p-10 space-y-10 max-w-[1800px] mx-auto pb-32">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
         <div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">Investimentos</h1>
            <p className="text-gray-400 font-light flex items-center gap-2">
               Acompanhe, simule e planeje seu crescimento patrimonial.
            </p>
         </div>
      </header>

      {/* MARKET PANEL */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {MOCK_MARKET.map((item) => (
            <MarketCard key={item.id} data={item} />
         ))}
      </section>

      {/* PATRIMONY OVERVIEW */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto lg:h-[420px]">
         
         <GlassCard className="lg:col-span-2 p-8 flex flex-col" glow>
            <div className="flex justify-between items-start mb-6">
               <div>
                  <div className="flex items-center gap-2 mb-1">
                     <Wallet className="text-blue-400 h-5 w-5" />
                     <h3 className="text-lg font-bold text-white">Evolução Patrimonial</h3>
                  </div>
                  <h2 className="text-4xl font-black text-white tracking-tight mt-2">
                     R$ 65.000,00
                  </h2>
               </div>
               <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
                  <ShieldCheck size={14} className="text-blue-400"/>
                  <span className="text-xs font-bold text-blue-200">Perfil Moderado</span>
               </div>
            </div>

            <div className="flex-1 w-full min-h-[200px]">
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
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid #333', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: any) => [formatCurrency(value), 'Patrimônio']}
                     />
                     <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorPatrimony)" 
                     />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </GlassCard>

         <GlassCard className="p-8 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
               <PieIcon className="text-violet-400 h-5 w-5" />
               <h3 className="text-lg font-bold text-white">Alocação</h3>
            </div>
            
            <div className="flex-1 relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={ALLOCATION_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                     >
                        {ALLOCATION_DATA.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Pie>
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid #333', borderRadius: '12px' }}
                        formatter={(value: any) => [`${value}%`, 'Alocação']}
                     />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </GlassCard>
      </section>

      {/* GOALS & SIMULATOR */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         
         <div className="space-y-6">
            <SectionTitle icon={Target} title="Minhas Metas" subtitle="Acompanhe o progresso dos seus sonhos." />
            
            <div className="space-y-4">
               {displayGoals.map((goal) => {
                  const percentage = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
                  return (
                     <GlassCard key={goal.id} className="p-6 group hover:border-white/20 transition-all">
                        <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-white">
                                 {goal.title.includes('Carro') ? <Lock size={18}/> : <Target size={18}/>}
                              </div>
                              <div>
                                 <h4 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">{goal.title}</h4>
                                 <p className="text-xs text-gray-500">Prazo: {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'Indefinido'}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-lg font-black text-white">{percentage.toFixed(0)}%</p>
                           </div>
                        </div>
                        
                        <div className="h-3 w-full bg-[#1a1a1a] rounded-full overflow-hidden p-0.5 border border-white/5">
                           <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${percentage}%` }} 
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className="h-full rounded-full relative overflow-hidden"
                              // CORREÇÃO: Uso de goal.color
                              style={{ backgroundColor: goal.color || '#3b82f6' }}
                           >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
                           </motion.div>
                        </div>
                        
                        <div className="flex justify-between mt-2 text-xs font-medium">
                           <span className="text-gray-400">Atual: <span className="text-white">{formatCurrency(goal.current_amount)}</span></span>
                           <span className="text-gray-500">Meta: {formatCurrency(goal.target_amount)}</span>
                        </div>
                     </GlassCard>
                  )
               })}
               
               <button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-4 rounded-2xl border border-dashed border-white/10 text-gray-500 font-bold uppercase tracking-widest hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/5 transition-all flex items-center justify-center gap-2"
               >
                  <Plus size={18} /> Nova Meta
               </button>
            </div>
         </div>

         <div className="space-y-8">
            <SectionTitle icon={BrainCircuit} title="Inteligência Financeira" subtitle="Ferramentas para acelerar sua liberdade." />
            
            <div className="h-[550px]">
               <SmartSimulator />
            </div>
         </div>

      </section>

      {/* ADD GOAL MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} exit={{scale: 0.9, opacity: 0}} className="w-full max-w-md bg-[#09090b] border border-white/10 rounded-3xl p-8 relative shadow-2xl">
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
                      <label className="text-xs font-bold text-gray-500 uppercase">Nome da Meta</label>
                      <input name="title" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 focus:bg-white/10 transition-all" placeholder="Ex: Viagem, Carro..." />
                   </div>
                   <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Valor Alvo (R$)</label>
                      <input name="target" type="number" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 focus:bg-white/10 transition-all" placeholder="0.00" />
                   </div>
                   <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Prazo</label>
                      <input name="deadline" type="date" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 focus:bg-white/10 transition-all" />
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