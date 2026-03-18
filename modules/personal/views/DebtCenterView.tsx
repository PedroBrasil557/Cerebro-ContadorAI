'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingDown, ShieldAlert, Plus, X, 
  Banknote, CalendarClock, Flame, CheckCircle2, Loader2, BrainCircuit, Sparkles,
  Crosshair, Swords, AlertTriangle, Layers, PhoneCall
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts'

import { getDebts, createDebt, updateDebt, deleteDebt, Debt } from '@/core/action/debts'
import { financeService } from '@/services/financeService' 
import { toast } from 'sonner'

// --- TIPAGENS ---
interface ExtendedDebt extends Omit<Debt, 'interest_rate'> {
    monthly_payment?: number;
    interest_rate?: number;
    total_installments?: number;
}

interface DebtCenterViewProps {
  user: any
  summary: any
}

// --- FUNÇÕES AUXILIARES ---
const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

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
        formData.set('total_amount', parseBRCurrency(formData.get('total_amount') as string).toString())
        formData.set('remaining_amount', parseBRCurrency(formData.get('remaining_amount') as string).toString())
        formData.set('interest_rate', parseBRCurrency(formData.get('interest_rate') as string).toString())
        formData.set('monthly_payment', parseBRCurrency(formData.get('monthly_payment') as string).toString())

        await createDebt(formData)
        setLoading(false)
        onSuccess(); onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-md bg-[#09090b] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative">
                <button type="button" onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors"><X size={20}/></button>
                <h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter flex items-center gap-2"><ShieldAlert className="text-rose-500" size={24}/> Registrar Passivo</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-8">Auditoria de Crédito e Amortização</p>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Identificação</label>
                        <input name="name" required placeholder="Ex: Cartão Nubank" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-rose-500/50 outline-none mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Valor Original</label>
                            <input name="total_amount" type="text" inputMode="decimal" required placeholder="0,00" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-rose-500/50 outline-none mt-1 font-mono text-sm" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Saldo Devedor</label>
                            <input name="remaining_amount" type="text" inputMode="decimal" required placeholder="0,00" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-rose-500/50 outline-none mt-1 font-mono text-sm" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Juros Mensal (%)</label>
                            <input name="interest_rate" type="text" inputMode="decimal" placeholder="0,00" className="w-full bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 text-white focus:border-rose-500 outline-none mt-1 font-mono text-sm" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Parcela</label>
                            <input name="monthly_payment" type="text" inputMode="decimal" required placeholder="0,00" className="w-full bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 text-white focus:border-indigo-500 outline-none mt-1 font-mono text-sm" />
                        </div>
                    </div>
                    <button disabled={loading} className="w-full bg-white text-black font-black py-5 text-[10px] uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl mt-4 hover:bg-gray-200">
                      {loading ? <Loader2 className="animate-spin text-black" size={20}/> : 'Sincronizar Passivo'}
                    </button>
                </form>
            </motion.div>
        </div>
    )
}

