'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard, Plus, ShieldCheck, 
  TrendingUp, Sparkles, X, ChevronRight, PieChart as PieIcon,
  CalendarClock, Loader2, Trash2
} from 'lucide-react'
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer 
} from 'recharts'
import { getCards, createCard, deleteCard, CreditCard as CreditCardType } from '@/app/action/cards'
import { toast } from 'sonner'

// Estende o tipo do banco para uso na UI (Adiciona cor e fatura visual)
interface CardUI extends CreditCardType {
  current_invoice: number 
  color: string // Propriedade visual apenas
}

const CATEGORY_DATA = [
  { name: 'Alimentação', value: 35, color: '#f43f5e' },
  { name: 'Serviços', value: 25, color: '#3b82f6' },
  { name: 'Transporte', value: 20, color: '#eab308' },
  { name: 'Lazer', value: 20, color: '#10b981' },
]

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

// Lista de gradientes para os cartões
const CARD_GRADIENTS = [
    'from-purple-600 to-blue-600',
    'from-emerald-500 to-teal-500',
    'from-rose-500 to-orange-500',
    'from-gray-800 to-black',
    'from-blue-800 to-indigo-900',
    'from-pink-600 to-rose-500'
]

const GlassCard = ({ children, className = "", onClick }: any) => (
  <motion.div 
    whileHover={onClick ? { y: -2 } : {}}
    transition={{ duration: 0.3 }}
    onClick={onClick}
    className={`relative bg-[#09090b]/80 backdrop-blur-xl border border-white/[0.06] rounded-3xl overflow-hidden shadow-2xl ${className}`}
  >
    {/* Removido noise.png que estava dando 404 */}
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-white/5" />
    <div className="relative z-10">{children}</div>
  </motion.div>
)

// Componente de Cartão Individual
const CreditCardComponent = ({ card, onDelete }: { card: CardUI, onDelete: (id: string) => void }) => {
  const available = card.limit - card.current_invoice
  const usagePercent = card.limit > 0 ? (card.current_invoice / card.limit) * 100 : 0
  const healthColor = usagePercent > 80 ? 'bg-rose-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'

  return (
    <div 
      className={`relative h-52 md:h-56 w-full rounded-3xl p-5 md:p-6 flex flex-col justify-between group transition-all duration-500 hover:scale-[1.02] overflow-hidden border border-white/10 shadow-xl bg-gradient-to-br ${card.color}`}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
        className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-red-500/80 rounded-full text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-sm"
        title="Remover cartão"
      >
        <Trash2 size={16} />
      </button>

      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="flex justify-between items-start z-10">
        <div>
          <h3 className="text-white font-bold text-lg tracking-wide">{card.name}</h3>
          <p className="text-white/60 text-xs font-medium tracking-widest uppercase">{card.brand || 'Credit Card'}</p>
        </div>
        <div className="flex -space-x-2 opacity-80">
             <div className="w-6 h-6 rounded-full bg-white/20"></div>
             <div className="w-6 h-6 rounded-full bg-white/40"></div>
        </div>
      </div>

      <div className="w-10 h-8 md:w-12 md:h-9 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-md border border-yellow-600/50 shadow-inner flex items-center justify-center opacity-90 z-10">
         <div className="w-6 h-5 md:w-8 md:h-6 border border-black/10 rounded-sm flex">
            <div className="w-1/3 h-full border-r border-black/10"/>
            <div className="w-1/3 h-full border-r border-black/10"/>
         </div>
      </div>

      <div className="z-10">
         <div className="flex justify-between items-end mb-3 md:mb-4">
            <p className="text-white font-mono text-lg md:text-xl tracking-widest shadow-black drop-shadow-md opacity-90">
               •••• •••• •••• {card.last_4_digits}
            </p>
         </div>

         <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-white/80">
               <span>Uso: {usagePercent.toFixed(0)}%</span>
               <span>{formatCurrency(card.current_invoice)}</span>
            </div>
            <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden backdrop-blur-sm">
               <motion.div 
                  initial={{ width: 0 }} animate={{ width: `${usagePercent}%` }}
                  className={`h-full ${healthColor} shadow-[0_0_10px_currentColor]`}
               />
            </div>
            <div className="flex justify-between text-[10px] font-medium text-white/60">
               <span>Limite: {formatCurrency(card.limit)}</span>
               <span>Disp: {formatCurrency(available)}</span>
            </div>
         </div>
      </div>
    </div>
  )
}

