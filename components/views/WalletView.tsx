'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard, Plus, Wallet, ShieldCheck, 
  AlertTriangle, CheckCircle2, MoreHorizontal, 
  CalendarClock, Lock, Unlock, TrendingUp, 
  Sparkles, X, ChevronRight, PieChart as PieIcon
} from 'lucide-react'
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend 
} from 'recharts'

// --- 1. TIPAGEM E MOCKS ---

interface CardData {
  id: string
  bankName: string
  network: 'Mastercard' | 'Visa' | 'Elo'
  last4: string
  totalLimit: number
  usedLimit: number
  dueDate: number // Dia do vencimento
  closingDate: number // Dia do fechamento
  colorTheme: 'purple' | 'black' | 'orange' | 'blue'
  status: 'active' | 'locked'
}

const MOCK_CARDS: CardData[] = [
  { 
    id: '1', bankName: 'Nubank', network: 'Mastercard', last4: '4242', 
    totalLimit: 12500, usedLimit: 3450, dueDate: 10, closingDate: 3, 
    colorTheme: 'purple', status: 'active' 
  },
  { 
    id: '2', bankName: 'XP Infinite', network: 'Visa', last4: '8890', 
    totalLimit: 45000, usedLimit: 1200, dueDate: 15, closingDate: 8, 
    colorTheme: 'black', status: 'active' 
  },
  { 
    id: '3', bankName: 'Inter', network: 'Mastercard', last4: '1020', 
    totalLimit: 8000, usedLimit: 7900, dueDate: 20, closingDate: 13, 
    colorTheme: 'orange', status: 'active' 
  },
]

const CATEGORY_DATA = [
  { name: 'Alimentação', value: 35, color: '#f43f5e' },
  { name: 'Serviços', value: 25, color: '#3b82f6' },
  { name: 'Transporte', value: 20, color: '#eab308' },
  { name: 'Lazer', value: 20, color: '#10b981' },
]

// --- 2. UTILITÁRIOS VISUAIS ---

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

const getCardGradient = (theme: string) => {
  switch (theme) {
    case 'purple': return 'from-purple-600 via-indigo-700 to-purple-900 shadow-purple-500/20'
    case 'black': return 'from-gray-800 via-gray-900 to-black shadow-black/40 border-t border-white/10'
    case 'orange': return 'from-orange-500 via-amber-600 to-orange-700 shadow-orange-500/20'
    case 'blue': return 'from-blue-600 via-blue-700 to-slate-800 shadow-blue-500/20'
    default: return 'from-gray-700 to-gray-900'
  }
}

// --- 3. COMPONENTES UI ---

// Container Glassmorphism Base
const GlassCard = ({ children, className = "", onClick }: any) => (
  <motion.div 
    whileHover={{ y: -2 }}
    transition={{ duration: 0.3 }}
    onClick={onClick}
    className={`relative bg-[#09090b]/60 backdrop-blur-xl border border-white/[0.06] rounded-3xl overflow-hidden shadow-2xl ${className}`}
  >
    {/* Noise Texture Sutil */}
    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </motion.div>
)

