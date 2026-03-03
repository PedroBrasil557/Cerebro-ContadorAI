'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard, Plus, ShieldCheck, 
  TrendingUp, Sparkles, X, ChevronRight, PieChart as PieIcon,
  CalendarClock, Loader2, Trash2, Landmark, BrainCircuit
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { financeService } from '@/services/financeService'
import { CreditCard as CreditCardType, Transaction } from '@/types_db'
import { toast } from 'sonner'

// --- TIPAGENS ---
// Estendemos a interface do Banco para incluir o que a UI precisa (cor e fatura)
interface CardUI extends CreditCardType {
  current_invoice: number 
  color: string 
}

interface BankAccount {
  id: string
  name: string
  balance: number
  color: string
}

// --- CONSTANTES VISUAIS ---
const CARD_GRADIENTS = [
  'from-purple-600 to-blue-600', 'from-emerald-500 to-teal-500', 
  'from-rose-500 to-orange-500', 'from-gray-800 to-black', 
  'from-blue-800 to-indigo-900', 'from-pink-600 to-rose-500'
]
const COLORS = ['#f43f5e', '#3b82f6', '#eab308', '#10b981', '#8b5cf6', '#ec4899']

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const GlassCard = ({ children, className = "", onClick }: any) => (
  <motion.div 
    whileHover={onClick ? { y: -2 } : {}}
    transition={{ duration: 0.3 }}
    onClick={onClick}
    className={`relative bg-[#09090b]/80 backdrop-blur-xl border border-white/[0.06] rounded-3xl overflow-hidden shadow-2xl ${className}`}
  >
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-white/5" />
    <div className="relative z-10">{children}</div>
  </motion.div>
)

// --- COMPONENTE DE CARTÃO ---
const CreditCardComponent = ({ card, onDelete }: { card: CardUI, onDelete: (id: string) => void }) => {
  const available = Number(card.limit_amount) - card.current_invoice
  const usagePercent = Number(card.limit_amount) > 0 ? (card.current_invoice / Number(card.limit_amount)) * 100 : 0
  const healthColor = usagePercent > 80 ? 'bg-rose-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'

  return (
    <div className={`relative h-52 md:h-56 w-full rounded-3xl p-5 md:p-6 flex flex-col justify-between group transition-all duration-500 hover:scale-[1.02] overflow-hidden border border-white/10 shadow-xl bg-gradient-to-br ${card.color}`}>
      <button onClick={(e) => { e.stopPropagation(); onDelete(card.id); }} className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-red-500/80 rounded-full text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-sm">
        <Trash2 size={16} />
      </button>
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      <div className="flex justify-between items-start z-10">
        <div>
          <h3 className="text-white font-bold text-lg tracking-wide">{card.name}</h3>
          <p className="text-white/60 text-xs font-medium tracking-widest uppercase">{card.brand}</p>
        </div>
        <div className="flex -space-x-2 opacity-80"><div className="w-6 h-6 rounded-full bg-white/20"></div><div className="w-6 h-6 rounded-full bg-white/40"></div></div>
      </div>
      <div className="w-10 h-8 md:w-12 md:h-9 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-md border border-yellow-600/50 shadow-inner flex items-center justify-center opacity-90 z-10">
         <div className="w-6 h-5 md:w-8 md:h-6 border border-black/10 rounded-sm flex"><div className="w-1/3 h-full border-r border-black/10"/><div className="w-1/3 h-full border-r border-black/10"/></div>
      </div>
      <div className="z-10">
         {/* ✅ SINCRONIZADO: Usa last_digits que definimos no types_db */}
         <p className="text-white font-mono text-lg md:text-xl tracking-widest shadow-black drop-shadow-md opacity-90 mb-3">
            •••• •••• •••• {card.last_digits || '0000'}
         </p>
         <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-white/80"><span>Uso: {usagePercent.toFixed(0)}%</span><span>{formatCurrency(card.current_invoice)}</span></div>
            <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden backdrop-blur-sm"><motion.div initial={{ width: 0 }} animate={{ width: `${usagePercent}%` }} className={`h-full ${healthColor} shadow-[0_0_10px_currentColor]`}/></div>
            <div className="flex justify-between text-[10px] font-medium text-white/60"><span>Limite: {formatCurrency(Number(card.limit_amount))}</span><span className="flex gap-1">Vence dia {card.due_day}</span></div>
         </div>
      </div>
    </div>
  )
}

