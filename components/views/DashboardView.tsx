'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Target, ShieldCheck, CreditCard as CardIcon, Sparkles, Plus, RefreshCw, ChevronRight } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts'
import { formatCurrency } from '@/lib/utils'

// --- COMPONENTES VISUAIS ---

const PremiumCard = ({ children, className = "", delay = 0, glowColor = "from-blue-500/20" }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 30, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.6, delay: delay, ease: [0.23, 1, 0.32, 1] }}
    className={`relative group bg-[#09090b]/80 backdrop-blur-2xl rounded-[2rem] overflow-hidden border border-white/[0.08] ${className}`}
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${glowColor} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out pointer-events-none mix-blend-soft-light`} />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
    <div className="relative z-10 h-full">
      {children}
    </div>
  </motion.div>
)

const MetricCard = ({ title, value, subtext, trend, icon: Icon, colorTheme, delay, className = "" }: any) => {
    const themes: any = {
        blue: { icon: "text-blue-400", bg: "bg-blue-500/10", glow: "shadow-blue-500/30", gradient: "from-blue-400 to-indigo-500" },
        emerald: { icon: "text-emerald-400", bg: "bg-emerald-500/10", glow: "shadow-emerald-500/30", gradient: "from-emerald-400 to-teal-500" },
        rose: { icon: "text-rose-400", bg: "bg-rose-500/10", glow: "shadow-rose-500/30", gradient: "from-rose-400 to-pink-500" },
        violet: { icon: "text-violet-400", bg: "bg-violet-500/10", glow: "shadow-violet-500/30", gradient: "from-violet-400 to-purple-500" },
    }
    const theme = themes[colorTheme]

    return (
    <PremiumCard delay={delay} glowColor={`from-${colorTheme}-500/10`} className={`p-5 md:p-6 lg:p-8 flex flex-col justify-between min-h-[160px] md:min-h-[180px] ${className}`}>
        <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-2xl ${theme.bg} border border-white/5 shadow-lg ${theme.glow} relative overflow-hidden group-hover:scale-110 transition-transform duration-500`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
                <Icon className={`h-6 w-6 md:h-7 md:w-7 ${theme.icon} relative z-10`} />
            </div>
            
            {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold tracking-wide backdrop-blur-md border border-white/5 ${trend > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{trend > 0 ? '+' : ''}{trend}%</span>
            </div>
            )}
        </div>
        
        <div>
            <h3 className="text-[10px] md:text-sm text-gray-400 font-bold uppercase tracking-widest mb-1 md:mb-2 opacity-80">{title}</h3>
            <p className={`text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br ${theme.gradient} drop-shadow-sm truncate`}>
                {formatCurrency(value)}
            </p>
        </div>
    </PremiumCard>
    )
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#09090b]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
          <p className="text-2xl font-black text-blue-400">{formatCurrency(payload[0].value)}</p>
          <p className="text-[10px] text-gray-500 text-right mt-1 font-medium">Saldo do período</p>
        </div>
      );
    }
    return null;
};

interface DashboardViewProps {
  summary: any
  transactions: any[]
  recentTransactions: any[] 
  goals: any[]
  chartData: any[] 
  chartRange: '1M' | '3M' | '6M' | '1A' 
  setChartRange: (range: any) => void
  onNavigate: (tab: any) => void
}