// Modal
const AddCardModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    
    const formData = new FormData(event.currentTarget)
    // Não enviamos cor para o backend, pois ele não aceita.
    
    const result = await createCard(formData)
    
    setLoading(false)
    if (result.success) {
      toast.success("Cartão adicionado com sucesso!")
      onSuccess()
      onClose()
    } else {
      toast.error(result.error || "Erro ao adicionar cartão.")
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
       <motion.div 
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
          className="w-full max-w-md bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
       >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="bg-blue-500/20 text-blue-400 p-1 rounded-lg w-8 h-8" /> Novo Cartão
             </h3>
             <button onClick={onClose}><X className="text-gray-500 hover:text-white" /></button>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
             <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Instituição</label>
                <input name="institution" required type="text" placeholder="Ex: Nubank" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500/50 outline-none transition-colors" />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-xs font-bold text-gray-400 uppercase ml-1">Últimos 4 Dígitos</label>
                   <input name="last4" required type="text" placeholder="0000" maxLength={4} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-mono text-center focus:border-blue-500/50 outline-none transition-colors" />
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-400 uppercase ml-1">Bandeira</label>
                   <select name="brand" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500/50 outline-none appearance-none cursor-pointer">
                      <option className="bg-black" value="Mastercard">Mastercard</option>
                      <option className="bg-black" value="Visa">Visa</option>
                      <option className="bg-black" value="Elo">Elo</option>
                      <option className="bg-black" value="Amex">Amex</option>
                   </select>
                </div>
             </div>
             <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Limite Total (R$)</label>
                <input name="limit" required type="number" step="0.01" placeholder="0,00" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500/50 outline-none transition-colors" />
             </div>
             <button disabled={loading} type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex justify-center items-center gap-2">
                {loading && <Loader2 className="animate-spin" size={18} />}
                {loading ? 'Salvando...' : 'Adicionar Cartão'}
             </button>
          </form>
       </motion.div>
    </motion.div>
  )
}

// --- VIEW PRINCIPAL ---