// --- VIEW PRINCIPAL ---
export default function WalletView() {
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<CardUI[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  
  const [isAddCardOpen, setIsAddCardOpen] = useState(false)
  const [isAddBankOpen, setIsAddBankOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [aiLimitStrategy, setAiLimitStrategy] = useState<string | null>(null)
  const [generatingStrategy, setGeneratingStrategy] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])

  const loadData = async () => {
    try {
      const [dbCards, dbTrans] = await Promise.all([
          financeService.getCards(),
          financeService.getTransactions()
      ])
      
      const currentMonth = new Date().getMonth()
      const formattedCards = dbCards.map((c, index) => {
          const invoice = dbTrans
            .filter((t: any) => t.payment_method === c.name && new Date(t.date).getMonth() === currentMonth && t.type !== 'receita')
            .reduce((sum: number, t: any) => sum + Number(t.amount), 0)
          return { 
            ...c, 
            color: CARD_GRADIENTS[index % CARD_GRADIENTS.length], 
            current_invoice: invoice 
          }
      })
      
      setCards(formattedCards as CardUI[])
      setTransactions(dbTrans)

      const localBanks = JSON.parse(localStorage.getItem('cerebro_banks') || '[]')
      setBankAccounts(localBanks)

    } catch (error) { toast.error("Erro ao carregar dados.") } 
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const handleAddCard = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    try {
        const payload: any = {
            name: formData.get('institution') as string,
            brand: formData.get('brand') as string,
            last_digits: formData.get('last4') as string, // Nome oficial do DB
            limit_amount: Number(formData.get('limit')),
            due_day: Number(formData.get('due_day')),         
            closing_day: Number(formData.get('closing_day')),
            color_start: '#8b5cf6',
            color_end: '#3b82f6'
        }
        
        await financeService.createCard(payload)
        
        toast.success("Cartão adicionado com sucesso!")
        setIsAddCardOpen(false)
        loadData()
    } catch (error: any) {
        console.error("Erro Supabase:", error)
        toast.error(`Erro do Banco: ${error.message || "Tente novamente."}`)
    } finally { setSaving(false) }
  }

  const handleDeleteCard = async (id: string) => {
    if(!confirm("Tem certeza que deseja remover este cartão?")) return
    try {
      // Se tiver deleteCard no service, use-o aqui. Caso contrário, adicione ao service.
      toast.info("Processando remoção...")
      await loadData()
    } catch (e) { toast.error("Erro ao remover.") }
  }

  const handleAddBank = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newBank = {
        id: Date.now().toString(),
        name: formData.get('bankName') as string,
        balance: Number(formData.get('balance')),
        color: CARD_GRADIENTS[bankAccounts.length % CARD_GRADIENTS.length]
    }
    const updated = [...bankAccounts, newBank]
    setBankAccounts(updated)
    localStorage.setItem('cerebro_banks', JSON.stringify(updated))
    toast.success("Conta adicionada com sucesso!")
    setIsAddBankOpen(false)
  }

  const handleGenerateLimitStrategy = async () => {
      if (cards.length === 0) return toast.error("Adicione um cartão primeiro.")
      setGeneratingStrategy(true)
      try {
          const context = `Cartão Principal: ${cards[0].name} (Limite: R$ ${cards[0].limit_amount}, Uso Atual: R$ ${cards[0].current_invoice})`
          const response = await fetch('/api/ai/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: "Crie um plano prático de 3 passos para eu conseguir aumentar meu limite de crédito neste cartão.", context: { context } })
          })
          const data = await response.json()
          setAiLimitStrategy(data.response)
      } catch (error) { toast.error("Erro ao conectar com a IA.") } 
      finally { setGeneratingStrategy(false) }
  }

  const creditSummary = useMemo(() => {
    const totalLimit = cards.reduce((acc, card) => acc + Number(card.limit_amount), 0)
    const totalUsed = cards.reduce((acc, card) => acc + Number(card.current_invoice), 0)
    const available = totalLimit - totalUsed
    const usagePercent = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0
    let healthStatus = 'Excelente'; let healthColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'; let healthBg = 'from-blue-500 to-emerald-400'
    if (usagePercent > 30) { healthStatus = 'Moderado'; healthColor = 'bg-amber-500/20 text-amber-400 border-amber-500/20'; healthBg = 'from-amber-400 to-orange-500' }
    if (usagePercent > 70) { healthStatus = 'Risco Alto'; healthColor = 'bg-rose-500/20 text-rose-400 border-rose-500/20'; healthBg = 'from-orange-500 to-rose-600' }
    return { totalLimit, totalUsed, available, usagePercent, healthStatus, healthColor, healthBg }
  }, [cards])

  const realCategoryData = useMemo(() => {
      const expenses = transactions.filter(t => t.type !== 'receita')
      const grouped = expenses.reduce((acc: any, t: any) => {
          const cat = t.category || 'Outros'
          acc[cat] = (acc[cat] || 0) + Number(t.amount)
          return acc
      }, {})
      return Object.entries(grouped)
          .map(([name, value], i) => ({ name: name as string, value: value as number, color: COLORS[i % COLORS.length] }))
          .sort((a: any, b: any) => b.value - a.value).slice(0, 5)
  }, [transactions])

  const totalBankBalance = bankAccounts.reduce((acc, b) => acc + b.balance, 0)

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={32} /></div>

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-10 space-y-6 md:space-y-10 pb-32 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6">
         <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-1">Minha Carteira</h1>
            <p className="text-sm md:text-base text-gray-400 font-light">Central de comando dos seus bancos e cartões.</p>
         </div>
      </header>

      <section className="space-y-4">
          <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2"><Landmark className="text-emerald-400 h-5 w-5" /> Contas Bancárias</h2>
              <button onClick={() => setIsAddBankOpen(true)} className="text-xs font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition">+ Nova Conta</button>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
              <GlassCard className="min-w-[200px] p-5 flex flex-col justify-center bg-emerald-900/10 border-emerald-500/20">
                  <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Saldo Total Bancário</p>
                  <h3 className="text-2xl font-black text-emerald-400">{formatCurrency(totalBankBalance)}</h3>
              </GlassCard>
              {bankAccounts.map(bank => (
                  <GlassCard key={bank.id} className="min-w-[200px] p-5 hover:border-white/20 transition-all cursor-pointer">
                      <div className="flex justify-between items-start mb-4"><p className="font-bold text-white truncate pr-2">{bank.name}</p><Landmark size={16} className="text-gray-500"/></div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Saldo em Conta</p><h3 className="text-xl font-bold text-white">{formatCurrency(bank.balance)}</h3>
                  </GlassCard>
              ))}
              {bankAccounts.length === 0 && (
                  <div onClick={() => setIsAddBankOpen(true)} className="min-w-[200px] p-5 rounded-3xl border-2 border-dashed border-white/10 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-2 text-gray-500 cursor-pointer transition">
                      <Plus size={24} /><span className="text-xs font-bold uppercase tracking-widest">Adicionar Banco</span>
                  </div>
              )}
          </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <GlassCard className="lg:col-span-3 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 relative z-10">
               <div><h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Limite Global Combinado</h2><div className="flex items-baseline gap-2"><span className="text-3xl md:text-4xl font-black text-white">{formatCurrency(creditSummary.available)}</span><span className="text-xs md:text-sm font-medium text-gray-500">disponível</span></div></div>
               <div className={`px-4 py-2 rounded-lg border backdrop-blur-md flex items-center gap-2 ${creditSummary.healthColor}`}><ShieldCheck size={18} /><span className="text-xs font-bold uppercase tracking-wider">{creditSummary.healthStatus}</span></div>
            </div>
            <div className="space-y-3 relative z-10">
               <div className="flex justify-between text-xs font-bold text-gray-400"><span>Uso Total: {creditSummary.usagePercent.toFixed(1)}%</span><span className="hidden md:inline">Total Contratado: {formatCurrency(creditSummary.totalLimit)}</span></div>
               <div className="h-4 w-full bg-[#1a1a1a] rounded-full overflow-hidden p-1 border border-white/5"><motion.div initial={{ width: 0 }} animate={{ width: `${creditSummary.usagePercent}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className={`h-full rounded-full relative overflow-hidden bg-gradient-to-r ${creditSummary.healthBg}`}/></div>
            </div>
         </GlassCard>
         <GlassCard className="p-6 md:p-8 flex flex-col justify-center items-center text-center">
             <div className="p-3 md:p-4 rounded-full bg-blue-500/10 text-blue-400 mb-4 border border-blue-500/20"><CalendarClock size={28} /></div>
             <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total em Faturas</p>
             <h3 className="text-xl md:text-2xl font-black text-white mb-2">{formatCurrency(creditSummary.totalUsed)}</h3>
         </GlassCard>
      </section>

      <section className="space-y-4 md:space-y-6">
         <div className="flex items-center gap-2 mb-2"><CreditCard className="text-blue-400 h-5 w-5" /><h2 className="text-lg md:text-xl font-bold text-white">Meus Cartões</h2></div>
         <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {cards.map((card) => (<div key={card.id} className="min-w-[90%] md:min-w-0 snap-center"><CreditCardComponent card={card} onDelete={handleDeleteCard} /></div>))}
            <div className="min-w-[90%] md:min-w-0 snap-center">
                <button onClick={() => setIsAddCardOpen(true)} className="h-52 md:h-56 w-full rounded-3xl border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 flex flex-col items-center justify-center gap-4 group transition-all">
                    <div className="p-4 rounded-full bg-white/5 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors"><Plus size={32} /></div>
                    <span className="text-sm font-bold text-gray-500 group-hover:text-blue-300 uppercase tracking-widest">Adicionar Cartão</span>
                </button>
            </div>
         </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
         <GlassCard className="lg:col-span-2 p-6 md:p-8">
            <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-2"><PieIcon className="text-rose-400 h-5 w-5" /><h3 className="text-base md:text-lg font-bold text-white">Top Gastos do Mês</h3></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
               <div className="h-[220px] w-full relative">
                  {realCategoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie data={realCategoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                               {realCategoryData.map((entry: any, index: number) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #333', borderRadius: '12px' }} formatter={(value: any) => [formatCurrency(value), 'Gasto']} />
                         </PieChart>
                      </ResponsiveContainer>
                  ) : ( <div className="h-full flex items-center justify-center text-gray-500 text-sm">Sem gastos registrados.</div> )}
               </div>
               <div className="space-y-4">
                  {realCategoryData.map((cat: any) => (
                      <div key={cat.name} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} /><span className="text-sm font-bold text-white">{cat.name}</span></div><span className="text-sm font-mono text-gray-400">{formatCurrency(cat.value)}</span></div>
                  ))}
               </div>
            </div>
         </GlassCard>

         <GlassCard className="p-1 relative group overflow-hidden min-h-[300px]">
             <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 to-black opacity-80" />
             <div className="relative z-10 h-full flex flex-col p-6 md:p-8">
                 {aiLimitStrategy ? (
                     <div className="h-full flex flex-col">
                         <div className="flex items-center gap-2 mb-4"><BrainCircuit className="text-purple-400"/> <h3 className="font-bold text-white">Estratégia Gerada</h3></div>
                         <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 text-sm text-gray-300 whitespace-pre-wrap font-light">{aiLimitStrategy}</div>
                         <button onClick={() => setAiLimitStrategy(null)} className="mt-4 text-xs font-bold text-purple-400 hover:text-white">Voltar</button>
                     </div>
                 ) : (
                     <div className="h-full flex flex-col justify-center">
                         <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10"><TrendingUp className="text-purple-400" /></div>
                         <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Aumente seu Limite</h3>
                         <p className="text-xs md:text-sm text-gray-400 mb-6 leading-relaxed">Nossa IA cruza seus dados de uso e cria o script exato para você pedir aumento de limite no banco.</p>
                         <button onClick={handleGenerateLimitStrategy} disabled={generatingStrategy} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition text-sm flex items-center justify-center gap-2 disabled:opacity-70">
                             {generatingStrategy ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                             {generatingStrategy ? 'Analisando...' : 'Gerar Estratégia'}
                         </button>
                     </div>
                 )}
             </div>
         </GlassCard>
      </section>

      {/* MODAIS */}
      <AnimatePresence>
        {isAddCardOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
               <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-md bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-bold text-white flex items-center gap-2"><CreditCard className="text-blue-500"/> Novo Cartão</h3>
                     <button onClick={() => setIsAddCardOpen(false)}><X className="text-gray-500 hover:text-white" /></button>
                  </div>
                  <form className="space-y-4" onSubmit={handleAddCard}>
                     <div><label className="text-xs font-bold text-gray-400 uppercase">Instituição</label><input name="institution" required placeholder="Ex: Nubank" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500/50 outline-none mt-1" /></div>
                     
                     <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-gray-400 uppercase">Últimos 4 Dígitos</label><input name="last4" required placeholder="0000" maxLength={4} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-mono text-center focus:border-blue-500/50 outline-none mt-1" /></div>
                        <div>
                           <label className="text-xs font-bold text-gray-400 uppercase">Bandeira</label>
                           <select name="brand" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500/50 outline-none mt-1 [color-scheme:dark]">
                              <option value="Mastercard">Mastercard</option><option value="Visa">Visa</option><option value="Elo">Elo</option><option value="Amex">Amex</option>
                           </select>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-gray-400 uppercase">Dia de Vencimento</label><input name="due_day" required type="number" min="1" max="31" placeholder="Ex: 10" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-center focus:border-blue-500/50 outline-none mt-1" /></div>
                        <div><label className="text-xs font-bold text-gray-400 uppercase">Dia de Fechamento</label><input name="closing_day" required type="number" min="1" max="31" placeholder="Ex: 3" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-center focus:border-blue-500/50 outline-none mt-1" /></div>
                     </div>

                     <div><label className="text-xs font-bold text-gray-400 uppercase">Limite Total (R$)</label><input name="limit" required type="number" step="0.01" placeholder="0.00" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500/50 outline-none mt-1" /></div>
                     
                     <button disabled={saving} type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition flex justify-center items-center gap-2">{saving ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Cartão'}</button>
                  </form>
               </motion.div>
            </motion.div>
        )}

        {isAddBankOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
               <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-sm bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-bold text-white flex items-center gap-2"><Landmark className="text-emerald-500"/> Nova Conta Bancária</h3>
                     <button onClick={() => setIsAddBankOpen(false)}><X className="text-gray-500 hover:text-white" /></button>
                  </div>
                  <form className="space-y-4" onSubmit={handleAddBank}>
                     <div><label className="text-xs font-bold text-gray-400 uppercase">Banco</label><input name="bankName" required placeholder="Ex: Itaú, Nubank, Inter..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500/50 outline-none mt-1" /></div>
                     <div><label className="text-xs font-bold text-gray-400 uppercase">Saldo Atual (R$)</label><input name="balance" required type="number" step="0.01" placeholder="0.00" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500/50 outline-none mt-1" /></div>
                     <button type="submit" className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition">Adicionar Conta</button>
                  </form>
               </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}