export default function DashboardView({ 
  summary, 
  chartData, 
  chartRange, 
  setChartRange, 
  recentTransactions, 
  goals,
  onNavigate
}: DashboardViewProps) {
  
  const displayData = chartData && chartData.length > 0 ? chartData : [
      { name: 'Inicio', value: 0 },
      { name: 'Fim', value: 0 }
  ]
  
  const lastDataPoint = displayData[displayData.length - 1];

  return (
    <div className="p-4 md:p-10 space-y-6 md:space-y-10 max-w-[1800px] mx-auto pb-32">
      
      {/* 1. HERO CARDS (CARROSSEL MOBILE / GRID DESKTOP) */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 lg:gap-8 pb-4 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
         <MetricCard 
            title="Saldo Disponível" 
            value={summary.balance} 
            icon={Wallet} 
            colorTheme="blue" 
            delay={0}
            className="min-w-[85%] md:min-w-0 snap-center"
         />
         <MetricCard 
            title="Receita Mensal" 
            value={summary.income} 
            icon={TrendingUp} 
            colorTheme="emerald" 
            trend={12.5}
            delay={0.1}
            className="min-w-[85%] md:min-w-0 snap-center"
         />
         <MetricCard 
            title="Despesa Operacional" 
            value={summary.expense} 
            icon={TrendingDown} 
            colorTheme="rose" 
            delay={0.2}
            className="min-w-[85%] md:min-w-0 snap-center"
         />
         <MetricCard 
            title="Patrimônio Total" 
            value={summary.emergencyTotal + summary.balance} 
            icon={ShieldCheck} 
            colorTheme="violet" 
            delay={0.3}
            className="min-w-[85%] md:min-w-0 snap-center"
         />
      </div>

      {/* 2. ÁREA CENTRAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
         
         {/* GRÁFICO */}
         <PremiumCard className="lg:col-span-8 p-6 md:p-8 flex flex-col h-[450px] md:h-[550px]" delay={0.4} glowColor="from-blue-600/10">
            {/* Header do Gráfico (Responsivo) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-4 md:gap-0">
               <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                      Fluxo de Caixa <Sparkles className="text-blue-400 h-4 w-4 md:h-5 md:w-5 animate-pulse"/>
                  </h3>
                  <p className="text-xs md:text-sm text-gray-400 font-medium mt-1 tracking-wide">Evolução patrimonial em tempo real.</p>
               </div>
               
               {/* Botões de Filtro (Scroll no mobile se precisar) */}
               <div className="flex bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/5 w-full md:w-auto overflow-x-auto no-scrollbar">
                   {['1M', '3M', '6M', '1A'].map((range) => (
                       <button 
                           key={range} 
                           onClick={() => setChartRange(range)} 
                           className={`flex-1 md:flex-none px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                               chartRange === range 
                               ? 'bg-white text-black shadow-sm' 
                               : 'text-gray-400 hover:text-white'
                           }`}
                       >
                           {range}
                       </button>
                   ))}
               </div>
            </div>
            
            <div className="flex-1 w-full -ml-4">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={displayData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                          <linearGradient id="colorValuePremium" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                             <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.1}/>
                             <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <filter id="shadow" height="200%">
                             <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#3b82f6" floodOpacity="0.3"/>
                          </filter>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                      <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 600}} 
                          dy={15} 
                      />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2, strokeDasharray: '5 5' }}/>
                      <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3b82f6" 
                          strokeWidth={4}
                          fillOpacity={1} 
                          fill="url(#colorValuePremium)"
                          filter="url(#shadow)"
                      />
                      {lastDataPoint && (
                          <ReferenceDot
                             x={lastDataPoint.name}
                             y={lastDataPoint.value}
                             r={6}
                             fill="#60a5fa"
                             stroke="#fff"
                             strokeWidth={3}
                          >
                             <animate attributeName="r" from="6" to="10" dur="1.5s" begin="0s" repeatCount="indefinite" values="6; 10; 6" keyTimes="0; 0.5; 1" />
                             <animate attributeName="fillOpacity" from="1" to="0.5" dur="1.5s" begin="0s" repeatCount="indefinite" values="1; 0.5; 1" keyTimes="0; 0.5; 1" />
                          </ReferenceDot>
                      )}
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </PremiumCard>

         {/* LISTA DE ATIVIDADE RECENTE */}
         <PremiumCard className="lg:col-span-4 p-0 flex flex-col h-[450px] md:h-[550px]" delay={0.5} glowColor="from-violet-600/10">
            <div className="p-5 md:p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
               <div>
                   <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                       Atividade Recente <TrendingUp size={16} className="text-violet-400"/>
                   </h3>
               </div>
               <button onClick={() => onNavigate('transações')} className="p-2 hover:bg-white/5 rounded-full transition">
                    <ChevronRight className="text-gray-500" size={16} />
               </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4 space-y-2">
               {recentTransactions && recentTransactions.length > 0 ? (
                  recentTransactions.map((t: any, idx: number) => {
                      const isIncome = t.type === 'receita';
                      const isTransfer = t.type === 'transferencia';
                      
                      let iconBg = isIncome ? 'bg-emerald-500/10' : isTransfer ? 'bg-blue-500/10' : 'bg-rose-500/10';
                      let iconColor = isIncome ? 'text-emerald-400' : isTransfer ? 'text-blue-400' : 'text-rose-400';
                      let amountColor = isIncome ? 'text-emerald-400' : 'text-white';
                      let Icon = isIncome ? ArrowUpRight : isTransfer ? RefreshCw : ArrowDownRight;

                      return (
                      <motion.div 
                         initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}
                         key={t.id} 
                         className="flex items-center justify-between p-3 md:p-4 rounded-2xl hover:bg-white/5 transition-all duration-300 group border border-transparent hover:border-white/5"
                      >
                         <div className="flex items-center gap-3 md:gap-4">
                            <div className={`p-2 md:p-3 rounded-xl ${iconBg} ${iconColor} ring-1 ring-inset ring-white/5 group-hover:scale-105 transition-transform`}>
                               <Icon size={16} className="md:w-[18px] md:h-[18px]" strokeWidth={2.5} />
                            </div>
                            <div className="overflow-hidden">
                               <p className="text-sm font-bold text-white truncate w-28 md:w-32 group-hover:text-blue-200 transition-colors">{t.description}</p>
                               <p className="text-[10px] md:text-[11px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">{t.category}</p>
                            </div>
                         </div>
                         <span className={`font-mono font-black text-xs md:text-sm ${amountColor} tracking-tight`}>
                            {isIncome ? '+' : ''} {formatCurrency(t.amount)}
                         </span>
                      </motion.div>
                   )})
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3">
                      <TrendingUp size={30} className="opacity-20"/>
                      <p className="text-sm font-medium">Sem movimentações.</p>
                  </div>
               )}
            </div>
         </PremiumCard>
      </div>

      {/* 3. RODAPÉ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
         <PremiumCard className="p-6 md:p-8" delay={0.6} glowColor="from-pink-500/10">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
               <div className="p-2.5 bg-pink-500/10 rounded-xl text-pink-400 shadow-lg shadow-pink-500/20">
                   <Target size={24} />
               </div>
               <h3 className="text-lg md:text-xl font-bold text-white">Objetivos</h3>
            </div>
            <div className="space-y-6">
               {goals.length > 0 ? goals.slice(0,2).map((g: any) => {
                  const percentage = Math.min((g.current_amount / g.target_amount) * 100, 100);
                  return (
                  <div key={g.id} className="group">
                     <div className="flex justify-between text-sm mb-3">
                        <span className="text-white font-bold text-sm md:text-base">{g.title}</span>
                        <div className="text-right">
                           <span className="text-white font-black">{percentage.toFixed(0)}%</span>
                        </div>
                     </div>
                     <div className="h-3 w-full bg-[#1a1a1a] rounded-full overflow-hidden p-0.5 border border-white/5 group-hover:border-white/10 transition-colors">
                        <motion.div 
                           initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1.5, ease: "easeOut" }}
                           className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full relative"
                        >
                           <div className="absolute right-0 top-0 h-full w-10 bg-gradient-to-r from-transparent to-white/50 blur-sm" />
                        </motion.div>
                     </div>
                  </div>
               )}) : (
                   <div className="flex flex-col items-center justify-center py-6 md:py-10 border-2 border-dashed border-white/10 rounded-2xl">
                       <p className="text-gray-400 font-bold text-sm">Nenhuma meta.</p>
                       <button onClick={() => onNavigate('investimentos')} className="mt-2 text-pink-400 text-xs font-bold uppercase tracking-wider hover:underline">Criar Meta</button>
                   </div>
               )}
            </div>
         </PremiumCard>

         <PremiumCard className="p-1 overflow-hidden relative group" delay={0.7}>
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay pointer-events-none" />
            <div className="bg-gradient-to-br from-blue-900/40 via-[#09090b] to-[#09090b] h-full w-full rounded-[1.9rem] p-6 md:p-8 flex flex-col justify-center relative z-10 overflow-hidden">
               <div className="absolute -right-20 -top-20 h-64 w-64 bg-blue-500/20 blur-[100px] rounded-full group-hover:bg-blue-500/30 transition-all duration-700" />
               
               <CardIcon size={32} className="text-blue-400 mb-6 relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]" />
               <h3 className="text-xl md:text-2xl font-bold text-white max-w-xs leading-tight relative z-10">
                  Gerencie seus Cartões
               </h3>
               <p className="text-gray-400 mt-2 md:mt-3 max-w-sm relative z-10 mb-6 md:mb-8 font-medium text-sm">
                  Controle limites, faturas e vencimentos em um só lugar.
               </p>
               
               <button 
                  onClick={() => onNavigate('minha carteira')}
                  className="flex items-center justify-center gap-2 w-fit bg-white text-black px-6 py-3 md:px-8 md:py-4 rounded-xl font-bold hover:bg-blue-50 hover:scale-105 transition-all active:scale-95 shadow-xl shadow-blue-500/10 relative z-10 text-sm md:text-base"
               >
                   <Plus size={18} strokeWidth={3} /> Acessar Carteira
               </button>
            </div>
         </PremiumCard>
      </div>
    </div>
  )
}