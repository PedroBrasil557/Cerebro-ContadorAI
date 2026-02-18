'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, TrendingDown, Wallet, ArrowRight, MoreHorizontal, 
  BarChart3, LineChart, Activity, Calendar, Target, Plus, 
  CreditCard as CardIcon, PieChart as PieIcon, Filter, Layers, DollarSign
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, LineChart as RechartsLineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'
import { Transaction, Goal, CreditCard } from '@/types_db'

// --- CONSTANTES VISUAIS ---
const COLORS = ['#10b981', '#3b82f6', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1']

// --- COMPONENTES VISUAIS AUXILIARES ---

const PremiumCard = ({ children, className = "", delay = 0, glowColor = "from-blue-500/10" }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: delay }}
    className={`relative group bg-[#09090b] rounded-3xl overflow-hidden border border-white/5 ${className}`}
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${glowColor} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />
    <div className="relative z-10 h-full flex flex-col">
      {children}
    </div>
  </motion.div>
)

const MetricCard = ({ title, value, icon: Icon, colorTheme, trend, delay }: any) => {
    const themes: any = {
        blue: { icon: "text-blue-400", bg: "bg-blue-500/10", value: "text-blue-400" },
        emerald: { icon: "text-emerald-400", bg: "bg-emerald-500/10", value: "text-emerald-400" },
        rose: { icon: "text-rose-400", bg: "bg-rose-500/10", value: "text-rose-400" },
        purple: { icon: "text-purple-400", bg: "bg-purple-500/10", value: "text-purple-400" },
    }
    const theme = themes[colorTheme]

    return (
        <PremiumCard delay={delay} className="p-6 h-40" glowColor={`from-${colorTheme}-500/10`}>
            <div className="flex justify-between items-start mb-auto">
                <div className={`p-3 rounded-xl ${theme.bg} ${theme.icon}`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <span className="text-[10px] font-bold bg-white/5 px-2 py-1 rounded-full text-gray-400">
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{title}</p>
                <h3 className={`text-3xl font-black ${theme.value} tracking-tight`}>{formatCurrency(value)}</h3>
            </div>
        </PremiumCard>
    )
}

// --- UTILITÁRIOS ---

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

const formatK = (val: number) => {
  if (val === 0) return 'R$ 0'
  return `R$ ${(val / 1000).toFixed(0)}k`
}

// --- PROPS ---

interface DashboardViewProps {
  summary: {
    balance: number
    income: number
    expense: number
    emergencyTotal: number
  }
  recentTransactions: Transaction[]
  onNavigate: (tab: string) => void
  chartData: any[] 
  chartRange: string
  setChartRange: (range: string) => void
  transactions: Transaction[] 
  goals: Goal[]
  cards: CreditCard[] 
}

// --- COMPONENTE PRINCIPAL ---

export default function DashboardView({ 
  summary, recentTransactions, onNavigate, transactions, goals, cards 
}: DashboardViewProps) {
  
  // Estados Locais
  const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>('area')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  
  const [catChartType, setCatChartType] = useState<'pie' | 'bar'>('pie')
  const [includePendingCat, setIncludePendingCat] = useState(false)

  const [cardChartType, setCardChartType] = useState<'bar' | 'pie'>('bar')

  // --- 1. PROCESSAMENTO: FLUXO DE CAIXA ---
  const flowData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(selectedYear, i, 1)
      return {
        monthIndex: i,
        name: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        receita: 0,
        despesa: 0,
        patrimonio: 0
      }
    })

    const sortedTransactions = [...transactions].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    let accumulatedBalance = 0 

    sortedTransactions.forEach((t: any) => {
      const tDate = new Date(t.date)
      const amount = Number(t.amount)
      
      if (tDate.getFullYear() === selectedYear) {
        const monthIdx = tDate.getMonth()
        if (t.type === 'receita') months[monthIdx].receita += amount
        else months[monthIdx].despesa += amount
      }

      if (tDate.getFullYear() <= selectedYear) {
          if (t.type === 'receita') accumulatedBalance += amount
          else accumulatedBalance -= amount
          
          if (tDate.getFullYear() === selectedYear) {
             const mIdx = tDate.getMonth()
             for(let i = mIdx; i < 12; i++) months[i].patrimonio = accumulatedBalance
          } else {
             months.forEach(m => m.patrimonio = accumulatedBalance)
          }
      }
    })

    return months.map(m => ({ ...m, label: `${m.name}/${selectedYear.toString().slice(2)}`, patrimonio: Math.max(0, m.patrimonio) }))
  }, [transactions, selectedYear])

  // --- 2. PROCESSAMENTO: GASTOS POR CATEGORIA ---
  const categoryData = useMemo(() => {
      const grouped: Record<string, number> = {}
      
      transactions.forEach((t: any) => {
          if (t.type === 'receita') return 
          if (!includePendingCat && !t.is_paid) return 
          if (new Date(t.date).getFullYear() !== selectedYear) return 

          const cat = t.category || 'Outros'
          grouped[cat] = (grouped[cat] || 0) + Number(t.amount)
      })

      const data = Object.entries(grouped)
        .map(([name, value], index) => ({ name, value, fill: COLORS[index % COLORS.length] }))
        .sort((a, b) => b.value - a.value) 

      const total = data.reduce((acc, curr) => acc + curr.value, 0)

      return { data, total }
  }, [transactions, selectedYear, includePendingCat])

  // --- 3. PROCESSAMENTO: GASTOS POR CARTÃO ---
  const cardExpenseData = useMemo(() => {
      const grouped: Record<string, number> = {}
      
      transactions.forEach((t: any) => {
          if (t.type === 'receita') return 
          const method = t.payment_method || 'Outros'
          if (new Date(t.date).getFullYear() !== selectedYear) return 

          grouped[method] = (grouped[method] || 0) + Number(t.amount)
      })

      const data = Object.entries(grouped)
        .map(([name, value], index) => ({ name, value, fill: COLORS[(index + 2) % COLORS.length] })) 
        .sort((a, b) => b.value - a.value)

      const total = data.reduce((acc, curr) => acc + curr.value, 0)
      return { data, total }
  }, [transactions, selectedYear])

  // --- TOOLTIP ---
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#09090b] border border-white/10 p-4 rounded-xl shadow-2xl z-50">
          <p className="text-gray-400 text-xs font-bold mb-2 uppercase tracking-wider">{label || payload[0].name}</p>
          <div className="space-y-1">
            {payload.map((entry: any, idx: number) => (
                <p key={idx} className="text-sm font-bold flex items-center gap-2" style={{ color: entry.color || entry.fill }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}/> 
                    {entry.name}: {formatCurrency(entry.value)}
                </p>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div><h1 className="text-3xl font-black text-white">Dashboard</h1><p className="text-gray-400 mt-1 text-sm">Visão 360º das suas finanças.</p></div>
        <div className="bg-[#121214] border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
            <Calendar size={16} className="text-gray-400"/>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-[#121214] text-sm font-bold text-white outline-none cursor-pointer appearance-none">
                <option value={2025} className="bg-[#121214]">2025</option>
                <option value={2026} className="bg-[#121214]">2026</option>
                <option value={2027} className="bg-[#121214]">2027</option>
            </select>
        </div>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Saldo Disponível" value={summary.balance} icon={Wallet} colorTheme="blue" delay={0.1} />
        <MetricCard title="Receita Mensal" value={summary.income} icon={TrendingUp} colorTheme="emerald" delay={0.2} trend="+12%" />
        <MetricCard title="Despesa Operacional" value={summary.expense} icon={TrendingDown} colorTheme="rose" delay={0.3} />
        <MetricCard title="Patrimônio Total" value={summary.balance + summary.emergencyTotal} icon={Activity} colorTheme="purple" delay={0.4} />
      </div>

      {/* SEÇÃO PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* FLUXO DE CAIXA */}
         <PremiumCard className="lg:col-span-2 p-6 md:p-8" glowColor="from-blue-600/10">
            <div className="flex justify-between items-center mb-6 relative z-10">
               <div><h3 className="text-xl font-bold text-white flex items-center gap-2">Fluxo de Caixa <span className="animate-pulse text-emerald-500 text-[10px]">● AO VIVO</span></h3></div>
               <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                  <button onClick={() => setChartType('area')} className={`p-2 rounded-md transition ${chartType === 'area' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}><Activity size={16} /></button>
                  <button onClick={() => setChartType('bar')} className={`p-2 rounded-md transition ${chartType === 'bar' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}><BarChart3 size={16} /></button>
                  <button onClick={() => setChartType('line')} className={`p-2 rounded-md transition ${chartType === 'line' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}><LineChart size={16} /></button>
               </div>
            </div>
            
            {/* ✅ CORREÇÃO: Altura Fixa para o Gráfico */}
            <div className="w-full h-[350px]"> 
               <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'area' ? (
                    <AreaChart data={flowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReceitaFlow" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                        <linearGradient id="colorDespesaFlow" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="label" stroke="#666" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatK} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorReceitaFlow)" />
                      <Area type="monotone" dataKey="despesa" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorDespesaFlow)" />
                      <Area type="monotone" dataKey="patrimonio" stroke="#8b5cf6" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                    </AreaChart>
                  ) : chartType === 'bar' ? (
                    <BarChart data={flowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="label" stroke="#666" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatK} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                      <Bar dataKey="receita" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="despesa" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  ) : (
                    <RechartsLineChart data={flowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="label" stroke="#666" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatK} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={3} dot={{r:4}} />
                      <Line type="monotone" dataKey="despesa" stroke="#f43f5e" strokeWidth={3} dot={{r:4}} />
                      <Line type="monotone" dataKey="patrimonio" stroke="#8b5cf6" strokeWidth={3} dot={{r:4}} />
                    </RechartsLineChart>
                  )}
               </ResponsiveContainer>
            </div>
         </PremiumCard>

         {/* MEUS CARTÕES */}
         <PremiumCard className="flex flex-col p-6" glowColor="from-violet-600/10">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-white flex items-center gap-2">Meus Cartões <CardIcon size={18} className="text-violet-400"/></h3>
               <button onClick={() => onNavigate('minha carteira')} className="text-xs text-gray-400 hover:text-white transition bg-white/5 px-2 py-1 rounded">Gerenciar</button>
            </div>
            
            {/* Altura Fixa para o Carrossel */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar h-[350px]">
                {cards && cards.length > 0 ? (
                    cards.map((card: any) => (
                        <div key={card.id} className="bg-gradient-to-r from-[#1a1a1c] to-[#0f0f0f] p-4 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-violet-500/30 transition-all cursor-pointer">
                            <div className="absolute top-0 right-0 p-8 bg-white/5 rounded-full blur-xl group-hover:bg-violet-500/10 transition-colors"/>
                            <div className="flex justify-between items-start mb-3 relative z-10">
                                <div>
                                    <p className="font-bold text-white text-sm">{card.name}</p>
                                    <p className="text-[10px] text-gray-500 uppercase">{card.brand || 'Cartão'}</p>
                                </div>
                                <CardIcon size={18} className="text-gray-600 group-hover:text-violet-400 transition-colors"/>
                            </div>
                            <div className="flex justify-between items-end relative z-10">
                                <p className="text-gray-400 font-mono text-xs">•••• {card.last_4_digits}</p>
                                <div>
                                    <p className="text-[9px] text-gray-600 text-right uppercase font-bold">Limite</p>
                                    <p className="text-white font-bold text-sm">{formatCurrency(card.limit)}</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center space-y-2">
                        <div className="p-3 bg-white/5 rounded-full"><CardIcon size={24} className="opacity-50"/></div>
                        <p className="text-xs">Nenhum cartão cadastrado.</p>
                        <button onClick={() => onNavigate('minha carteira')} className="text-violet-400 text-xs font-bold hover:underline">Adicionar</button>
                    </div>
                )}
            </div>
         </PremiumCard>
      </div>

      {/* SEÇÃO DETALHADA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* GASTOS POR CATEGORIA */}
          <PremiumCard className="p-6 md:p-8 flex flex-col" glowColor="from-emerald-600/10">
              <div className="flex justify-between items-start mb-6">
                  <div>
                      <h3 className="font-bold text-white flex items-center gap-2">Gastos por Categoria <Layers size={16} className="text-emerald-400"/></h3>
                      <p className="text-xs text-gray-400 mt-1">Classificação das despesas.</p>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => setIncludePendingCat(!includePendingCat)} className={`p-2 rounded-lg border transition ${includePendingCat ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-transparent border-white/10 text-gray-500'}`} title={includePendingCat ? "Ocultar Pendentes" : "Incluir Pendentes"}><Filter size={16}/></button>
                      <button onClick={() => setCatChartType(catChartType === 'pie' ? 'bar' : 'pie')} className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition"><PieIcon size={16}/></button>
                  </div>
              </div>

              <div className="flex-1 flex gap-4 overflow-hidden items-center">
                  {/* ✅ CORREÇÃO: Altura Fixa para o Gráfico de Categoria */}
                  <div className="flex-1 h-[250px] relative min-w-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                          {catChartType === 'pie' ? (
                              <PieChart>
                                  {/* Ajustado outerRadius para 75% para caber melhor */}
                                  <Pie data={categoryData.data} innerRadius="55%" outerRadius="75%" paddingAngle={4} dataKey="value">
                                      {categoryData.data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} stroke="none"/>)}
                                  </Pie>
                                  <Tooltip content={<CustomTooltip />} />
                                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-lg font-bold">
                                      {formatK(categoryData.total)}
                                  </text>
                              </PieChart>
                          ) : (
                              <BarChart data={categoryData.data} layout="vertical" margin={{left: 40, right: 10}}>
                                  <XAxis type="number" hide />
                                  <YAxis dataKey="name" type="category" width={90} tick={{fill:'#9ca3af', fontSize:11, fontWeight: 500}} />
                                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                                      {categoryData.data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                  </Bar>
                              </BarChart>
                          )}
                      </ResponsiveContainer>
                  </div>

                  <div className="w-48 overflow-y-auto pr-2 custom-scrollbar space-y-3 h-[250px] hidden md:block py-2">
                      {categoryData.data.map((cat, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs group p-2 hover:bg-white/5 rounded-lg transition">
                              <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{backgroundColor: cat.fill}}/>
                                  <span className="text-gray-300 truncate font-medium">{cat.name}</span>
                              </div>
                              <span className="font-bold text-white">{((cat.value / (categoryData.total || 1)) * 100).toFixed(0)}%</span>
                          </div>
                      ))}
                  </div>
              </div>
          </PremiumCard>

          {/* GASTOS POR CARTÃO */}
          <PremiumCard className="p-6 md:p-8 flex flex-col" glowColor="from-purple-600/10">
              <div className="flex justify-between items-start mb-6">
                  <div>
                      <h3 className="font-bold text-white flex items-center gap-2">Gastos por Cartão <CardIcon size={16} className="text-purple-400"/></h3>
                      <p className="text-xs text-gray-400 mt-1">Para onde vai seu dinheiro.</p>
                  </div>
                  <button onClick={() => setCardChartType(cardChartType === 'bar' ? 'pie' : 'bar')} className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition"><BarChart3 size={16}/></button>
              </div>

              {/* ✅ CORREÇÃO: Altura Fixa para o Gráfico de Cartão */}
              <div className="w-full h-[250px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                      {cardChartType === 'bar' ? (
                          <BarChart data={cardExpenseData.data} margin={{ top: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                              <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                              <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatK} />
                              <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                  {cardExpenseData.data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                              </Bar>
                          </BarChart>
                      ) : (
                          <PieChart>
                              <Pie data={cardExpenseData.data} innerRadius={0} outerRadius={100} paddingAngle={2} dataKey="value">
                                  {cardExpenseData.data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} stroke="none"/>)}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px', color: '#999'}}/>
                          </PieChart>
                      )}
                  </ResponsiveContainer>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Despesas</span>
                  <span className="text-xl font-black text-white">{formatCurrency(cardExpenseData.total)}</span>
              </div>
          </PremiumCard>

      </div>
    </div>
  )
}