export default function WalletView() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<CardUI[]>([])

  // Função para carregar dados
  const loadData = async () => {
    try {
      const dbCards = await getCards()
      
      // ✅ CORREÇÃO: Mapeia os dados e atribui uma cor aleatória visualmente
      // Isso evita o erro de banco e mantém a interface bonita
      const formattedCards = dbCards.map((c, index) => ({
          ...c,
          // Pega uma cor da lista baseada no índice para ser consistente
          color: CARD_GRADIENTS[index % CARD_GRADIENTS.length],
          current_invoice: Math.floor(Math.random() * (c.limit * 0.3)) // Simulação de uso
      }))
      
      setCards(formattedCards)
    } catch (error) {
      console.error("Erro ao carregar:", error)
      toast.error("Erro ao carregar cartões.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleDeleteCard = async (id: string) => {
      if(!confirm("Tem certeza que deseja remover este cartão?")) return
      await deleteCard(id)
      await loadData() 
      toast.success("Cartão removido.")
  }

  // Cálculos
  const creditSummary = useMemo(() => {
    const totalLimit = cards.reduce((acc, card) => acc + Number(card.limit), 0)
    const totalUsed = cards.reduce((acc, card) => acc + Number(card.current_invoice), 0)
    const available = totalLimit - totalUsed
    const usagePercent = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0
    
    let healthStatus = 'Excelente'
    let healthColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
    let healthBg = 'from-blue-500 to-emerald-400'
    
    if (usagePercent > 30) { 
        healthStatus = 'Moderado'
        healthColor = 'bg-amber-500/20 text-amber-400 border-amber-500/20'
        healthBg = 'from-amber-400 to-orange-500'
    }
    if (usagePercent > 70) { 
        healthStatus = 'Risco Alto'
        healthColor = 'bg-rose-500/20 text-rose-400 border-rose-500/20'
        healthBg = 'from-orange-500 to-rose-600'
    }

    return { totalLimit, totalUsed, available, usagePercent, healthStatus, healthColor, healthBg }
  }, [cards])

  if (loading) {
    return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-4 md:p-10 space-y-6 md:space-y-10 pb-32 animate-in fade-in duration-500">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6">
         <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-1 md:mb-2">Minha Carteira</h1>
            <p className="text-sm md:text-base text-gray-400 font-light flex items-center gap-2">Central de comando dos seus cartões de crédito.</p>
         </div>
         <button onClick={() => setIsAddModalOpen(true)} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] text-sm md:text-base">
            <Plus size={20} /> Novo Cartão
         </button>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <GlassCard className="lg:col-span-3 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 md:gap-0 relative z-10">
               <div>
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Limite Global Combinado</h2>
                  <div className="flex items-baseline gap-2"><span className="text-3xl md:text-4xl font-black text-white">{formatCurrency(creditSummary.available)}</span><span className="text-xs md:text-sm font-medium text-gray-500">disponível</span></div>
               </div>
               <div className={`px-4 py-2 rounded-lg border backdrop-blur-md flex items-center gap-2 ${creditSummary.healthColor}`}><ShieldCheck size={18} /><span className="text-xs font-bold uppercase tracking-wider">{creditSummary.healthStatus}</span></div>
            </div>
            <div className="space-y-3 relative z-10">
               <div className="flex justify-between text-xs font-bold text-gray-400"><span>Uso Total: {creditSummary.usagePercent.toFixed(1)}%</span><span className="hidden md:inline">Total Contratado: {formatCurrency(creditSummary.totalLimit)}</span></div>
               <div className="h-4 w-full bg-[#1a1a1a] rounded-full overflow-hidden p-1 border border-white/5"><motion.div initial={{ width: 0 }} animate={{ width: `${creditSummary.usagePercent}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className={`h-full rounded-full relative overflow-hidden bg-gradient-to-r ${creditSummary.healthBg}`}><div className="absolute inset-0 bg-white/20 animate-pulse" /></motion.div></div>
               <p className="text-[10px] text-gray-500">*Recomendamos manter o uso abaixo de 30% para um score saudável.</p>
            </div>
         </GlassCard>

         <GlassCard className="p-6 md:p-8 flex flex-col justify-center items-center text-center">
             <div className="p-3 md:p-4 rounded-full bg-blue-500/10 text-blue-400 mb-4 border border-blue-500/20"><CalendarClock size={28} className="md:w-8 md:h-8" /></div>
             <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total em Faturas</p>
             <h3 className="text-xl md:text-2xl font-black text-white mb-2">{formatCurrency(creditSummary.totalUsed)}</h3>
             <button className="mt-4 md:mt-6 text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition">Ver Calendário</button>
         </GlassCard>
      </section>

      {creditSummary.usagePercent > 80 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-amber-900/20 to-rose-900/20 border border-amber-500/20 flex items-start gap-4">
             <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400 shrink-0 animate-pulse"><Sparkles size={20} /></div>
             <div><h4 className="text-sm font-bold text-white mb-1">Análise de Crédito Cérebro.AI</h4><p className="text-xs md:text-sm text-gray-300 leading-relaxed">Seu uso de crédito está alto ({creditSummary.usagePercent.toFixed(0)}%). O banco pode interpretar isso como risco.</p></div>
          </motion.div>
      )}

      <section className="space-y-4 md:space-y-6">
         <div className="flex items-center gap-2 mb-2 md:mb-4"><CreditCard className="text-blue-400 h-5 w-5" /><h2 className="text-lg md:text-xl font-bold text-white">Meus Cartões</h2></div>
         <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {cards.map((card) => (<div key={card.id} className="min-w-[90%] md:min-w-0 snap-center"><CreditCardComponent card={card} onDelete={handleDeleteCard} /></div>))}
            <div className="min-w-[90%] md:min-w-0 snap-center"><button onClick={() => setIsAddModalOpen(true)} className="h-52 md:h-56 w-full rounded-3xl border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 flex flex-col items-center justify-center gap-4 group transition-all"><div className="p-4 rounded-full bg-white/5 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors"><Plus size={32} /></div><span className="text-sm font-bold text-gray-500 group-hover:text-blue-300 uppercase tracking-widest">Adicionar Cartão</span></button></div>
         </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
         <GlassCard className="lg:col-span-2 p-6 md:p-8">
            <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-2"><PieIcon className="text-rose-400 h-5 w-5" /><h3 className="text-base md:text-lg font-bold text-white">Gastos Estimados</h3></div><button className="text-xs font-bold text-gray-500 hover:text-white flex items-center gap-1">Ver Detalhes <ChevronRight size={14}/></button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
               <div className="h-[220px] md:h-[250px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie data={CATEGORY_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                           {CATEGORY_DATA.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #333', borderRadius: '12px' }} formatter={(value: any) => [`${value}%`, 'Gastos']} />
                     </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col"><span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase">Total Faturas</span><span className="text-xl md:text-2xl font-black text-white">{formatCurrency(creditSummary.totalUsed)}</span></div>
               </div>
               <div className="space-y-4">{CATEGORY_DATA.map((cat) => (<div key={cat.name} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} /><span className="text-sm font-bold text-white">{cat.name}</span></div><span className="text-sm font-mono text-gray-400">{cat.value}%</span></div>))}</div>
            </div>
         </GlassCard>
         <GlassCard className="p-1 relative group overflow-hidden min-h-[300px] md:min-h-auto"><div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-black opacity-80" /><div className="relative z-10 h-full flex flex-col justify-center p-6 md:p-8"><div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10"><TrendingUp className="text-purple-400" /></div><h3 className="text-xl md:text-2xl font-bold text-white mb-2">Aumente seu Limite</h3><p className="text-xs md:text-sm text-gray-400 mb-6 leading-relaxed">Nossa IA detectou que você pode conseguir isenção de anuidade no cartão <span className="text-white font-bold">XP Infinite</span> concentrando seus gastos.</p><button className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition text-sm">Ver Estratégia</button></div></GlassCard>
      </section>

      <AnimatePresence>{isAddModalOpen && <AddCardModal onClose={() => setIsAddModalOpen(false)} onSuccess={loadData} />}</AnimatePresence>
    </div>
  )
}