export default function DebtManagerWarRoom({ user, summary }: DebtCenterViewProps) {
    const [debts, setDebts] = useState<ExtendedDebt[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [strategyMode, setStrategyMode] = useState<'avalanche' | 'snowball'>('avalanche')
    const [aiStrategyText, setAiStrategyText] = useState<string | null>(null)
    const [analyzing, setAnalyzing] = useState(false)
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)
    const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null)
    const [paymentAmount, setPaymentAmount] = useState('')
    const [isPaying, setIsPaying] = useState(false)

    const loadDebts = async () => {
        const data = await getDebts()
        setDebts((data as ExtendedDebt[]) || [])
        setLoading(false)
    }
    useEffect(() => { loadDebts() }, [])

    const openPaymentModal = (id: string) => { setSelectedDebtId(id); setPaymentAmount(''); setPaymentModalOpen(true); };

    const confirmPayment = async () => {
        const numericAmount = parseBRCurrency(paymentAmount)
        if (!selectedDebtId || numericAmount <= 0) return
        setIsPaying(true)
        try {
            await updateDebt(selectedDebtId, numericAmount)
            await loadDebts(); toast.success("Amortização registrada!"); setPaymentModalOpen(false)
        } catch (error) { toast.error("Erro no processamento.") } 
        finally { setIsPaying(false) }
    }

    const engine = useMemo(() => {
      const safeDebts = debts || []
      const totalRemaining = safeDebts.reduce((acc, d) => acc + Number(d.remaining_amount), 0)
      const totalOriginal = safeDebts.reduce((acc, d) => acc + Number(d.total_amount), 0)
      const monthlyInterestBurn = safeDebts.reduce((acc, d) => acc + (Number(d.remaining_amount) * (Number(d.interest_rate || 0) / 100)), 0)
      const totalPaid = totalOriginal - totalRemaining
      const globalProgress = Math.max(0, Math.min(100, totalOriginal > 0 ? (totalPaid / totalOriginal) * 100 : 0))
      
      const sortedDebts = [...safeDebts].filter(d => Number(d.remaining_amount) > 0).sort((a, b) => {
        if (strategyMode === 'avalanche') return Number(b.interest_rate || 0) - Number(a.interest_rate || 0)
        return Number(a.remaining_amount) - Number(b.remaining_amount)
      })

      const primaryTarget = sortedDebts.length > 0 ? sortedDebts[0] : null
      
      let maxMonths = 0;
      let monthlyPmtTotal = 0;

      safeDebts.forEach(d => {
        const pmt = Number(d.monthly_payment) || 0;
        const rem = Number(d.remaining_amount) || 0;
        const rate = (Number(d.interest_rate) || 0) / 100;
        monthlyPmtTotal += pmt;

        if (pmt > 0 && rem > 0) {
            let m = rate > 0 && pmt > rem * rate 
                ? Math.ceil(-Math.log(1 - (rate * rem) / pmt) / Math.log(1 + rate))
                : Math.ceil(rem / (pmt || 1));
            if (m > maxMonths) maxMonths = m;
        }
      });

      const projectionData = [];
      let tempBalance = totalRemaining;
      const step = monthlyPmtTotal || (totalRemaining * 0.1);

      for (let i = 0; i <= 12; i++) {
          const d = new Date();
          d.setMonth(d.getMonth() + i);
          projectionData.push({
              month: d.toLocaleDateString('pt-BR', { month: 'short' }),
              saldo: Math.max(0, Number(tempBalance.toFixed(2))) // ✅ CORREÇÃO DE NÚMERO EXORBITANTE
          });
          tempBalance -= (step - monthlyInterestBurn);
          if (tempBalance < -500) break;
      }

      return { 
          totalRemaining, totalOriginal, totalPaid, globalProgress, monthlyInterestBurn, 
          primaryTarget, sortedDebts, projectionData,
          freedomDate: maxMonths > 0 && maxMonths < 360 ? `em ${maxMonths} meses` : 'Sob Análise (Renegocie)'
      }
    }, [debts, strategyMode])

    const generateAIStrategy = async () => {
        if (debts.length === 0) return toast.info("Sem passivos registrados.")
        setAnalyzing(true)
        try {
            const tr = await financeService.getTransactions()
            const response = await fetch('/api/ai/debt-strategy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ debts, transactions: tr }) })
            const data = await response.json()
            setAiStrategyText(data.strategy)
            toast.success("Plano de Guerra Gerado!")
        } catch (e) { toast.error("Falha neural.") } finally { setAnalyzing(false) }
    }

    if (loading) return <div className="flex justify-center items-center h-screen bg-[#050505]"><Loader2 className="animate-spin text-rose-500" size={40}/></div>

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 space-y-10 animate-in fade-in duration-700 pb-32 max-w-7xl mx-auto selection:bg-rose-500/30">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl font-black text-white tracking-tight uppercase italic">Sala de Guerra</h1>
                        <span className="text-[9px] bg-rose-500/10 text-rose-500 border border-rose-500/20 px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1.5">
                            <Swords size={12} /> Live
                        </span>
                    </div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] opacity-80">Otimização Neural de Amortização</p>
                </div>
                <button type="button" onClick={() => setIsModalOpen(true)} className="bg-white text-black px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl active:scale-95">
                    <Plus size={16} className="inline mr-2" /> Novo Passivo
                </button>
            </div>

            {debts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                    <CheckCircle2 size={64} className="mb-6 text-emerald-500/20"/>
                    <h2 className="text-2xl font-black text-white text-center uppercase italic tracking-tighter">Célula Limpa</h2>
                    <p className="text-gray-600 mt-2 max-w-sm text-center mb-8 uppercase tracking-[0.2em] text-[10px]">Patrimônio protegido contra juros bancários.</p>
                </div>
            ) : (
            <>
              {/* DASHBOARD CENTRAL */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <div className="bg-[#09090b]/40 backdrop-blur-2xl border border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
                        <div className="flex flex-col md:flex-row gap-12 relative z-10">
                            <div className="w-full md:w-56 space-y-6">
                                <div className="flex items-center gap-2"><Crosshair size={18} className="text-rose-500" /><h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Ataque</h3></div>
                                <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
                                    <button onClick={() => setStrategyMode('avalanche')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${strategyMode === 'avalanche' ? 'bg-rose-600 text-white shadow-lg' : 'text-gray-600 hover:text-gray-300'}`}>Avalanche</button>
                                    <button onClick={() => setStrategyMode('snowball')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${strategyMode === 'snowball' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:text-gray-300'}`}>Neve</button>
                                </div>
                            </div>
                            <div className="w-px h-32 bg-white/5 hidden md:block" />
                            {engine.primaryTarget && (
                              <div className="flex-1">
                                  <div className="flex justify-between items-start mb-4">
                                      <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${strategyMode === 'avalanche' ? 'text-rose-500' : 'text-blue-400'}`}><ShieldAlert size={14} /> Alvo Prioritário</h3>
                                      <span className="text-[9px] px-2 py-1 rounded bg-white/5 text-gray-500 font-black uppercase">{engine.primaryTarget.interest_rate}% A.M.</span>
                                  </div>
                                  <h2 className="text-4xl font-black text-white mb-6 italic tracking-tighter uppercase truncate">{engine.primaryTarget.name}</h2>
                                  <div className="flex items-end justify-between">
                                      <div><p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mb-1">Pendente</p><p className="text-2xl font-black text-white tracking-tighter">{formatCurrency(Number(engine.primaryTarget.remaining_amount))}</p></div>
                                      <button type="button" onClick={() => openPaymentModal(engine.primaryTarget!.id)} className="bg-white text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl active:scale-95">Amortizar</button>
                                  </div>
                              </div>
                            )}
                        </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                      <div className="bg-[#09090b]/40 border border-white/5 p-6 rounded-[2.5rem] shadow-xl">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Dívida Consolidada</p>
                          <h3 className="text-3xl font-black text-white tracking-tighter">{formatCurrency(engine.totalRemaining)}</h3>
                          <div className="mt-6">
                              <div className="flex justify-between text-[9px] font-black uppercase mb-2"><span className="text-gray-600">Quitado</span><span className="text-emerald-500">{engine.globalProgress.toFixed(1)}%</span></div>
                              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${engine.globalProgress}%` }} className="h-full bg-emerald-500" /></div>
                          </div>
                      </div>
                      <div className="bg-gradient-to-br from-rose-900/10 to-[#09090b] border border-rose-500/10 p-6 rounded-[2.5rem] shadow-xl">
                          <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-1">Dreno de Juros/Mês</p>
                          <h3 className="text-3xl font-black text-rose-500 tracking-tighter">-{formatCurrency(engine.monthlyInterestBurn)}</h3>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-7 bg-[#09090b]/40 border border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><CalendarClock size={14} /> Horizonte de Quitação</p>
                      <h3 className="text-2xl font-black text-white italic tracking-tight uppercase mb-8">Ciclo Final <span className="text-emerald-400">{engine.freedomDate}</span></h3>
                      <div className="h-[200px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={engine.projectionData}>
                                  <defs><linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient></defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 10}} dy={10} />
                                  <YAxis hide />
                                  <Area type="monotone" dataKey="saldo" stroke="#f43f5e" strokeWidth={3} fill="url(#colorSaldo)" dot={{ fill: '#f43f5e', r: 4 }} />
                                  <RechartsTooltip 
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} 
                                    // ✅ CORREÇÃO DE TIPAGEM NO FORMATTER (image_503d3e.png)
                                    formatter={(value: any) => [formatCurrency(Number(value)), 'Saldo Devedor']}
                                    labelStyle={{ color: '#666', fontWeight: 'bold', marginBottom: '4px' }}
                                  />
                              </AreaChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900/20 to-[#09090b] border border-indigo-500/20 rounded-[3rem] p-8 relative overflow-hidden group shadow-2xl">
                      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/5">
                          <div className="h-12 w-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 text-indigo-400"><BrainCircuit size={24} /></div>
                          <div><h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Estrategista</h3><p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Protocolo Neural</p></div>
                      </div>
                      <div className="h-[120px] overflow-y-auto custom-scrollbar mb-6 text-xs text-gray-300 font-medium leading-relaxed bg-black/20 p-4 rounded-2xl border border-white/5 italic">
                        {aiStrategyText || "Aguardando comando para auditar faturas e sugerir amortização estratégica baseada no seu caixa livre."}
                      </div>
                      <button type="button" onClick={generateAIStrategy} disabled={analyzing} className="w-full bg-white text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                          {analyzing ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16} />} 
                          {analyzing ? "Processando..." : "Gerar Plano de Guerra"}
                      </button>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {engine.sortedDebts.map((debt, index) => {
                      const isTarget = index === 0;
                      const progress = Math.max(0, Math.min(100, ((Number(debt.total_amount) - Number(debt.remaining_amount)) / Number(debt.total_amount)) * 100))
                      return (
                          <motion.div layout key={debt.id} className={`bg-[#0a0a0c]/40 border border-white/5 p-6 rounded-[2.5rem] hover:border-white/10 transition-all group ${isTarget ? 'ring-2 ring-rose-500/20 bg-rose-500/[0.02]' : ''}`}>
                              <div className="flex justify-between items-start mb-6">
                                  <h4 className="font-black text-white text-base uppercase italic tracking-tighter truncate w-3/4 group-hover:text-rose-400 transition-colors">{debt.name}</h4>
                                  <button type="button" onClick={() => deleteDebt(debt.id).then(loadDebts)} className="p-2 text-gray-600 hover:text-rose-500 transition-colors bg-white/5 rounded-xl"><X size={14}/></button>
                              </div>
                              <div className="space-y-6">
                                  <div><p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 italic">Dívida Aberta</p><p className="text-xl font-black text-white">{formatCurrency(Number(debt.remaining_amount))}</p></div>
                                  <div className="space-y-2">
                                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className={`h-full ${isTarget ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-emerald-500'}`} /></div>
                                  </div>
                                  <button type="button" onClick={() => openPaymentModal(debt.id)} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all active:scale-95">Abatimento Direto</button>
                              </div>
                          </motion.div>
                      )
                  })}
              </div>
            </>
            )}

            <NewDebtModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={loadDebts} />

            {paymentModalOpen && selectedDebtId && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm bg-[#09090b] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative">
                        <button type="button" onClick={() => setPaymentModalOpen(false)} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors"><X size={20}/></button>
                        <h3 className="text-xl font-black text-white mb-6 uppercase italic tracking-tighter flex items-center gap-3"><Banknote className="text-emerald-400" size={24}/> Amortizar</h3>
                        <div className="space-y-6">
                            <div className="text-center">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Valor do Aporte Extra</label>
                                <input type="text" inputMode="decimal" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="0,00" autoFocus className="w-full mt-2 bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-3xl font-black outline-none focus:border-emerald-500/50 text-center" />
                            </div>
                            <button type="button" onClick={confirmPayment} disabled={!paymentAmount || isPaying} className="w-full bg-emerald-600 text-white font-black py-5 text-[10px] uppercase tracking-[0.3em] rounded-2xl transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)] active:scale-95 flex justify-center items-center">
                                {isPaying ? <Loader2 className="animate-spin text-white" size={20}/> : 'Confirmar Pagamento'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}

const triggerAiHelp = (prompt: string) => {
    navigator.clipboard.writeText(prompt)
    toast.success("Estratégia Copiada!", {
        description: "Abra o chat e cole a auditoria neural.",
        icon: <Sparkles className="text-indigo-400" />
    })
}