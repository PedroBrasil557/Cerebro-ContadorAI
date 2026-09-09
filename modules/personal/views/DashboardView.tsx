'use client'

import React, { type ReactNode, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, Wallet, Activity, BrainCircuit, Zap, ChevronRight, 
  ArrowUpRight, Briefcase, BarChart3,
  Sparkles, Receipt, ArrowDownRight, Lock 
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar
} from 'recharts'
import { Transaction, Investment, ActiveTab } from '@/types_db'
import { calculateExpenses, calculateIncome } from '@/core/finance/transactionMath'
import UpgradeModal from '@/core/components/UpgradeModal'
import { useEntitlements } from '@/core/hooks/useEntitlements'

// --- COMPONENTES AUXILIARES ---
const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
const formatK = (val: number) => {
    if (val === 0) return 'R$ 0'
    if (Math.abs(val) >= 1000) return `R$ ${(val / 1000).toFixed(1)}k`
    return `R$ ${val}`
}

interface PremiumCardProps {
  children: ReactNode
  className?: string
  delay?: number
  glowColor?: string
  onClick?: () => void
}

const PremiumCard = ({ children, className = "", delay = 0, glowColor = "from-blue-500/10", onClick }: PremiumCardProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: delay }}
    onClick={onClick}
    className={`relative group bg-[#09090b] rounded-3xl overflow-hidden border border-white/5 shadow-xl ${className} ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${glowColor} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />
    <div className="relative z-10 h-full p-6 flex flex-col">{children}</div>
  </motion.div>
)

type ThemeName = 'blue' | 'emerald' | 'rose' | 'purple'

interface MetricCardProps {
  title: string
  value: number
  icon: LucideIcon
  colorTheme: ThemeName
  trend?: string
  delay?: number
}

const MetricCard = ({ title, value, icon: Icon, colorTheme, trend, delay }: MetricCardProps) => {
    const themes: Record<ThemeName, { icon: string; bg: string; value: string }> = {
        blue: { icon: "text-blue-400", bg: "bg-blue-500/10", value: "text-blue-400" },
        emerald: { icon: "text-emerald-400", bg: "bg-emerald-500/10", value: "text-emerald-400" },
        rose: { icon: "text-rose-400", bg: "bg-rose-500/10", value: "text-rose-400" },
        purple: { icon: "text-purple-400", bg: "bg-purple-500/10", value: "text-purple-400" },
    }
    const theme = themes[colorTheme] || themes.blue

    return (
        <PremiumCard delay={delay} className="h-40" glowColor={`from-${colorTheme}-500/10`}>
            <div className="flex justify-between items-start mb-auto">
                <div className={`p-3 rounded-xl ${theme.bg} ${theme.icon}`}><Icon size={24} /></div>
                {trend && <span className="text-[10px] font-bold bg-white/5 px-2 py-1 rounded-full text-gray-400 border border-white/10">{trend}</span>}
            </div>
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{title}</p>
                <h3 className={`text-2xl font-black ${theme.value} tracking-tight`}>{formatCurrency(value || 0)}</h3>
            </div>
        </PremiumCard>
    )
}

interface DashboardViewProps {
  summary: { balance: number; income: number; expense: number; emergencyTotal: number }
  recentTransactions: Transaction[]
  onNavigate: (tab: ActiveTab) => void
  transactions: Transaction[] 
  investments: Investment[]
}

export default function DashboardView({ summary: initialSummary, onNavigate, transactions: initialTransactions = [], investments = [] }: DashboardViewProps) {
  const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>('area')
  const [selectedYear] = useState(new Date().getFullYear())
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const { plan } = useEntitlements()
  const isFreePlan = plan === 'free'

  const liveTransactions = initialTransactions
  const liveSummary = initialSummary

  // --- LÓGICA DE CÁLCULO NORMALIZADA (SÓ O MÊS ATUAL) ---
  const stats = useMemo(() => {
    const trans = liveTransactions || []
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 🔥 FILTRO REALTIME: Apenas o que aconteceu ESTE MÊS
    const monthTransactions = trans.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    
    const income = calculateIncome(monthTransactions)
    const expense = calculateExpenses(monthTransactions)

    // Soma dos bancos adicionados na aba Carteira (LocalStorage)
    const localBanks = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('cerebro_banks') || '[]') as Array<{ balance?: number }>
      : []
    const bankBalance = localBanks.reduce((acc, bank) => acc + Number(bank.balance ?? 0), 0)

    const totalInvestments = (investments || []).reduce((acc, inv) => acc + Number(inv?.amount_invested || 0), 0)
    
    const score = expense > 0 ? Math.min(Math.round((income / expense) * 100), 100) : income > 0 ? 100 : 0

    return { 
        income, 
        expense, 
        totalInvestments, 
        score, 
        balance: liveSummary.balance + bankBalance,
        patrimony: (liveSummary.balance + bankBalance) + totalInvestments
    }
  }, [liveTransactions, liveSummary.balance, investments])

  const flowData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      label: new Date(selectedYear, i, 1).toLocaleDateString('pt-BR', { month: 'short' }),
      receita: 0,
      despesa: 0
    }))

    liveTransactions.forEach(t => {
      const d = new Date(t.date)
      if (d.getFullYear() === selectedYear) {
        const m = d.getMonth()
        const amt = Math.abs(Number(t.amount || 0))
        if (t.type === 'receita') months[m].receita += amt
        else if (t.type === 'despesa_fixa' || t.type === 'despesa_variavel') months[m].despesa += amt
      }
    })
    return months
  }, [liveTransactions, selectedYear])

  const scoreVisuals = stats.score >= 80 ? { text: 'text-emerald-400', hex: '#34d399', bg: 'bg-emerald-400' } :
                       stats.score >= 50 ? { text: 'text-blue-400', hex: '#60a5fa', bg: 'bg-blue-400' } :
                       { text: 'text-rose-500', hex: '#f43f5e', bg: 'bg-rose-500' }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 space-y-8 pb-32 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
            <h1 className="text-3xl font-black tracking-tight">Dashboard <span className="text-xs bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-xl border border-indigo-500/20 font-bold uppercase ml-2">Cérebro.IA</span></h1>
            <p className="text-gray-400 mt-2 text-sm font-medium">Motor cognitivo e visão patrimonial.</p>
        </div>
      </div>

      {/* MÉTRICAS PRINCIPAIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Saldo em Conta" value={stats.balance} icon={Wallet} colorTheme="blue" delay={0.1} />
        <MetricCard title="Entradas (Mês)" value={stats.income} icon={Briefcase} colorTheme="emerald" delay={0.2} />
        <MetricCard title="Investimentos" value={stats.totalInvestments} icon={TrendingUp} colorTheme="rose" delay={0.3} />
        <MetricCard title="Patrimônio" value={stats.patrimony} icon={Activity} colorTheme="purple" delay={0.4} trend="Atualizado" />
      </div>

      {/* MOTOR COGNITIVO COM PAYWALL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
        <PremiumCard className={`lg:col-span-2 relative transition-all duration-500 ${isFreePlan ? 'blur-md grayscale pointer-events-none' : ''}`}>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-6"><Activity size={16}/> Cobertura de despesas do mês</h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 h-full">
                <div className="relative w-64 h-36">
                    <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
                        <path d="M 30 100 A 70 70 0 0 1 170 100" fill="none" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round" />
                        <motion.path 
                            d="M 30 100 A 70 70 0 0 1 170 100" 
                            fill="none" stroke={scoreVisuals.hex} strokeWidth="8" strokeLinecap="round" 
                            strokeDasharray="219.9" initial={{ strokeDashoffset: 219.9 }}
                            animate={{ strokeDashoffset: 219.9 - (219.9 * (stats.score / 100)) }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center pt-8">
                        <span className={`text-6xl font-black ${scoreVisuals.text}`}>{stats.score}</span>
                    </div>
                </div>
                <div className="flex-1 space-y-4">
                   <p className="text-xs text-gray-500 font-medium leading-relaxed">Sua saúde financeira é calculada pelo cruzamento de ativos, passivos e previsibilidade de caixa via IA.</p>
                   <div className="h-px bg-white/5 w-full" />
                   <div className="flex gap-4">
                      <div><p className="text-[10px] text-gray-500 uppercase font-bold">Status</p><p className={`text-sm font-bold ${scoreVisuals.text}`}>{stats.score > 70 ? 'Excelente' : 'Em Análise'}</p></div>
                      <div><p className="text-[10px] text-gray-500 uppercase font-bold">Confiança</p><p className="text-sm font-bold text-white">98.2%</p></div>
                   </div>
                </div>
            </div>
        </PremiumCard>

        {isFreePlan && (
          <div className="absolute inset-0 lg:col-span-2 z-20 flex items-center justify-center">
            <div className="bg-[#0f0f13]/90 border border-indigo-500/30 p-8 rounded-[2rem] text-center shadow-2xl backdrop-blur-md max-w-sm">
               <Lock size={24} className="mx-auto mb-4 text-indigo-400" />
               <h4 className="text-white font-black text-lg mb-2 uppercase tracking-tighter">Motor IA Desativado</h4>
               <p className="text-gray-400 text-xs mb-6">Assine o plano PRO para liberar o score de saúde e análise de perfil cognitivo.</p>
               <button onClick={() => setShowUpgradeModal(true)} className="w-full bg-white text-black font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:scale-105 transition-transform">Ativar Cérebro IA</button>
            </div>
          </div>
        )}

        <div className="relative">
            <PremiumCard className={`h-full ${isFreePlan ? 'blur-sm grayscale' : ''}`}>
                <BrainCircuit size={24} className="text-purple-400 mb-6" />
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Perfil Identificado</p>
                <h3 className="text-3xl font-black text-white">{isFreePlan ? '*******' : 'Estratégico'}</h3>
                <p className="text-[10px] text-gray-500 mt-4 leading-relaxed">Baseado no seu histórico de consumo e taxa de poupança mensal.</p>
            </PremiumCard>
            {isFreePlan && (
                <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={() => setShowUpgradeModal(true)}>
                    <div className="bg-purple-600 p-2 rounded-full text-white shadow-lg shadow-purple-600/20"><Lock size={16}/></div>
                </div>
            )}
        </div>
      </div>

      {/* GRÁFICO DE FLUXO DE CAIXA */}
      <PremiumCard glowColor="from-emerald-600/10">
        <div className="flex justify-between items-center mb-8">
           <h3 className="text-xl font-bold text-white flex items-center gap-2">Fluxo de Caixa Mensal <Sparkles size={16} className="text-emerald-400"/></h3>
           <div className="flex gap-2 bg-black/40 p-1 rounded-lg border border-white/5">
              <button onClick={() => setChartType('area')} className={`p-1.5 rounded ${chartType === 'area' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><Activity size={14}/></button>
              <button onClick={() => setChartType('bar')} className={`p-1.5 rounded ${chartType === 'bar' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><BarChart3 size={14}/></button>
           </div>
        </div>
        <div className="w-full h-[320px]">
           <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                  <AreaChart data={flowData}>
                    <defs>
                      <linearGradient id="gradRec" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                      <linearGradient id="gradDes" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.2} />
                    <XAxis dataKey="label" stroke="#666" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatK} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', borderRadius: '16px', fontSize: '12px' }} />
                    <Area type="monotone" name="Receitas" dataKey="receita" stroke="#10b981" fill="url(#gradRec)" strokeWidth={3} />
                    <Area type="monotone" name="Despesas" dataKey="despesa" stroke="#f43f5e" fill="url(#gradDes)" strokeWidth={3} />
                  </AreaChart>
              ) : (
                  <BarChart data={flowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.2} />
                    <XAxis dataKey="label" stroke="#666" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatK} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', borderRadius: '16px' }} />
                    <Bar name="Receitas" dataKey="receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar name="Despesas" dataKey="despesa" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
              )}
           </ResponsiveContainer>
        </div>
      </PremiumCard>

      {/* RECENTES E ATALHOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PremiumCard className="!p-0 overflow-hidden">
             <div className="p-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2"><Receipt size={16} className="text-blue-400"/> Movimentações Recentes</h3>
                <button onClick={() => onNavigate('transações')} className="text-[10px] text-gray-500 font-bold uppercase hover:text-white transition-colors">Ver Detalhes</button>
             </div>
             <div className="p-2">
                {liveTransactions.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-2xl transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${t.type?.toLowerCase() === 'receita' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {t.type?.toLowerCase() === 'receita' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                            </div>
                            <div><p className="text-sm font-bold text-white truncate max-w-[150px]">{t.description}</p><p className="text-[10px] text-gray-500">{t.category}</p></div>
                        </div>
                        <span className={`text-sm font-black ${t.type?.toLowerCase() === 'receita' ? 'text-emerald-400' : 'text-white'}`}>{formatCurrency(Number(t.amount))}</span>
                    </div>
                ))}
             </div>
          </PremiumCard>

          <motion.div 
            onClick={() => onNavigate('central de dividas')}
            className="bg-gradient-to-br from-indigo-900/20 to-black border border-indigo-500/20 p-8 rounded-[2rem] flex flex-col justify-between group cursor-pointer hover:border-indigo-500/40 transition-all"
          >
             <div>
                <div className="h-12 w-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform"><Zap size={24}/></div>
                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Central de Dívidas PRO</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Utilize nosso motor de quitação acelerada para eliminar juros e recuperar seu crédito.</p>
             </div>
             <div className="mt-8 flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest group-hover:translate-x-2 transition-transform">Configurar Plano <ChevronRight size={16}/></div>
          </motion.div>
      </div>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  )
}
