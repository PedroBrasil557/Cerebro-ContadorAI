'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingDown, ShieldAlert, Plus, X, 
  Banknote, CalendarClock, Flame, CheckCircle2, Loader2, BrainCircuit, Sparkles,
  Crosshair, Swords, AlertTriangle
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts'

// Suas importações do banco e serviços
import { getDebts, createDebt, updateDebt, deleteDebt, Debt } from '@/core/action/debts'
import { financeService } from '@/services/financeService' 
import { toast } from 'sonner'

// --- FUNÇÕES AUXILIARES ---
const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

// 🛡️ O TRADUTOR DE MOEDA BRASILEIRA PARA BANCO DE DADOS
const parseBRCurrency = (value: string) => {
    if (!value) return 0;
    let clean = value.replace(/[^0-9.,]/g, '');
    
    if (clean.includes(',') && clean.includes('.')) {
        clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.includes(',')) {
        clean = clean.replace(',', '.');
    }
    
    return parseFloat(clean) || 0;
}

// --- MODAL NOVA DÍVIDA ---
function NewDebtModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        
        const formData = new FormData(e.currentTarget)
        
        const totalRaw = formData.get('total_amount') as string
        const remainingRaw = formData.get('remaining_amount') as string
        const interestRaw = formData.get('interest_rate') as string

        formData.set('total_amount', parseBRCurrency(totalRaw).toString())
        formData.set('remaining_amount', parseBRCurrency(remainingRaw).toString())
        formData.set('interest_rate', parseBRCurrency(interestRaw).toString())

        await createDebt(formData)
        setLoading(false)
        onSuccess()
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md bg-[#09090b] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
                <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><ShieldAlert className="text-rose-500"/> Novo Passivo</h3>
                <p className="text-xs text-gray-400 mb-6">Registre para a IA traçar uma rota de fuga.</p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nome da Dívida</label>
                        <input name="name" required placeholder="Ex: Empréstimo Banco X" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-rose-500/50 outline-none mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Valor Original</label>
                            <input name="total_amount" type="text" inputMode="decimal" required placeholder="Ex: 5.000,00" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-rose-500/50 outline-none mt-1 font-mono" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Falta Pagar</label>
                            <input name="remaining_amount" type="text" inputMode="decimal" required placeholder="Ex: 2.939,37" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-rose-500/50 outline-none mt-1 font-mono" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Juros Mensal (%)</label>
                            <input name="interest_rate" type="text" inputMode="decimal" placeholder="Ex: 2,5" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-rose-500/50 outline-none mt-1 font-mono" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Dia Vencimento</label>
                            <input name="due_day" type="number" max="31" placeholder="Ex: 10" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-rose-500/50 outline-none mt-1 font-mono" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Prioridade (Opcional)</label>
                        <select name="priority" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-rose-500/50 outline-none mt-1 [color-scheme:dark]">
                            <option value="alta" className="bg-[#1a1a1a]">Alta (Urgente)</option>
                            <option value="media" className="bg-[#1a1a1a]">Média</option>
                            <option value="baixa" className="bg-[#1a1a1a]">Baixa</option>
                        </select>
                    </div>
                    <button disabled={loading} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg mt-2">
                      {loading ? 'Processando...' : 'Registrar Passivo'}
                    </button>
                </form>
            </motion.div>
        </div>
    )
}

