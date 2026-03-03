'use client'

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, Wallet, Target, ShieldAlert, Activity, 
  BrainCircuit, Zap, ChevronRight, Scale, ArrowUpRight,
  Briefcase, Calendar, ChevronDown, BarChart3, LineChart, Sparkles,
  Receipt, ArrowDownRight
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, LineChart as RechartsLineChart, Line
} from 'recharts'
import { Transaction, Goal, CreditCard, Investment } from '@/types_db'

// --- COMPONENTES VISUAIS AUXILIARES ---
const PremiumCard = ({ children, className = "", delay = 0, glowColor = "from-blue-500/10" }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: delay }}
    className={`relative group bg-[#09090b] rounded-3xl overflow-hidden border border-white/5 shadow-xl ${className}`}
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${glowColor} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />
    <div className="relative z-10 h-full p-6 flex flex-col">
      {children}
    </div>
  </motion.div>
)

const MetricCard = ({ title, value, icon: Icon, colorTheme, trend, delay, subtext }: any) => {
    const themes: any = {
        blue: { icon: "text-blue-400", bg: "bg-blue-500/10", value: "text-blue-400" },
        emerald: { icon: "text-emerald-400", bg: "bg-emerald-500/10", value: "text-emerald-400" },
        rose: { icon: "text-rose-400", bg: "bg-rose-500/10", value: "text-rose-400" },
        purple: { icon: "text-purple-400", bg: "bg-purple-500/10", value: "text-purple-400" },
    }
    const theme = themes[colorTheme] || themes.blue

    return (
        <PremiumCard delay={delay} className="h-40" glowColor={`from-${colorTheme}-500/10`}>
            <div className="flex justify-between items-start mb-auto">
                <div className={`p-3 rounded-xl ${theme.bg} ${theme.icon}`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <span className="text-[10px] font-bold bg-white/5 px-2 py-1 rounded-full text-gray-400 border border-white/10">
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{title}</p>
                <h3 className={`text-2xl font-black ${theme.value} tracking-tight`}>{formatCurrency(value)}</h3>
                {subtext && <p className="text-[10px] text-gray-500 font-medium mt-1">{subtext}</p>}
            </div>
        </PremiumCard>
    )
}

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
const formatK = (val: number) => val === 0 ? 'R$ 0' : `R$ ${(val / 1000).toFixed(0)}k`

interface DashboardViewProps {
  summary: { balance: number; income: number; expense: number; emergencyTotal: number }
  recentTransactions: Transaction[]
  onNavigate: (tab: string) => void
  transactions: Transaction[] 
  goals: Goal[]
  cards: CreditCard[]
  investments: Investment[]
  chartData: any[] 
  chartRange: string
  setChartRange: (range: string) => void
}

export default function DashboardView({ 
  summary, onNavigate, transactions = [], recentTransactions = [], investments = []
}: DashboardViewProps) {
  
  const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>('area')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isYearMenuOpen, setIsYearMenuOpen] = useState(false)

  const safeTransactions = transactions || []
  const safeSummary = summary || { balance: 0, income: 0, expense: 0, emergencyTotal: 0 }

  // ============================================================================
  // 🧠 1. MOTOR COGNITIVO EMBUTIDO (IMPOSSÍVEL FALHAR)
  // ============================================================================
  const engineData = useMemo(() => {
    // 1. Somatórias de todo o histórico da conta
    const totalIncome = safeTransactions.filter(t => t?.type === 'receita').reduce((acc, t) => acc + Number(t?.amount || 0), 0)
    const totalFixed = safeTransactions.filter(t => t?.type !== 'receita' && t?.is_fixed).reduce((acc, t) => acc + Number(t?.amount || 0), 0)
    const totalDebt = safeTransactions.filter(t => t?.type !== 'receita' && (t?.category === 'Dívidas' || t?.category === 'Cartão de Crédito')).reduce((acc, t) => acc + Number(t?.amount || 0), 0)
    const totalExpense = safeTransactions.filter(t => t?.type !== 'receita').reduce((acc, t) => acc + Number(t?.amount || 0), 0)
    
    const monthlySavedAmount = safeSummary.balance > 0 ? safeSummary.balance : 0
    const emergencyFund = safeSummary.emergencyTotal || 0

    // 2. Proteção Anti-NaN (Evita divisão por zero)
    const safeMonthlyIncome = totalIncome > 0 ? totalIncome : 1
    const safeFixedExpenses = totalFixed > 0 ? totalFixed : 1

    // 3. CÁLCULO DAS 4 NOTAS (0 a 100)
    const savingsPct = (monthlySavedAmount / safeMonthlyIncome) * 100
    let savScore = Math.min((savingsPct / 20) * 100, 100)
    if (isNaN(savScore) || savScore < 0) savScore = 0

    const monthsCovered = (emergencyFund / safeFixedExpenses)
    let emergScore = Math.min((monthsCovered / 6) * 100, 100)
    if (isNaN(emergScore) || emergScore < 0) emergScore = 0

    const debtRatio = (totalDebt / safeMonthlyIncome) * 100
    let dbtScore = Math.max(100 - ((debtRatio / 30) * 100), 0)
    if (isNaN(dbtScore) || dbtScore < 0) dbtScore = 0

    // Se a receita for maior que despesa = nota máxima no fluxo.
    let cashScore = (totalIncome > totalExpense) ? 100 : (totalIncome > 0 ? 50 : 0)

    // 4. SOMA PONDERADA DO SCORE FINAL
    let finalScore = Math.round((savScore * 0.3) + (emergScore * 0.3) + (dbtScore * 0.25) + (cashScore * 0.15))
    if (isNaN(finalScore) || finalScore < 0) finalScore = 0

    // 5. CLASSIFICAÇÃO DE SAÚDE
    let health = 'Excelente'
    if (totalIncome === 0 && totalExpense === 0) {
        health = 'Sem Dados'
        finalScore = 0
    }
    else if (finalScore < 40) health = 'Crítico'
    else if (finalScore < 60) health = 'Atenção'
    else if (finalScore < 80) health = 'Estável'

    // 6. CÁLCULO DO PERFIL COMPORTAMENTAL DA IA
    const microExpensesTotal = safeTransactions.filter(t => t?.type !== 'receita' && Number(t.amount) < 50).reduce((acc, t) => acc + Number(t.amount), 0)
    const impulseTotal = safeTransactions.filter(t => t?.type !== 'receita' && ['Lazer', 'Restaurante', 'Compras', 'Outros'].includes(t.category || '')).reduce((acc, t) => acc + Number(t.amount), 0)
    
    const impulseRatio = totalExpense > 0 ? (impulseTotal / totalExpense) : 0
    let profile = 'Estável'
    let warning = null

    if (totalExpense === 0 && totalIncome === 0) {
        profile = 'Aguardando Dados'
    } else if (safeSummary.balance < 0) {
        profile = 'Em Risco'
        warning = 'Seu fluxo de caixa está negativo. Cuidado com o cheque especial!'
    } else if (impulseRatio > 0.3) {
        profile = 'Impulsivo'
        warning = 'Detectamos muitos gastos não-essenciais. Reduza os supérfluos.'
    } else if (impulseRatio < 0.1 && finalScore > 70) {
        profile = 'Estratégico'
    }

    return { 
        score: finalScore,
        healthStatus: health,
        savingsScore: savScore,
        debtScore: dbtScore,
        emergencyScore: emergScore,
        cashflowScore: cashScore,
        profile, 
        impulseBuyRatio: (impulseRatio * 100), 
        microExpensesTotal, 
        warningMessage: warning 
    }
  }, [safeTransactions, safeSummary])

  // Cores dinâmicas
  const getScoreColor = (score: number) => {
      if (score === 0) return 'text-gray-500 stroke-gray-600' 
      if (score >= 80) return 'text-emerald-400 stroke-emerald-500'
      if (score >= 60) return 'text-blue-400 stroke-blue-500'
      if (score >= 40) return 'text-amber-400 stroke-amber-500'
      return 'text-rose-400 stroke-rose-500'
  }
  const scoreColor = getScoreColor(engineData.score)

  // ============================================================================
  // 📊 2. CÁLCULOS DOS GRÁFICOS CLÁSSICOS (PATRIMÔNIO E FLUXO)
  // ============================================================================
  const totalPatrimonyValue = useMemo(() => {
    return (safeSummary.balance || 0) + (investments || []).reduce((acc, inv) => acc + (inv?.amount_invested || 0), 0)
  }, [safeSummary.balance, investments])

  const nailDesignIncome = useMemo(() => {
    return safeTransactions.filter(t => t?.type === 'receita' && (t?.category === 'Nail Design' || t?.category === 'Serviços')).reduce((acc, t) => acc + Number(t?.amount || 0), 0)
  }, [safeTransactions])

  const flowData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      return { monthIndex: i, label: new Date(selectedYear, i, 1).toLocaleDateString('pt-BR', { month: 'short' }), receita: 0, despesa: 0 }
    })
    safeTransactions.forEach((t: any) => {
      if (!t || !t.date) return
      const tDate = new Date(t.date)
      if (tDate.getFullYear() === selectedYear) {
        if (t.type === 'receita') months[tDate.getMonth()].receita += Number(t.amount)
        else months[tDate.getMonth()].despesa += Number(t.amount)
      }
    })
    return months
  }, [safeTransactions, selectedYear])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f0f0f] border border-white/10 p-4 rounded-xl shadow-2xl z-50 backdrop-blur-md">
          <p className="text-gray-400 text-xs font-bold mb-3 uppercase tracking-wider">{label}</p>
          <div className="space-y-2">
            {payload.map((entry: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}/> 
                        <span className="text-sm font-medium text-gray-200">{entry.name}</span>
                    </div>
                    <span className="text-sm font-bold text-white">{formatCurrency(entry.value)}</span>
                </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  // ============================================================================
  // 🎨 3. RENDERIZAÇÃO DA TELA
  // ============================================================================
  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 space-y-8 animate-in fade-in duration-500 pb-32 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Dashboard <span className="text-xs bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-xl border border-indigo-500/20 font-bold uppercase tracking-widest">Cérebro.OS</span>
            </h1>
            <p className="text-gray-400 mt-2 text-sm font-medium">Visão 360º e motor de decisões sincronizado.</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="relative">
                <button onClick={() => setIsYearMenuOpen(!isYearMenuOpen)} className="flex items-center gap-3 bg-[#09090b] border border-white/10 px-4 py-3 rounded-xl shadow-lg">
                    <Calendar size={14} className="text-blue-400"/><span className="font-bold text-sm">Ano: {selectedYear}</span><ChevronDown size={14} className="text-gray-500"/>
                </button>
                <AnimatePresence>
                    {isYearMenuOpen && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-2 w-full min-w-[160px] bg-[#0f0f0f] border border-white/10 rounded-xl shadow-2xl z-50 p-1">
                            {[2025, 2026].map((year) => (
                                <button key={year} onClick={() => { setSelectedYear(year); setIsYearMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold ${selectedYear === year ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}>{year}</button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <button onClick={() => alert("Simulador em construção!")} className="hidden md:flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg">
                <Scale size={16} /> Simular
            </button>
        </div>
      </div>

      {/* BLOCO 1: MÉTRICAS CLÁSSICAS REAIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Saldo em Conta" value={safeSummary.balance} icon={Wallet} colorTheme="blue" delay={0.1} subtext="Disponível para uso" />
        <MetricCard title="Receita Nail Design" value={nailDesignIncome} icon={Briefcase} colorTheme="emerald" delay={0.2} subtext="Faturamento anual bruto" />
        <MetricCard title="Investimentos" value={totalPatrimonyValue - (safeSummary.balance || 0)} icon={TrendingUp} colorTheme="rose" delay={0.3} subtext="Ações + Cripto + Renda Fixa" />
        <MetricCard title="Patrimônio Total" value={totalPatrimonyValue} icon={Activity} colorTheme="purple" delay={0.4} trend="Sincronizado" />
      </div>

      {/* BLOCO 2: MOTOR COGNITIVO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* VELOCÍMETRO DO SCORE */}
        <PremiumCard className="lg:col-span-2 flex flex-col items-center justify-center text-center relative" glowColor="from-indigo-600/10">
            <div className="absolute top-6 left-6 flex items-center gap-2"><Activity size={18} className="text-gray-400" /><h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Score de Saúde</h3></div>
            
            <div className="relative w-64 h-32 mt-8 md:mt-4">
                <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
                    <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#222" strokeWidth="16" strokeLinecap="round" />
                    <motion.path 
                        d="M 10 100 A 90 90 0 0 1 190 100" fill="none" className={scoreColor.split(' ')[1]} 
                        strokeWidth="16" strokeLinecap="round" strokeDasharray="283"
                        initial={{ strokeDashoffset: 283 }}
                        animate={{ strokeDashoffset: 283 - (283 * (engineData.score / 100)) }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                    <span className={`text-6xl font-black tracking-tighter ${scoreColor.split(' ')[0]}`}>{engineData.score}</span>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Status: <span className="text-white">{engineData.healthStatus}</span></span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 w-full gap-4 mt-12 border-t border-white/5 pt-6">
                <div className="text-center"><p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Poupança</p><p className="text-lg font-black text-white">{engineData.savingsScore.toFixed(0)}<span className="text-xs text-gray-500">/100</span></p></div>
                <div className="text-center"><p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Dívidas</p><p className="text-lg font-black text-white">{engineData.debtScore.toFixed(0)}<span className="text-xs text-gray-500">/100</span></p></div>
                <div className="text-center"><p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Emergência</p><p className="text-lg font-black text-white">{engineData.emergencyScore.toFixed(0)}<span className="text-xs text-gray-500">/100</span></p></div>
                <div className="text-center"><p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Fluxo</p><p className="text-lg font-black text-white">{engineData.cashflowScore.toFixed(0)}<span className="text-xs text-gray-500">/100</span></p></div>
            </div>
        </PremiumCard>

        {/* PERFIL DA IA */}
        <PremiumCard glowColor="from-purple-600/10" delay={0.2} className="flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-6">
                    <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400"><BrainCircuit size={24} /></div>
                    <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded-full font-bold uppercase">IA Cognitiva</span>
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Perfil Comportamental</p>
                <h3 className="text-3xl font-black text-white tracking-tight mb-4">{engineData.profile}</h3>
                
                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Índice de Impulso</p>
                    <p className="text-sm font-bold text-rose-400">{engineData.impulseBuyRatio.toFixed(1)}% dos gastos</p>
                </div>
            </div>
            {engineData.warningMessage && (
                <div className="mt-6 flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
                    <ShieldAlert size={16} className="text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-200 font-medium leading-relaxed">{engineData.warningMessage}</p>
                </div>
            )}
        </PremiumCard>
      </div>

      {/* BLOCO 3: GRÁFICO DE FLUXO DE CAIXA E LISTAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <PremiumCard className="lg:col-span-2 !p-6 md:!p-8" glowColor="from-blue-600/10">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-white flex items-center gap-2">Fluxo de Caixa <Sparkles size={16} className="text-blue-400"/></h3>
               <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                  {(['area', 'bar', 'line'] as const).map(t => (
                    <button key={t} onClick={() => setChartType(t)} className={`p-2 rounded-md transition ${chartType === t ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
                      {t === 'area' ? <Activity size={16}/> : t === 'bar' ? <BarChart3 size={16}/> : <LineChart size={16}/>}
                    </button>
                  ))}
               </div>
            </div>
            <div className="w-full h-[300px]"> 
               <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'area' ? (
                    <AreaChart data={flowData}>
                      <defs><linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient><linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="label" stroke="#666" fontSize={12} axisLine={false} dy={10} />
                      <YAxis stroke="#666" fontSize={12} axisLine={false} tickFormatter={formatK} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={3} fill="url(#colorReceita)" />
                      <Area type="monotone" dataKey="despesa" stroke="#f43f5e" strokeWidth={3} fill="url(#colorDespesa)" />
                    </AreaChart>
                  ) : <BarChart data={flowData}><Bar dataKey="receita" fill="#10b981" /><Bar dataKey="despesa" fill="#f43f5e" /></BarChart>}
               </ResponsiveContainer>
            </div>
         </PremiumCard>

         <div className="space-y-6 flex flex-col h-full">
            <PremiumCard delay={0.3} className="!p-0 flex-1 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <h3 className="font-bold text-white flex items-center gap-2"><Receipt size={16} className="text-blue-400"/> Recentes</h3>
                    <button onClick={() => onNavigate('transações')} className="text-[10px] text-gray-500 font-bold uppercase">Ver Todas</button>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                    {recentTransactions.length > 0 ? recentTransactions.slice(0, 4).map((t) => (
                        <div key={t.id} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${t.type === 'receita' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{t.type === 'receita' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}</div>
                                <div><p className="text-sm font-bold text-white truncate max-w-[120px]">{t.description}</p><p className="text-[10px] text-gray-500">{new Date(t.date).toLocaleDateString('pt-BR')}</p></div>
                            </div>
                            <span className={`text-sm font-black ${t.type === 'receita' ? 'text-emerald-400' : 'text-white'}`}>{t.type === 'receita' ? '+' : '-'}{formatCurrency(Number(t.amount))}</span>
                        </div>
                    )) : <div className="text-center text-gray-500 py-6 text-xs">Sem transações.</div>}
                </div>
            </PremiumCard>

            <PremiumCard delay={0.4} className="!p-0 flex-1 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <h3 className="font-bold text-white flex items-center gap-2"><TrendingUp size={16} className="text-violet-400"/> Portfólio</h3>
                    <button onClick={() => onNavigate('investimentos')} className="text-[10px] text-gray-500 font-bold uppercase">Gerenciar</button>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                    {investments.length > 0 ? investments.slice(0, 3).map((inv) => (
                        <div key={inv.id} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl">
                            <div><p className="text-sm font-bold text-white">{inv.ticker}</p><p className="text-[10px] text-gray-500 uppercase">{inv.type}</p></div>
                            <div className="text-right"><p className="text-sm font-black text-white">{formatCurrency(inv.amount_invested || 0)}</p><p className="text-[9px] text-emerald-500 font-bold uppercase">Ativo</p></div>
                        </div>
                    )) : <div className="text-center text-gray-500 py-6 text-xs">Sem investimentos.</div>}
                </div>
            </PremiumCard>
         </div>
      </div>

      {/* BLOCO 4: BANNER COMPRAS DO MÊS */}
      <motion.button 
        onClick={() => onNavigate('compras inteligentes')}
        className="w-full bg-gradient-to-r from-[#0f0f13] to-[#13131a] border border-white/10 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between group hover:border-indigo-500/30 transition-all shadow-2xl"
      >
        <div className="flex items-center gap-6">
            <div className="h-16 w-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400"><Zap size={28} /></div>
            <div className="text-left">
                <h3 className="text-lg font-black text-white flex items-center gap-2">Compras do Mês Inteligente <ArrowUpRight size={16} className="text-indigo-400" /></h3>
                <p className="text-sm text-gray-400 mt-1">Planeje seu supermercado, preveja a inflação e use OCR.</p>
            </div>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2 text-indigo-400 text-sm font-bold uppercase tracking-widest">Acessar <ChevronRight size={16} /></div>
      </motion.button>
    </div>
  )
}