// Card de Cartão de Crédito "Físico"
const CreditCardComponent = ({ card, onClick }: { card: CardData, onClick: () => void }) => {
  const gradient = getCardGradient(card.colorTheme)
  const available = card.totalLimit - card.usedLimit
  const usagePercent = (card.usedLimit / card.totalLimit) * 100
  
  // Health Color
  const healthColor = usagePercent > 80 ? 'bg-rose-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'

  return (
    <div onClick={onClick} className={`relative h-56 w-full rounded-3xl p-6 flex flex-col justify-between bg-gradient-to-br ${gradient} cursor-pointer group transition-all duration-500 hover:scale-[1.02] overflow-hidden border border-white/10`}>
      
      {/* Brilho Holográfico no Hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform translate-x-[-100%] group-hover:translate-x-[100%]" style={{ transitionDuration: '1s' }} />

      {/* Topo */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-white font-bold text-lg tracking-wide">{card.bankName}</h3>
          <p className="text-white/60 text-xs font-medium tracking-widest uppercase">{card.network} Gold</p>
        </div>
        <div className="h-8 w-12 bg-white/20 rounded-md backdrop-blur-sm flex items-center justify-center border border-white/10">
          <div className="w-6 h-4 border border-white/40 rounded-sm relative overflow-hidden">
             <div className="absolute top-1 left-0 w-full h-px bg-white/40"/>
             <div className="absolute bottom-1 left-0 w-full h-px bg-white/40"/>
          </div>
        </div>
      </div>

      {/* Chip */}
      <div className="w-12 h-9 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-md border border-yellow-600/50 shadow-inner flex items-center justify-center opacity-90">
         <div className="w-8 h-6 border border-black/10 rounded-sm flex">
            <div className="w-1/3 h-full border-r border-black/10"/>
            <div className="w-1/3 h-full border-r border-black/10"/>
         </div>
      </div>

      {/* Bottom info */}
      <div>
         <div className="flex justify-between items-end mb-4">
            <p className="text-white font-mono text-xl tracking-widest shadow-black drop-shadow-md">
               •••• •••• •••• {card.last4}
            </p>
         </div>

         <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-white/80">
               <span>Limite Usado</span>
               <span>{usagePercent.toFixed(0)}%</span>
            </div>
            {/* Barra de Progresso Interna */}
            <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden backdrop-blur-sm">
               <motion.div 
                  initial={{ width: 0 }} animate={{ width: `${usagePercent}%` }}
                  className={`h-full ${healthColor} shadow-[0_0_10px_currentColor]`}
               />
            </div>
            <div className="flex justify-between text-[10px] font-medium text-white/60">
               <span>{formatCurrency(card.usedLimit)}</span>
               <span>Disp: {formatCurrency(available)}</span>
            </div>
         </div>
      </div>
    </div>
  )
}

// Modal de Novo Cartão
const AddCardModal = ({ onClose }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
  >
     <div className="w-full max-w-md bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Plus className="bg-blue-500/20 text-blue-400 p-1 rounded-lg w-8 h-8" /> Novo Cartão
           </h3>
           <button onClick={onClose}><X className="text-gray-500 hover:text-white" /></button>
        </div>

        <form className="space-y-4">
           <div>
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Instituição</label>
              <input type="text" placeholder="Ex: Nubank" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500/50 outline-none" />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="text-xs font-bold text-gray-400 uppercase ml-1">Últimos 4 Dígitos</label>
                 <input type="text" placeholder="0000" maxLength={4} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-mono text-center focus:border-blue-500/50 outline-none" />
              </div>
              <div>
                 <label className="text-xs font-bold text-gray-400 uppercase ml-1">Bandeira</label>
                 <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500/50 outline-none appearance-none">
                    <option>Mastercard</option>
                    <option>Visa</option>
                    <option>Elo</option>
                 </select>
              </div>
           </div>
           <div>
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Limite Total (R$)</label>
              <input type="number" placeholder="0,00" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500/50 outline-none" />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="text-xs font-bold text-gray-400 uppercase ml-1">Dia Vencimento</label>
                 <input type="number" placeholder="DD" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500/50 outline-none" />
              </div>
              <div>
                 <label className="text-xs font-bold text-gray-400 uppercase ml-1">Dia Fechamento</label>
                 <input type="number" placeholder="DD" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500/50 outline-none" />
              </div>
           </div>
           
           <button type="button" onClick={onClose} className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20">
              Adicionar Cartão
           </button>
        </form>
     </div>
  </motion.div>
)

// --- VIEW PRINCIPAL ---

export default function WalletView() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Cálculos de Crédito
  const creditSummary = useMemo(() => {
    const totalLimit = MOCK_CARDS.reduce((acc, card) => acc + card.totalLimit, 0)
    const totalUsed = MOCK_CARDS.reduce((acc, card) => acc + card.usedLimit, 0)
    const available = totalLimit - totalUsed
    const usagePercent = (totalUsed / totalLimit) * 100
    
    // Score de Saúde Financeira (Simulado)
    let healthStatus = 'Excelente'
    let healthColor = 'text-emerald-400'
    if (usagePercent > 30) { healthStatus = 'Moderado'; healthColor = 'text-amber-400' }
    if (usagePercent > 70) { healthStatus = 'Risco Alto'; healthColor = 'text-rose-400' }

    return { totalLimit, totalUsed, available, usagePercent, healthStatus, healthColor }
  }, [])

  return (
    <div className="p-6 md:p-10 space-y-10 max-w-[1800px] mx-auto pb-32">
      
      {/* 1. CABEÇALHO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
         <div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">Minha Carteira</h1>
            <p className="text-gray-400 font-light flex items-center gap-2">
               Central de comando dos seus cartões de crédito.
            </p>
         </div>
         <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
         >
            <Plus size={20} /> Novo Cartão
         </button>
      </header>

      {/* 2. DASHBOARD DE CRÉDITO */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         {/* Resumo Geral */}
         <GlassCard className="lg:col-span-3 p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="flex justify-between items-start mb-8 relative z-10">
               <div>
                  <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Limite Global Combinado</h2>
                  <div className="flex items-baseline gap-2">
                     <span className="text-4xl font-black text-white">{formatCurrency(creditSummary.available)}</span>
                     <span className="text-sm font-medium text-gray-500">disponível</span>
                  </div>
               </div>
               <div className={`px-4 py-2 rounded-lg bg-black/40 border border-white/10 backdrop-blur-md flex items-center gap-2 ${creditSummary.healthColor}`}>
                  <ShieldCheck size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">{creditSummary.healthStatus}</span>
               </div>
            </div>

            {/* Barra de Progresso Mestra */}
            <div className="space-y-3 relative z-10">
               <div className="flex justify-between text-xs font-bold text-gray-400">
                  <span>Uso Total: {creditSummary.usagePercent.toFixed(1)}%</span>
                  <span>Total Contratado: {formatCurrency(creditSummary.totalLimit)}</span>
               </div>
               <div className="h-4 w-full bg-[#1a1a1a] rounded-full overflow-hidden p-1 border border-white/5">
                  <motion.div 
                     initial={{ width: 0 }} 
                     animate={{ width: `${creditSummary.usagePercent}%` }} 
                     transition={{ duration: 1.5, ease: "easeOut" }}
                     className={`h-full rounded-full relative overflow-hidden ${creditSummary.usagePercent > 50 ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-gradient-to-r from-blue-500 to-emerald-400'}`}
                  >
                     <div className="absolute inset-0 bg-white/20 animate-pulse-slow" />
                  </motion.div>
               </div>
               <p className="text-[10px] text-gray-500">*Recomendamos manter o uso abaixo de 30% para um score saudável.</p>
            </div>
         </GlassCard>

         {/* Fatura Atual (Snapshot) */}
         <GlassCard className="p-8 flex flex-col justify-center items-center text-center">
             <div className="p-4 rounded-full bg-blue-500/10 text-blue-400 mb-4 border border-blue-500/20">
                <CalendarClock size={32} />
             </div>
             <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Próximos Vencimentos</p>
             <h3 className="text-2xl font-black text-white mb-2">R$ 3.450,00</h3>
             <p className="text-xs text-blue-300">Fatura Nubank fecha em 3 dias</p>
             <button className="mt-6 text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition">
                Ver Calendário
             </button>
         </GlassCard>
      </section>

      {/* 3. AI INSIGHTS BAR */}
      <motion.div 
         initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
         className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border border-emerald-500/20 flex items-start gap-4"
      >
         <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 shrink-0 animate-pulse">
            <Sparkles size={20} />
         </div>
         <div>
            <h4 className="text-sm font-bold text-white mb-1">Análise de Crédito Cérebro.AI</h4>
            <p className="text-sm text-emerald-100/80 leading-relaxed">
               Você tem um cartão <span className="text-white font-bold">Inter</span> com 98% de uso. Considerar antecipar a fatura pode liberar limite e evitar impacto no seu score de crédito.
            </p>
         </div>
      </motion.div>

      {/* 4. CARDS GRID */}
      <section className="space-y-6">
         <div className="flex items-center gap-2 mb-4">
            <CreditCard className="text-blue-400 h-5 w-5" />
            <h2 className="text-xl font-bold text-white">Meus Cartões</h2>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {MOCK_CARDS.map((card) => (
               <CreditCardComponent key={card.id} card={card} onClick={() => {}} />
            ))}
            
            {/* Card "Adicionar Novo" (Estilo Wireframe) */}
            <button 
               onClick={() => setIsAddModalOpen(true)}
               className="h-56 rounded-3xl border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 flex flex-col items-center justify-center gap-4 group transition-all"
            >
               <div className="p-4 rounded-full bg-white/5 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                  <Plus size={32} />
               </div>
               <span className="text-sm font-bold text-gray-500 group-hover:text-blue-300 uppercase tracking-widest">Adicionar Cartão</span>
            </button>
         </div>
      </section>

      {/* 5. ANÁLISE DE GASTOS (DONUT CHART) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <GlassCard className="lg:col-span-2 p-8">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-2">
                  <PieIcon className="text-rose-400 h-5 w-5" />
                  <h3 className="text-lg font-bold text-white">Gastos por Categoria</h3>
               </div>
               <button className="text-xs font-bold text-gray-500 hover:text-white flex items-center gap-1">
                  Ver Detalhes <ChevronRight size={14}/>
               </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
               <div className="h-[250px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={CATEGORY_DATA}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={5}
                           dataKey="value"
                           stroke="none"
                        >
                           {CATEGORY_DATA.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                        {/* CORREÇÃO AQUI: Tipagem relaxada para o formatter */}
                        <Tooltip 
                           contentStyle={{ backgroundColor: '#09090b', border: '1px solid #333', borderRadius: '12px' }}
                           formatter={(value: any) => [`${value}%`, 'Gastos']}
                        />
                     </PieChart>
                  </ResponsiveContainer>
                  {/* Centro do Grafico */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                     <span className="text-xs text-gray-500 font-bold uppercase">Fatura Atual</span>
                     <span className="text-2xl font-black text-white">R$ 12.550</span>
                  </div>
               </div>

               <div className="space-y-4">
                  {CATEGORY_DATA.map((cat) => (
                     <div key={cat.name} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                           <span className="text-sm font-bold text-white">{cat.name}</span>
                        </div>
                        <span className="text-sm font-mono text-gray-400">{cat.value}%</span>
                     </div>
                  ))}
               </div>
            </div>
         </GlassCard>

         {/* Promoção / Banner Lateral */}
         <GlassCard className="p-1 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-black opacity-80" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
            <div className="relative z-10 h-full flex flex-col justify-center p-8">
               <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                  <TrendingUp className="text-purple-400" />
               </div>
               <h3 className="text-2xl font-bold text-white mb-2">Aumente seu Limite</h3>
               <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                  Nossa IA detectou que você pode conseguir isenção de anuidade no cartão <span className="text-white font-bold">XP Infinite</span> concentrando seus gastos.
               </p>
               <button className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition">
                  Ver Estratégia
               </button>
            </div>
         </GlassCard>
      </section>

      {/* MODAL DE ADICIONAR */}
      <AnimatePresence>
         {isAddModalOpen && <AddCardModal onClose={() => setIsAddModalOpen(false)} />}
      </AnimatePresence>

    </div>
  )
}