// --- COMPONENTE PRINCIPAL (SALA DE GUERRA) ---
export default function DebtManagerWarRoom({ summary }: { summary?: any }) {
    const [debts, setDebts] = useState<Debt[]>([])
    const [loading, setLoading] = useState(true)
    
    // UI States
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [strategyMode, setStrategyMode] = useState<'avalanche' | 'snowball'>('avalanche')
    
    // AI States
    const [aiStrategyText, setAiStrategyText] = useState<string | null>(null)
    const [analyzing, setAnalyzing] = useState(false)

    // Payment States
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)
    const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null)
    const [paymentAmount, setPaymentAmount] = useState('')
    const [isPaying, setIsPaying] = useState(false)

    // Carrega Dívidas
    const loadDebts = async () => {
        const data = await getDebts()
        setDebts(data || [])
        setLoading(false)
    }
    useEffect(() => { loadDebts() }, [])

    // ============================================================================
    // 🧠 MOTOR DE INTELIGÊNCIA DE PASSIVOS (LOCAL)
    // ============================================================================
    const engine = useMemo(() => {
      const safeDebts = debts || []
      const totalRemaining = safeDebts.reduce((acc, d) => acc + Number(d.remaining_amount), 0)
      const totalOriginal = safeDebts.reduce((acc, d) => acc + Number(d.total_amount), 0)
      
      const monthlyInterestBurn = safeDebts.reduce((acc, d) => acc + (Number(d.remaining_amount) * (Number(d.interest_rate) / 100)), 0)
      
      const totalPaid = totalOriginal - totalRemaining
      const globalProgress = totalOriginal > 0 ? (totalPaid / totalOriginal) * 100 : 0

      const sortedDebts = [...safeDebts].filter(d => Number(d.remaining_amount) > 0).sort((a, b) => {
        if (strategyMode === 'avalanche') return Number(b.interest_rate) - Number(a.interest_rate)
        return Number(a.remaining_amount) - Number(b.remaining_amount)
      })

      const primaryTarget = sortedDebts.length > 0 ? sortedDebts[0] : null

      const estMonthlyPayment = Math.max(totalRemaining * 0.05, monthlyInterestBurn * 1.5)
      const monthsToFreedom = estMonthlyPayment > monthlyInterestBurn ? Math.ceil(totalRemaining / (estMonthlyPayment - monthlyInterestBurn)) : 60
      
      const freedomDate = new Date()
      freedomDate.setMonth(freedomDate.getMonth() + Math.min(monthsToFreedom, 120)) 

      let currentBalance = totalRemaining
      const projectionData = []
      for (let i = 0; i <= Math.min(monthsToFreedom, 24); i++) {
        const d = new Date()
        d.setMonth(d.getMonth() + i)
        projectionData.push({
          month: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          saldo: Math.max(currentBalance, 0)
        })
        currentBalance -= (estMonthlyPayment - monthlyInterestBurn)
      }

      return {
        totalRemaining, totalOriginal, totalPaid, globalProgress,
        monthlyInterestBurn,
        primaryTarget, sortedDebts,
        freedomDate: totalRemaining === 0 ? 'Já Livre!' : freedomDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        projectionData
      }
    }, [debts, strategyMode])

    // ============================================================================
    // 🤖 CHAMADA PARA API DO GROQ (IA GENERATIVA)
    // ============================================================================
    const generateAIStrategy = async () => {
        if (debts.length === 0) return toast.success("Você não tem dívidas para analisar! Parabéns!")
        setAnalyzing(true)
        
        try {
            const transactions = await financeService.getTransactions()
            const response = await fetch('/api/ai/debt-strategy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ debts: debts, transactions: transactions })
            })

            if (!response.ok) throw new Error("Falha na API")
            const data = await response.json()
            setAiStrategyText(data.strategy)
            toast.success("Consultoria de IA concluída!")

        } catch (e) {
            console.error(e)
            toast.error("Erro ao conectar com a Inteligência Artificial.")
        } finally {
            setAnalyzing(false)
        }
    }

    // --- LÓGICA DE PAGAMENTO ---
    const openPaymentModal = (id: string) => {
        setSelectedDebtId(id)
        setPaymentAmount('')
        setPaymentModalOpen(true)
    }

    const confirmPayment = async () => {
        const numericAmount = parseBRCurrency(paymentAmount)
        if (!selectedDebtId || numericAmount <= 0) return
        
        setIsPaying(true)
        try {
            await updateDebt(selectedDebtId, numericAmount)
            await loadDebts()
            toast.success("Amortização registrada! Rumo à liberdade financeira.")
            setPaymentModalOpen(false)
        } catch (error) {
            toast.error("Erro ao registrar pagamento.")
        } finally {
            setIsPaying(false)
        }
    }

    if (loading) return <div className="flex justify-center items-center h-screen bg-[#050505]"><Loader2 className="animate-spin text-rose-500" size={40}/></div>

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 space-y-8 animate-in fade-in duration-700 pb-32 max-w-7xl mx-auto selection:bg-rose-500/30">
            
            {/* 1. HEADER & COMANDO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-black text-white tracking-tight">Sala de Guerra</h1>
                        <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1.5">
                            <Swords size={12} /> Passivos Ativos
                        </span>
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Estratégia implacável de amortização e eliminação de juros.</p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Botão blindado contra sobreposição invisível */}
                    <button type="button" onClick={() => setIsModalOpen(true)} className="relative z-50 flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-black px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all shadow-lg shadow-white/5">
                        <Plus size={16} /> Novo Passivo
                    </button>
                </div>
            </div>

            {/* ESTADO VAZIO: SEM DÍVIDAS */}
            {debts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 md:py-32 border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                    <CheckCircle2 size={64} className="mb-6 text-emerald-500/50"/>
                    <h2 className="text-2xl font-black text-white text-center">Patrimônio Protegido</h2>
                    <p className="text-gray-500 mt-2 max-w-md text-center mb-8 px-4">O motor não detectou nenhum passivo em aberto. Você está na rota da liberdade financeira.</p>
                    
                    {/* BOTÃO EXTRA PRA FACILITAR */}
                    <button type="button" onClick={() => setIsModalOpen(true)} className="relative z-50 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                        Adicionar Primeira Dívida
                    </button>
                </div>
            ) : (
            <>
              {/* 2. O CÉREBRO: BANNER ESTRATÉGICO */}
              <motion.div layout className="bg-gradient-to-r from-[#0a0a0c] to-[#0f0f13] border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                  
                  <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center relative z-10">
                      
                      {/* Seletor de Estratégia Matemática */}
                      <div className="w-full lg:w-1/3 space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                              <Crosshair size={18} className="text-rose-400" />
                              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Foco Tático Atual</h3>
                          </div>
                          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 relative z-10">
                              <button onClick={() => setStrategyMode('avalanche')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${strategyMode === 'avalanche' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-lg' : 'text-gray-500 hover:text-white'}`}>Avalanche</button>
                              <button onClick={() => setStrategyMode('snowball')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${strategyMode === 'snowball' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-lg' : 'text-gray-500 hover:text-white'}`}>Bola de Neve</button>
                          </div>
                          <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                              {strategyMode === 'avalanche' ? 'Matemática pura: Destrói primeiro o passivo que te cobra os maiores juros para economizar dinheiro real a longo prazo.' : 'Psicologia humana: Foca em quitar a menor dívida primeiro para gerar motivação e liberar dinheiro no mês.'}
                          </p>
                      </div>

                      <div className="w-px h-32 bg-white/5 hidden lg:block" />

                      {/* O Alvo Primário */}
                      {engine.primaryTarget && (
                        <div className="flex-1 w-full bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1 h-full ${strategyMode === 'avalanche' ? 'bg-rose-500' : 'bg-blue-500'}`} />
                            <div className="flex justify-between items-start mb-4">
                                <h3 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${strategyMode === 'avalanche' ? 'text-rose-500' : 'text-blue-500'}`}>
                                    <ShieldAlert size={14} /> Alvo Prioritário
                                </h3>
                                <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-gray-400 font-bold uppercase tracking-widest">
                                    {engine.primaryTarget.interest_rate}% a.m.
                                </span>
                            </div>
                            <h2 className="text-2xl font-black text-white mb-1 truncate">{engine.primaryTarget.name}</h2>
                            <div className="flex items-end gap-4 mt-4">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Falta Pagar</p>
                                    <p className="text-xl font-black text-white">{formatCurrency(Number(engine.primaryTarget.remaining_amount))}</p>
                                </div>
                                <button type="button" onClick={() => openPaymentModal(engine.primaryTarget!.id)} className="ml-auto bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                    Atacar
                                </button>
                            </div>
                        </div>
                      )}
                  </div>
              </motion.div>

              {/* 3. MÉTRICAS MACRO & GRÁFICO DE PENHASCO */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Coluna de Métricas de Choque */}
                  <div className="flex flex-col gap-4">
                      <div className="bg-[#09090b] border border-white/5 p-6 rounded-3xl relative overflow-hidden flex-1 group hover:border-white/10 transition-colors">
                          <div className="p-3 bg-white/5 text-gray-400 rounded-xl w-fit mb-4"><AlertTriangle size={20} /></div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Dívida Total Ativa</p>
                          <h3 className="text-3xl font-black text-white">{formatCurrency(engine.totalRemaining)}</h3>
                          <div className="mt-4 pt-4 border-t border-white/5">
                              <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase mb-2">
                                  <span>Progresso Global</span>
                                  <span className="text-emerald-400">{engine.globalProgress.toFixed(1)}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${engine.globalProgress}%` }} className="h-full bg-emerald-500" />
                              </div>
                          </div>
                      </div>

                      <div className="bg-gradient-to-br from-rose-950/20 to-[#09090b] border border-rose-500/10 p-6 rounded-3xl relative overflow-hidden flex-1 group">
                          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl animate-pulse w-fit mb-4"><Flame size={20} /></div>
                          <p className="text-[10px] font-bold text-rose-500/70 uppercase tracking-widest mb-1">Sangramento (Juros Estimados/Mês)</p>
                          <h3 className="text-3xl font-black text-rose-400">-{formatCurrency(engine.monthlyInterestBurn)}</h3>
                          <p className="text-[10px] text-gray-500 font-medium mt-2 leading-relaxed">
                              Este é o valor que evapora do seu patrimônio todo mês só pela manutenção das dívidas em aberto.
                          </p>
                      </div>
                  </div>

                  {/* Gráfico de Projeção de Liberdade e IA Generativa */}
                  <div className="lg:col-span-2 flex flex-col gap-6">
                      <div className="bg-[#09090b] border border-white/5 p-6 rounded-3xl flex flex-col flex-1">
                          <div className="flex justify-between items-start mb-6">
                              <div>
                                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                      <CalendarClock size={14} /> Projeção de Quitação (Estimativa)
                                  </p>
                                  <h3 className="text-xl font-black text-white">Potencialmente Livre em <span className="text-emerald-400">{engine.freedomDate}</span></h3>
                              </div>
                          </div>
                          <div className="flex-1 w-full min-h-[150px] mt-4">
                              <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={engine.projectionData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                      <defs>
                                          <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                      <XAxis dataKey="month" stroke="#666" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                                      <YAxis stroke="#666" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `R$ ${val/1000}k`} />
                                      <RechartsTooltip contentStyle={{ backgroundColor: '#0f0f0f', borderColor: '#333', borderRadius: '12px' }} itemStyle={{ color: '#f43f5e', fontWeight: 'bold' }} />
                                      <Area type="monotone" dataKey="saldo" stroke="#f43f5e" strokeWidth={3} fill="url(#colorSaldo)" />
                                  </AreaChart>
                              </ResponsiveContainer>
                          </div>
                      </div>

                      {/* BANNER IA DO GROQ */}
                      <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden">
                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                            <div className="flex-1">
                                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <BrainCircuit size={16} /> Consultoria de Inteligência Artificial
                                </h3>
                                {aiStrategyText ? (
                                    <div className="text-sm text-gray-300 leading-relaxed font-light prose prose-invert">
                                        {aiStrategyText}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">Gere um plano de resgate totalmente personalizado lendo seu padrão de consumo atual e suas dívidas.</p>
                                )}
                            </div>
                            <div className="shrink-0 w-full md:w-auto">
                                {!aiStrategyText && (
                                    <button type="button" onClick={generateAIStrategy} disabled={analyzing} className="w-full bg-white text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2 relative z-50">
                                        {analyzing ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16} />}
                                        {analyzing ? 'Analisando...' : 'Gerar Plano com IA'}
                                    </button>
                                )}
                            </div>
                        </div>
                      </div>
                  </div>
              </div>

              {/* 4. LISTA DE PASSIVOS */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                      <TrendingDown size={16} className="text-gray-500" /> Detalhamento Tático
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {engine.sortedDebts.map((debt, index) => {
                          const isTarget = index === 0
                          const progress = ((Number(debt.total_amount) - Number(debt.remaining_amount)) / Number(debt.total_amount)) * 100
                          const isDanger = Number(debt.interest_rate) > 5 
                          
                          return (
                              <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={debt.id} className={`bg-[#0a0a0c] border transition-all rounded-3xl p-6 flex flex-col ${isTarget && engine.totalRemaining > 0 ? (strategyMode === 'avalanche' ? 'border-rose-500/30' : 'border-blue-500/30') : 'border-white/5 hover:border-white/10'}`}>
                                  <div className="flex justify-between items-start mb-6">
                                      <div className="pr-4">
                                          <h4 className="font-bold text-white text-lg leading-tight mb-2 truncate max-w-[180px]">{debt.name}</h4>
                                          <div className="flex gap-2">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${isDanger ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                                                {debt.interest_rate}% a.m
                                            </span>
                                            {debt.priority === 'alta' && <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border bg-amber-500/10 text-amber-500 border-amber-500/20">Urgente</span>}
                                          </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <button type="button" onClick={() => deleteDebt(debt.id).then(loadDebts)} className="p-2 text-gray-600 hover:text-rose-500 transition-colors bg-white/5 rounded-lg h-fit"><X size={14}/></button>
                                      </div>
                                  </div>

                                  <div className="space-y-4 mb-6">
                                      <div className="flex justify-between items-end border-b border-white/5 pb-3">
                                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Saldo Devedor</span>
                                          <span className="text-xl font-black text-white">{formatCurrency(Number(debt.remaining_amount))}</span>
                                      </div>
                                  </div>

                                  <div className="mt-auto space-y-4">
                                      <div className="space-y-2">
                                        <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase">
                                            <span>{progress.toFixed(0)}% Quitado</span>
                                            <span>Total Original: {formatCurrency(Number(debt.total_amount))}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className={`h-full rounded-full ${isTarget ? (strategyMode === 'avalanche' ? 'bg-rose-500' : 'bg-blue-500') : 'bg-emerald-500'}`} />
                                        </div>
                                      </div>

                                      <button type="button" onClick={() => openPaymentModal(debt.id)} className="w-full flex justify-center items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10">
                                          <Banknote size={14} /> Amortizar Agora
                                      </button>
                                  </div>
                              </motion.div>
                          )
                      })}
                  </div>
              </div>
            </>
            )}

            {/* MODAIS ABERTOS CONDICIONALMENTE (SEM ANIMATE PRESENCE PARA EVITAR BUGS DE RENDER) */}
            {isModalOpen && (
                <NewDebtModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={loadDebts} />
            )}
            
            {paymentModalOpen && selectedDebtId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm bg-[#09090b] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
                        <button type="button" onClick={() => setPaymentModalOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
                        
                        <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><Banknote className="text-emerald-500"/> Registrar Amortização</h3>
                        <p className="text-xs text-gray-400 mb-6">Informe o valor exato que você pagou desta dívida hoje.</p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Valor Pago (R$)</label>
                                <input 
                                    type="text" inputMode="decimal"
                                    value={paymentAmount} 
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="Ex: 150,00" 
                                    autoFocus
                                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500/50 outline-none font-mono" 
                                />
                            </div>
                            <button 
                                type="button"
                                onClick={confirmPayment}
                                disabled={!paymentAmount || isPaying}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 text-[10px] uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isPaying ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                {isPaying ? 'Registrando...' : 'Confirmar Abatimento'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}