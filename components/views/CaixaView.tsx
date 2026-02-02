'use client'

import React from 'react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ShieldCheck, AlertTriangle, TrendingUp, Lock, CalendarClock, 
  Info, Settings2, AlertOctagon, Landmark, PiggyBank, History, Activity
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
    {glow && <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />}
    <div className="relative z-10">{children}</div>
  </motion.div>
)

const StatusBadge = ({ status }: { status: 'healthy' | 'warning' | 'critical' }) => {
  const config = {
    healthy: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: ShieldCheck, text: 'Caixa Saudável' },
    warning: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle, text: 'Atenção Necessária' },
    critical: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: AlertOctagon, text: 'Nível Crítico' }
  }[status]
  const Icon = config.icon
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bg} ${config.border} ${config.color}`}>
      <Icon size={14} />
      <span className="text-xs font-bold uppercase tracking-wide">{config.text}</span>
    </div>
  )
}

const KPICard = ({ label, value, subtext, icon: Icon, trend }: any) => (
  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors group">
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
      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-xl font-black text-white">{value}</h3>
      {subtext && <p className="text-[10px] text-gray-400 mt-1">{subtext}</p>}
    </div>
  </div>
)

const Simulator = ({ currentReserve, monthlyBurn }: { currentReserve: number, monthlyBurn: number }) => {
  const [extraContribution, setExtraContribution] = useState(0)
  const [months, setMonths] = useState(6)
  const projectedReserve = currentReserve + (extraContribution * months)
  const projectedRunway = calculateRunway(projectedReserve, monthlyBurn)

  return (
    <GlassCard className="p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="text-emerald-400 h-5 w-5" />
          <h3 className="text-lg font-bold text-white">Simulador de Futuro</h3>
        </div>
        <p className="text-sm text-gray-400 mb-6">Veja como aportes extras impactam a segurança.</p>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
              <label>Aporte Extra Mensal</label>
              <span className="text-emerald-400">{formatCurrency(extraContribution)}</span>
            </div>
            <input type="range" min="0" max="5000" step="100" value={extraContribution} onChange={(e) => setExtraContribution(Number(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
              <label>Período de Acumulação</label>
              <span className="text-white">{months} meses</span>
            </div>
            <input type="range" min="1" max="24" step="1" value={months} onChange={(e) => setMonths(Number(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500" />
          </div>
        </div>
      </div>
      <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-emerald-900/40 to-black border border-emerald-500/20">
        <p className="text-xs text-emerald-200 font-medium mb-1">Projeção de Runway</p>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-black text-white">{projectedRunway.toFixed(1)}</span>
          <span className="text-sm font-bold text-gray-400 mb-1">meses</span>
        </div>
        <div className="mt-2 text-xs text-gray-500">Saldo: <span className="text-white font-bold">{formatCurrency(projectedReserve)}</span></div>
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
    <div className="p-6 md:p-10 space-y-8 max-w-[1800px] mx-auto pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
         <div>
            <div className="flex items-center gap-3 mb-2">
               <h1 className="text-4xl font-black text-white tracking-tight">Caixa Empresarial</h1>
               <StatusBadge status={status} />
            </div>
            <p className="text-gray-400 font-light max-w-lg">Gestão inteligente da reserva de segurança.</p>
         </div>
         <div className="bg-[#0f0f0f] border border-white/10 px-5 py-3 rounded-xl flex flex-col items-end">
             <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 group cursor-help">Runway <Info size={12} /></div>
             <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-black ${status === 'healthy' ? 'text-emerald-400' : status === 'warning' ? 'text-amber-400' : 'text-rose-400'}`}>{runway.toFixed(1)}</span>
                <span className="text-sm font-bold text-white">Meses</span>
             </div>
         </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <GlassCard className="lg:col-span-2 p-8 relative overflow-hidden flex flex-col justify-between min-h-[320px]" glow>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-[#09090b] to-[#09090b] z-0" />
            <div className="relative z-10">
               <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-3">
                     <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]"><Lock size={24} /></div>
                     <div><h2 className="text-lg font-bold text-white">Reserva Disponível</h2><p className="text-xs text-emerald-200/60 font-medium">Líquido</p></div>
                  </div>
                  <button className="text-xs font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-widest border border-emerald-500/20 px-4 py-2 rounded-lg bg-emerald-500/5 hover:bg-emerald-500/10 transition">Resgatar</button>
               </div>
               <div className="mb-8"><h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-emerald-300 tracking-tight drop-shadow-lg">{formatCurrency(safeData.currentBalance)}</h1></div>
            </div>
            <div className="relative z-10 space-y-3">
               <div className="flex justify-between text-xs font-bold text-emerald-200/80 uppercase tracking-wider"><span>Progresso da Meta</span><span>{percentReached.toFixed(0)}% de {formatCurrency(safeData.monthlyGoal)}</span></div>
               <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden p-1 border border-white/5 backdrop-blur-sm">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${percentReached}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full relative overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                     <div className="absolute inset-0 bg-white/20 animate-pulse-slow" />
                  </motion.div>
               </div>
            </div>
         </GlassCard>
         <div className="grid grid-rows-3 gap-4">
             <KPICard label="Giro Mensal" value="R$ 18.450" subtext="Média 3 meses" icon={Activity} trend={12} />
             <KPICard label="Entrada Média" value="R$ 2.100" subtext="Aportes" icon={TrendingUp} trend={5} />
             <KPICard label="Imposto Estimado" value={`R$ ${(safeData.currentBalance * (safeData.taxRate/100)).toFixed(2)}`} subtext={`Reserva (${safeData.taxRate}%)`} icon={Landmark} />
         </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <GlassCard className="p-8 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-6">
               <div className={`p-3 rounded-xl border ${status === 'healthy' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}><Activity size={24} /></div>
               <h3 className="text-xl font-bold text-white">Saúde do Caixa</h3>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 mb-6">
               <p className="text-lg text-white font-medium leading-relaxed">
                  {status === 'healthy' ? "Parabéns! Caixa robusto." : status === 'warning' ? "Atenção: Reserva cobre < 4 meses." : "Crítico: Priorize o caixa."}
               </p>
            </div>
         </GlassCard>
         <Simulator currentReserve={safeData.currentBalance} monthlyBurn={estimatedMonthlyBurn} />
      </section>

      <section>
         <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-2"><History className="text-gray-400" /><h2 className="text-xl font-bold text-white">Entradas Recentes</h2></div>
         </div>
         <div className="space-y-3">
             {safeData.entries.length > 0 ? safeData.entries.map((t) => (
                <GlassCard key={t.id} className="p-4 flex items-center justify-between group hover:border-white/10 transition-all">
                   <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full border ${t.type === 'receita' || t.type === 'transferencia' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                         {(t.type === 'receita' || t.type === 'transferencia') ? <PiggyBank size={18} /> : <Landmark size={18} />}
                      </div>
                      <div>
                         <p className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">{t.description}</p>
                         <p className="text-xs text-gray-500 flex items-center gap-2"><CalendarClock size={12} /> {new Date(t.date).toLocaleDateString()} <span className="w-1 h-1 rounded-full bg-gray-700" /> {t.source || 'Sistema'}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className={`font-mono font-bold text-base ${(t.type === 'receita' || t.type === 'transferencia') ? 'text-emerald-400' : 'text-white'}`}>{(t.type === 'receita' || t.type === 'transferencia') ? '+' : ''} {formatCurrency(t.amount)}</p>
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{(t.type === 'receita' || t.type === 'transferencia') ? 'Recebido' : 'Pago'}</p>
                   </div>
                </GlassCard>
             )) : (
                <div className="text-center py-10 text-gray-500 bg-white/5 rounded-xl border border-white/5">Nenhuma movimentação registrada.</div>
             )}
         </div>
      </section>
    </div>
  )
}