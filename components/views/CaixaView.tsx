'use client'

import React from 'react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ShieldCheck, AlertTriangle, TrendingUp, Lock, CalendarClock, 
  Info, Settings2, AlertOctagon, Landmark, PiggyBank, History, Activity,
  ArrowRight
} from 'lucide-react'
import { CaixaData } from '@/types_db' 
import { formatCurrency } from '@/lib/utils'

const calculateRunway = (reserve: number, monthlyCost: number) => {
  if (monthlyCost === 0) return 99
  return reserve / monthlyCost
}

const GlassCard = ({ children, className = "", glow = false }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`relative bg-[#09090b]/60 backdrop-blur-xl border border-white/[0.06] rounded-3xl overflow-hidden shadow-2xl ${className}`}
  >
    {/* Noise Texture */}
    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
    
    {glow && <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />}
    <div className="relative z-10">{children}</div>
  </motion.div>
)

const StatusBadge = ({ status }: { status: 'healthy' | 'warning' | 'critical' }) => {
  const config = {
    healthy: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: ShieldCheck, text: 'Caixa Saudável' },
    warning: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle, text: 'Atenção' },
    critical: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: AlertOctagon, text: 'Crítico' }
  }[status]
  const Icon = config.icon
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bg} ${config.border} ${config.color}`}>
      <Icon size={14} />
      <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide">{config.text}</span>
    </div>
  )
}

const KPICard = ({ label, value, subtext, icon: Icon, trend }: any) => (
  <div className="min-w-[160px] md:min-w-0 snap-center p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors group flex flex-col justify-between h-32 md:h-auto">
    <div className="flex justify-between items-start mb-2">
      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
        <Icon size={18} />
      </div>
      {trend && (
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div>
      <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-lg md:text-xl font-black text-white truncate">{value}</h3>
      {subtext && <p className="text-[10px] text-gray-400 mt-1 truncate">{subtext}</p>}
    </div>
  </div>
)

const Simulator = ({ currentReserve, monthlyBurn }: { currentReserve: number, monthlyBurn: number }) => {
  const [extraContribution, setExtraContribution] = useState(0)
  const [months, setMonths] = useState(6)
  const projectedReserve = currentReserve + (extraContribution * months)
  const projectedRunway = calculateRunway(projectedReserve, monthlyBurn)

  return (
    <GlassCard className="p-6 md:p-8 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="text-emerald-400 h-5 w-5" />
          <h3 className="text-lg font-bold text-white">Simulador de Futuro</h3>
        </div>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">Veja como aportes extras impactam a segurança do seu negócio.</p>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
              <label>Aporte Extra Mensal</label>
              <span className="text-emerald-400 font-mono">{formatCurrency(extraContribution)}</span>
            </div>
            <input 
               type="range" min="0" max="5000" step="100" 
               value={extraContribution} 
               onChange={(e) => setExtraContribution(Number(e.target.value))} 
               className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
              <label>Período de Acumulação</label>
              <span className="text-white font-mono">{months} meses</span>
            </div>
            <input 
               type="range" min="1" max="24" step="1" 
               value={months} 
               onChange={(e) => setMonths(Number(e.target.value))} 
               className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500" 
            />
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-emerald-900/40 to-black border border-emerald-500/20">
        <p className="text-xs text-emerald-200 font-medium mb-1 uppercase tracking-wide">Projeção de Runway</p>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-black text-white tracking-tighter">{projectedRunway.toFixed(1)}</span>
          <span className="text-sm font-bold text-gray-400 mb-1.5">meses</span>
        </div>
        <div className="mt-2 text-xs text-gray-500 font-medium">Saldo Projetado: <span className="text-white font-bold ml-1">{formatCurrency(projectedReserve)}</span></div>
      </div>
    </GlassCard>
  )
}

interface CaixaViewProps {
  data: CaixaData
}

export default function CaixaView({ data }: CaixaViewProps) {
  const safeData = data || { currentBalance: 0, monthlyGoal: 15000, taxRate: 6, entries: [] }
  const estimatedMonthlyBurn = safeData.monthlyGoal * 0.5 
  const runway = calculateRunway(safeData.currentBalance, estimatedMonthlyBurn)
  
  let status: 'healthy' | 'warning' | 'critical' = 'healthy'
  if (runway < 2) status = 'critical'
  else if (runway < 4) status = 'warning'

  const percentReached = Math.min((safeData.currentBalance / safeData.monthlyGoal) * 100, 100)

  return (
    <div className="p-4 md:p-10 space-y-8 md:space-y-10 max-w-[1800px] mx-auto pb-32">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6">
         <div className="w-full md:w-auto">
            <div className="flex flex-wrap items-center gap-3 mb-2">
               <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Caixa Empresarial</h1>
               <StatusBadge status={status} />
            </div>
            <p className="text-sm md:text-base text-gray-400 font-light max-w-lg">Gestão inteligente da reserva de segurança.</p>
         </div>
         
         <div className="w-full md:w-auto bg-[#0f0f0f] border border-white/10 px-5 py-3 rounded-xl flex items-center justify-between md:flex-col md:items-end gap-2 md:gap-0">
             <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 group cursor-help">
                Runway <Info size={12} />
             </div>
             <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-black ${status === 'healthy' ? 'text-emerald-400' : status === 'warning' ? 'text-amber-400' : 'text-rose-400'}`}>{runway.toFixed(1)}</span>
                <span className="text-sm font-bold text-white">Meses</span>
             </div>
         </div>
      </header>

      {/* RESERVA & KPIs */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
         
         {/* Card Principal */}
         <GlassCard className="lg:col-span-2 p-6 md:p-8 relative overflow-hidden flex flex-col justify-between min-h-[300px] md:min-h-[320px]" glow>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-[#09090b] to-[#09090b] z-0" />
            <div className="relative z-10">
               <div className="flex justify-between items-start mb-6 md:mb-8">
                  <div className="flex items-center gap-3">
                     <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <Lock size={24} />
                     </div>
                     <div>
                        <h2 className="text-base md:text-lg font-bold text-white">Reserva Disponível</h2>
                        <p className="text-xs text-emerald-200/60 font-medium">Líquido</p>
                     </div>
                  </div>
                  <button className="text-[10px] md:text-xs font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-widest border border-emerald-500/20 px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-emerald-500/5 hover:bg-emerald-500/10 transition">
                     Resgatar
                  </button>
               </div>
               <div className="mb-6 md:mb-8">
                  <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-emerald-300 tracking-tight drop-shadow-lg truncate">
                     {formatCurrency(safeData.currentBalance)}
                  </h1>
               </div>
            </div>
            
            <div className="relative z-10 space-y-3">
               <div className="flex justify-between text-[10px] md:text-xs font-bold text-emerald-200/80 uppercase tracking-wider">
                  <span>Progresso da Meta</span>
                  <span>{percentReached.toFixed(0)}% de {formatCurrency(safeData.monthlyGoal)}</span>
               </div>
               <div className="h-3 md:h-4 w-full bg-black/40 rounded-full overflow-hidden p-1 border border-white/5 backdrop-blur-sm">
                  <motion.div 
                     initial={{ width: 0 }} animate={{ width: `${percentReached}%` }} transition={{ duration: 1.5, ease: "easeOut" }} 
                     className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full relative overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                  >
                     <div className="absolute inset-0 bg-white/20 animate-pulse-slow" />
                  </motion.div>
               </div>
            </div>
         </GlassCard>

         {/* KPIs Grid (Carrossel Mobile) */}
         <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 md:grid md:grid-rows-3 md:gap-4 pb-2 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
             <KPICard label="Giro Mensal" value="R$ 18.450" subtext="Média 3 meses" icon={Activity} trend={12} />
             <KPICard label="Entrada Média" value="R$ 2.100" subtext="Aportes" icon={TrendingUp} trend={5} />
             <KPICard label="Imposto Estimado" value={`R$ ${(safeData.currentBalance * (safeData.taxRate/100)).toFixed(2)}`} subtext={`Reserva (${safeData.taxRate}%)`} icon={Landmark} />
         </div>
      </section>

      {/* ANÁLISE E SIMULADOR */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
         <GlassCard className="p-6 md:p-8 flex flex-col justify-center min-h-[250px]">
            <div className="flex items-center gap-3 mb-6">
               <div className={`p-3 rounded-xl border ${status === 'healthy' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                  <Activity size={24} />
               </div>
               <h3 className="text-lg md:text-xl font-bold text-white">Saúde do Caixa</h3>
            </div>
            <div className="p-5 md:p-6 rounded-2xl bg-white/[0.03] border border-white/5 mb-2">
               <p className="text-base md:text-lg text-white font-medium leading-relaxed">
                  {status === 'healthy' ? "Parabéns! Seu caixa está robusto e cobre mais de 6 meses de operação." : status === 'warning' ? "Atenção: Sua reserva cobre menos de 4 meses. Evite gastos supérfluos." : "Crítico: Priorize o caixa imediatamente. Sua operação corre risco."}
               </p>
            </div>
         </GlassCard>
         
         <Simulator currentReserve={safeData.currentBalance} monthlyBurn={estimatedMonthlyBurn} />
      </section>

      {/* HISTÓRICO */}
      <section>
         <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-2">
                <History className="text-gray-400" />
                <h2 className="text-lg md:text-xl font-bold text-white">Entradas Recentes</h2>
             </div>
         </div>
         <div className="space-y-3">
             {safeData.entries.length > 0 ? safeData.entries.map((t) => (
                <GlassCard key={t.id} className="p-4 flex items-center justify-between group hover:border-white/10 transition-all">
                   <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                      <div className={`p-3 rounded-full border shrink-0 ${t.type === 'receita' || t.type === 'transferencia' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                         {(t.type === 'receita' || t.type === 'transferencia') ? <PiggyBank size={18} /> : <Landmark size={18} />}
                      </div>
                      <div className="overflow-hidden">
                         <p className="text-sm font-bold text-white truncate group-hover:text-blue-300 transition-colors">{t.description}</p>
                         <p className="text-[10px] md:text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1"><CalendarClock size={10} /> {new Date(t.date).toLocaleDateString()}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-700" /> 
                            <span className="truncate">{t.source || 'Sistema'}</span>
                         </p>
                      </div>
                   </div>
                   <div className="text-right shrink-0">
                      <p className={`font-mono font-bold text-sm md:text-base ${(t.type === 'receita' || t.type === 'transferencia') ? 'text-emerald-400' : 'text-white'}`}>{(t.type === 'receita' || t.type === 'transferencia') ? '+' : ''} {formatCurrency(t.amount)}</p>
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{(t.type === 'receita' || t.type === 'transferencia') ? 'Recebido' : 'Pago'}</p>
                   </div>
                </GlassCard>
             )) : (
                <div className="text-center py-10 text-gray-500 bg-white/5 rounded-xl border border-white/5 text-sm">Nenhuma movimentação registrada.</div>
             )}
         </div>
      </section>
    </div>
  )
}