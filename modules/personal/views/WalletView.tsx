'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard, Plus, ShieldCheck, 
  TrendingUp, Sparkles, X, ChevronRight, PieChart as PieIcon,
  CalendarClock, Loader2, Trash2, Landmark, BrainCircuit, Lock,
  CheckCircle2 
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { financeService } from '@/services/financeService'
import { createTransaction } from '@/core/action/transactions' // 🔥 Importado para sincronizar saldo
import { CreditCard as CreditCardType, Transaction } from '@/types_db'
import { toast } from 'sonner'
import UpgradeModal from '@/core/components/UpgradeModal'

// --- TIPAGENS ---
interface CardUI extends CreditCardType {
  current_invoice: number 
  color: string 
  last_4_digits?: string 
}

interface BankAccount {
  id: string
  name: string
  balance: number
  color: string
}

interface WalletViewProps {
  user: any
}

const CARD_GRADIENTS = [
  'from-indigo-600 to-blue-700', 'from-emerald-500 to-teal-600', 
  'from-rose-500 to-orange-600', 'from-gray-800 to-zinc-900', 
  'from-blue-800 to-indigo-950', 'from-pink-600 to-purple-700'
]
const COLORS = ['#818cf8', '#34d399', '#fb7185', '#fbbf24', '#a78bfa', '#f472b6']

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const GlassCard = ({ children, className = "", onClick, isLocked = false }: any) => (
  <motion.div 
    whileHover={onClick && !isLocked ? { y: -4, scale: 1.01 } : {}}
    transition={{ duration: 0.3 }}
    onClick={onClick}
    className={`relative bg-[#09090b]/40 backdrop-blur-2xl border border-white/[0.05] rounded-[2.5rem] overflow-hidden shadow-2xl ${className} ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-gradient-to-br from-white to-transparent" />
    <div className={`relative z-10 ${isLocked ? 'blur-sm grayscale' : ''}`}>{children}</div>
  </motion.div>
)

const CreditCardComponent = ({ card, onDelete }: { card: CardUI, onDelete: (id: string) => void }) => {
  const usagePercent = Number(card.limit_amount) > 0 ? (card.current_invoice / Number(card.limit_amount)) * 100 : 0
  const healthColor = usagePercent > 80 ? 'bg-rose-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-indigo-400'

  return (
    <div className={`relative h-56 w-full rounded-[2rem] p-6 flex flex-col justify-between group transition-all duration-500 overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-br ${card.color}`}>
      <button onClick={(e) => { e.stopPropagation(); onDelete(card.id); }} className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-rose-500 rounded-full text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-sm">
        <Trash2 size={16} />
      </button>
      <div className="flex justify-between items-start z-10">
        <div>
          <h3 className="text-white font-black text-xl tracking-tight leading-none mb-1">{card.name}</h3>
          <p className="text-white/40 text-[10px] font-black tracking-[0.2em] uppercase">{card.brand}</p>
        </div>
        <Sparkles className="text-white/20" size={20} />
      </div>
      <div className="w-12 h-9 bg-gradient-to-br from-yellow-200 to-yellow-600 rounded-lg shadow-inner flex items-center justify-center opacity-80 z-10" />
      <div className="z-10">
        <p className="text-white font-mono text-xl tracking-[0.2em] drop-shadow-lg mb-4">•••• •••• •••• {card.last_4_digits || '0000'}</p>
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black text-white/80 uppercase tracking-widest">
            <span>Uso: {usagePercent.toFixed(0)}%</span>
            <span>{formatCurrency(card.current_invoice)}</span>
          </div>
          <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(usagePercent, 100)}%` }} className={`h-full ${healthColor}`} />
          </div>
          <div className="flex justify-between text-[9px] font-bold text-white/40 uppercase">
            <span>Limite: {formatCurrency(Number(card.limit_amount))}</span>
            <span>Vence dia {card.due_day}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WalletView({ user }: WalletViewProps) {
  const [loading, setLoading] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [cards, setCards] = useState<CardUI[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isAddCardOpen, setIsAddCardOpen] = useState(false)
  const [isAddBankOpen, setIsAddBankOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aiLimitStrategy, setAiLimitStrategy] = useState<string | null>(null)
  const [generatingStrategy, setGeneratingStrategy] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])

  const userPlan = user?.user_metadata?.plan_tier || 'free'
  const isFreePlan = userPlan !== 'pro' && userPlan !== 'premium'

  const loadData = async () => {
    try {
      const [dbCards, dbTrans] = await Promise.all([financeService.getCards(), financeService.getTransactions()])
      const currentMonth = new Date().getMonth()
      const formattedCards = dbCards.map((c, index) => {
          const invoice = dbTrans.filter((t: any) => t.payment_method === c.name && new Date(t.date).getMonth() === currentMonth && t.type !== 'receita').reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount || 0)), 0)
          return { ...c, color: CARD_GRADIENTS[index % CARD_GRADIENTS.length], current_invoice: invoice }
      })
      setCards(formattedCards as CardUI[])
      setTransactions(dbTrans)
      setBankAccounts(JSON.parse(localStorage.getItem('cerebro_banks') || '[]'))
    } catch (error) { toast.error("Erro ao carregar dados.") } finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  // 🔥 SINCRONIZAÇÃO GLOBAL: Cria transação no banco para atualizar o Dashboard
  const handleAddBank = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const bankName = formData.get('bankName') as string
    const balanceValue = Number(formData.get('balance'))

    if (isNaN(balanceValue)) return

    try {
        const transactionData = new FormData()
        transactionData.set('amount', balanceValue.toString())
        transactionData.set('description', `Saldo Inicial: ${bankName}`)
        transactionData.set('category', 'Outros')
        transactionData.set('type', 'receita') // Receita para somar ao saldo do sistema
        transactionData.set('date', new Date().toISOString().split('T')[0])
        transactionData.set('payment_method', bankName)
        transactionData.set('is_paid', 'true')
        transactionData.set('is_fixed', 'false')

        await createTransaction(transactionData)

        const newBank: BankAccount = {
            id: Date.now().toString(),
            name: bankName,
            balance: balanceValue,
            color: CARD_GRADIENTS[bankAccounts.length % CARD_GRADIENTS.length]
        }
        
        const updated = [...bankAccounts, newBank]
        setBankAccounts(updated)
        localStorage.setItem('cerebro_banks', JSON.stringify(updated))
        
        toast.success(`Saldo sincronizado com o sistema global!`)
        setIsAddBankOpen(false)
        loadData()
    } catch (error) { toast.error("Erro ao sincronizar saldo.") }
  }

  const handleAddCard = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setSaving(true)
    const formData = new FormData(e.currentTarget)
    try {
        await financeService.createCard({
            name: formData.get('institution') as string, brand: formData.get('brand') as string, last_4_digits: formData.get('last4') as string,
            limit_amount: Number(formData.get('limit')), due_day: Number(formData.get('due_day')), closing_day: Number(formData.get('closing_day')),
            color_start: '#6366f1', color_end: '#3b82f6'
        })
        toast.success("Cartão sincronizado!"); setIsAddCardOpen(false); loadData()
    } catch (error: any) { toast.error("Erro ao salvar.") } finally { setSaving(false) }
  }

  const handleDeleteCard = async (id: string) => {
    if(!confirm("Tem certeza que deseja remover este cartão?")) return
    try { await financeService.deleteCard(id); toast.success("Removido"); loadData() } catch { toast.error("Erro ao remover") }
  }

  const handleGenerateLimitStrategy = async () => {
    if (isFreePlan) { setShowUpgradeModal(true); return }
    if (cards.length === 0) return toast.error("Adicione um cartão primeiro.")
    setGeneratingStrategy(true)
    try {
        const cardData = `Cartão: ${cards[0].name} (Limite: R$ ${cards[0].limit_amount}, Uso: R$ ${cards[0].current_invoice})`
        const response = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: "Estratégia para aumento de limite.", context: { context: cardData } }) })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Falha ao consultar a IA.')
        setAiLimitStrategy(data.response)
    } catch (error) { toast.error("Erro na IA.") } finally { setGeneratingStrategy(false) }
  }

  const creditSummary = useMemo(() => {
    const totalLimit = cards.reduce((acc, card) => acc + Number(card.limit_amount), 0)
    const totalUsed = cards.reduce((acc, card) => acc + Number(card.current_invoice), 0)
    return { totalLimit, totalUsed, available: totalLimit - totalUsed, usagePercent: totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0 }
  }, [cards])

  const realCategoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type !== 'receita' && new Date(t.date).getMonth() === new Date().getMonth())
    const grouped = expenses.reduce((acc: any, t: any) => { const cat = t.category || 'Outros'; acc[cat] = (acc[cat] || 0) + Math.abs(Number(t.amount || 0)); return acc }, {})
    return Object.entries(grouped).map(([name, value], i) => ({ name, value: value as number, color: COLORS[i % COLORS.length] })).sort((a: any, b: any) => b.value - a.value).slice(0, 5)
  }, [transactions])

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-10 space-y-10 pb-32 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <header><h1 className="text-4xl font-black tracking-tight mb-2">Minha Carteira</h1><p className="text-gray-500 font-medium">Gestão centralizada de ativos e crédito.</p></header>

      {/* CONTAS BANCÁRIAS */}
      <section className="space-y-6">
          <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2"><Landmark className="text-emerald-400" size={20} /> Bancos Sincronizados</h2>
              <button onClick={() => setIsAddBankOpen(true)} className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl hover:bg-white/10 transition">+ Conectar Banco</button>
          </div>
          <div className="flex overflow-x-auto gap-6 pb-2 scrollbar-hide">
              <GlassCard className="min-w-[240px] p-6 bg-emerald-500/5 border-emerald-500/20">
                  <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest mb-1">Saldo Líquido Total</p>
                  <h3 className="text-3xl font-black text-emerald-400 tracking-tight">{formatCurrency(bankAccounts.reduce((acc, b) => acc + b.balance, 0))}</h3>
              </GlassCard>
              {bankAccounts.slice(0, isFreePlan ? 2 : 10).map(bank => (
                  <GlassCard key={bank.id} className="min-w-[220px] p-6 hover:border-white/20 transition-all">
                      <div className="flex justify-between items-start mb-6"><p className="font-bold text-white text-sm">{bank.name}</p><Landmark size={16} className="text-gray-600"/></div>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Disponível</p>
                      <h3 className="text-xl font-bold text-white">{formatCurrency(bank.balance)}</h3>
                  </GlassCard>
              ))}
              {isFreePlan && bankAccounts.length > 2 && (
                  <GlassCard onClick={() => setShowUpgradeModal(true)} className="min-w-[220px] p-6 border-dashed border-indigo-500/30 flex flex-col items-center justify-center text-center gap-2">
                      <Lock size={20} className="text-indigo-500" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">+{bankAccounts.length - 2} Contas Ocultas</p>
                  </GlassCard>
              )}
          </div>
      </section>

      {/* MÉTRICAS DE CRÉDITO */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <GlassCard className="lg:col-span-3 p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none group-hover:bg-indigo-600/20 transition-all duration-700" />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 relative z-10">
               <div>
                  <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Poder de Compra Global</h2>
                  <div className="flex items-baseline gap-3"><span className="text-5xl font-black text-white tracking-tighter">{formatCurrency(creditSummary.available)}</span><span className="text-xs font-bold text-indigo-400 uppercase">Livre</span></div>
               </div>
               <div className="px-5 py-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2 text-indigo-400"><ShieldCheck size={18} /><span className="text-[10px] font-black uppercase tracking-widest">Saúde de Crédito</span></div>
            </div>
            <div className="space-y-4 relative z-10">
               <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest"><span>Uso da Linha: {creditSummary.usagePercent.toFixed(1)}%</span><span>Limite Total: {formatCurrency(creditSummary.totalLimit)}</span></div>
               <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(creditSummary.usagePercent, 100)}%` }} transition={{ duration: 1.5, ease: "circOut" }} className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]"/></div>
            </div>
         </GlassCard>
         <GlassCard className="p-8 flex flex-col justify-center items-center text-center bg-indigo-500/[0.03]">
             <div className="p-5 rounded-3xl bg-indigo-500/10 text-indigo-400 mb-6 border border-indigo-500/10"><CalendarClock size={32} /></div>
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Faturas em Aberto</p>
             <h3 className="text-3xl font-black text-white tracking-tight">{formatCurrency(creditSummary.totalUsed)}</h3>
         </GlassCard>
      </section>

      {/* CARTÕES ATIVOS */}
      <section className="space-y-8">
         <h2 className="text-xl font-bold flex items-center gap-2"><CreditCard className="text-indigo-400" size={20} /> Cartões Ativos</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cards.map((card) => (<CreditCardComponent key={card.id} card={card} onDelete={handleDeleteCard} />))}
            <button onClick={() => setIsAddCardOpen(true)} className="h-56 w-full rounded-[2rem] border-2 border-dashed border-white/5 hover:border-indigo-500/40 hover:bg-indigo-500/5 flex flex-col items-center justify-center gap-4 group transition-all">
                <div className="p-4 rounded-full bg-white/5 group-hover:scale-110 transition-transform"><Plus size={32} className="text-gray-600 group-hover:text-indigo-400" /></div>
                <span className="text-[10px] font-black text-gray-600 group-hover:text-indigo-400 uppercase tracking-[0.2em]">Novo Cartão</span>
            </button>
         </div>
      </section>

      {/* GRÁFICO E IA */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <GlassCard className="lg:col-span-2 p-8">
            <div className="flex items-center gap-2 mb-10"><PieIcon className="text-rose-500" size={20} /><h3 className="text-lg font-bold">Distribuição de Gastos</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
               <div className="h-[240px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie data={realCategoryData} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">{realCategoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie>
                        <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), 'Gasto']} contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)', color: '#fff' }} itemStyle={{ color: '#fff', fontWeight: 'bold' }}/>
                     </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="space-y-4">
                  {realCategoryData.map((cat: any) => (
                    <div key={cat.name} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                        <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} /><span className="text-xs font-bold text-gray-300">{cat.name}</span></div>
                        <span className="text-xs font-black text-white">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
               </div>
            </div>
         </GlassCard>

         <div className="relative group">
            <GlassCard className={`h-full min-h-[350px] bg-gradient-to-br from-indigo-900/20 to-black ${isFreePlan ? 'blur-md grayscale pointer-events-none' : ''}`}>
                <div className="p-8 h-full flex flex-col">
                    {aiLimitStrategy ? (
                        <div className="flex flex-col h-full animate-in fade-in duration-500"><div className="flex items-center gap-2 mb-6"><BrainCircuit className="text-indigo-400" size={24}/> <h3 className="font-bold text-white uppercase tracking-tight">Plano de Expansão</h3></div><div className="flex-1 text-sm text-gray-400 leading-relaxed overflow-y-auto custom-scrollbar pr-2 font-medium">{aiLimitStrategy}</div><button onClick={() => setAiLimitStrategy(null)} className="mt-6 text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors">Nova Análise</button></div>
                    ) : (
                        <div className="h-full flex flex-col justify-between"><div><div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8 border border-indigo-500/20"><TrendingUp className="text-indigo-400" size={28} /></div><h3 className="text-2xl font-black text-white mb-3 tracking-tighter uppercase">Turbinar Limite</h3><p className="text-sm text-gray-400 leading-relaxed font-medium">Nossa IA cria o script exato para você negociar seu aumento de limite no banco.</p></div><button onClick={handleGenerateLimitStrategy} disabled={generatingStrategy} className="w-full py-4 bg-white text-black font-black rounded-2xl transition-all text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3">{generatingStrategy ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}{generatingStrategy ? 'PROCESSANDO...' : 'GERAR ESTRATÉGIA IA'}</button></div>
                    )}
                </div>
            </GlassCard>
            {isFreePlan && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-20">
                    <div className="h-14 w-14 bg-indigo-500/20 text-indigo-400 rounded-3xl flex items-center justify-center mb-4 border border-indigo-500/20"><Lock size={24}/></div>
                    <p className="text-xs font-black text-white uppercase tracking-widest mb-6">Recurso PRO</p>
                    <button onClick={() => setShowUpgradeModal(true)} className="bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest px-8 py-4 rounded-2xl shadow-2xl">Desbloquear Agora</button>
                </div>
            )}
         </div>
      </section>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      {/* MODAL CARTÃO */}
      <AnimatePresence>
        {isAddCardOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-md bg-[#09090b] border border-white/10 rounded-[2.5rem] p-8">
                    <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Vincular Cartão</h3><button onClick={() => setIsAddCardOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X size={20} className="text-gray-500"/></button></div>
                    <form className="space-y-6" onSubmit={handleAddCard}>
                        <div><label className="text-[10px] font-black text-gray-500 uppercase ml-1 tracking-widest">Instituição</label><input name="institution" required placeholder="Nubank, Inter..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-indigo-500/50 outline-none" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-[10px] font-black text-gray-500 uppercase ml-1 tracking-widest">Últimos 4 Dígitos</label><input name="last4" required maxLength={4} placeholder="0000" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-mono text-center outline-none focus:border-indigo-500/50" /></div>
                            <div><label className="text-[10px] font-black text-gray-500 uppercase ml-1 tracking-widest">Bandeira</label><select name="brand" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none cursor-pointer [color-scheme:dark]"><option value="Mastercard">Mastercard</option><option value="Visa">Visa</option><option value="Elo">Elo</option></select></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-[10px] font-black text-gray-500 uppercase ml-1 tracking-widest">Vencimento (Dia)</label><input name="due_day" required type="number" min="1" max="31" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-center outline-none" /></div>
                            <div><label className="text-[10px] font-black text-gray-500 uppercase ml-1 tracking-widest">Limite Total</label><input name="limit" required type="number" step="0.01" placeholder="0.00" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none" /></div>
                        </div>
                        <button disabled={saving} type="submit" className="w-full bg-white text-black font-black py-5 rounded-2xl text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3">{saving ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>}{saving ? 'PROCESSANDO...' : 'Sincronizar Ativo'}</button>
                    </form>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL BANCO */}
      <AnimatePresence>
        {isAddBankOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-sm bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
                    <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white flex items-center gap-2"><Landmark className="text-emerald-400"/> Nova Conta</h3><button onClick={() => setIsAddBankOpen(false)}><X className="text-gray-500 hover:text-white" /></button></div>
                    <form className="space-y-4" onSubmit={handleAddBank}>
                        <div><label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Banco</label><input name="bankName" required placeholder="Ex: Itaú, Nubank..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500/50 outline-none mt-1" /></div>
                        <div><label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Saldo Inicial (R$)</label><input name="balance" required type="number" step="0.01" placeholder="0.00" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500/50 outline-none mt-1" /></div>
                        <button type="submit" className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition shadow-xl">Adicionar Conta</button>
                    </form>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
