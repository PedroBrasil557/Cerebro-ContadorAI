'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Filter, Calendar, Download, MoreHorizontal, 
  ArrowUpRight, ArrowDownRight, RefreshCw, X, 
  CheckCircle2, Clock, AlertCircle, Sparkles, 
  CreditCard, User, CalendarClock, ExternalLink, MapPin,
  ChevronDown, SlidersHorizontal, ArrowRightLeft
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// --- TIPAGEM ---
interface Transaction {
  id: string
  description: string
  clientName?: string
  serviceName?: string
  amount: number
  type: string // Alterado para string para aceitar variações do banco
  category: string
  paymentMethod?: string
  date: string
  status?: string
  appointmentId?: string
}

// --- DADOS MOCKADOS (Fallback visual) ---
const MOCK_DATA: Transaction[] = [
  { id: '1', description: 'Alongamento Volume Russo', clientName: 'Fernanda Lima', serviceName: 'Cílios', amount: 250.00, type: 'receita', category: 'Serviços', paymentMethod: 'Pix', date: new Date().toISOString(), status: 'confirmado' },
  { id: '2', description: 'Repasse Automático 20%', amount: 50.00, type: 'transferencia', category: 'Caixa Empresarial', paymentMethod: 'Sistema', date: new Date().toISOString(), status: 'confirmado' },
  { id: '3', description: 'Compra de Produtos', amount: 120.00, type: 'despesa_variavel', category: 'Materiais', paymentMethod: 'Cartão Crédito', date: new Date(Date.now() - 3600000).toISOString(), status: 'pendente' },
]

// --- UTILITÁRIOS VISUAIS ---
const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

// CORREÇÃO DO ERRO: Função Blindada contra tipos desconhecidos
const getTypeConfig = (type: string) => {
  const safeType = type?.toLowerCase() || 'outros'

  if (safeType.includes('receita')) {
      return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: ArrowUpRight }
  }
  if (safeType.includes('despesa')) {
      return { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: ArrowDownRight }
  }
  if (safeType.includes('transferencia') || safeType.includes('caixa')) {
      return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: RefreshCw }
  }

  // Fallback de Segurança (Evita tela branca)
  return { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: ArrowRightLeft }
}

// --- COMPONENTES UI ---

const GlassCard = ({ children, className = "", onClick }: any) => (
  <motion.div 
    whileHover={{ y: -2, backgroundColor: "rgba(255, 255, 255, 0.03)" }}
    transition={{ duration: 0.2 }}
    onClick={onClick}
    className={`relative bg-[#09090b]/60 backdrop-blur-xl border border-white/[0.06] shadow-2xl rounded-2xl overflow-hidden ${className}`}
  >
    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </motion.div>
)

const StatCard = ({ label, value, trend, type }: any) => {
  const config = getTypeConfig(type)
  const Icon = config.icon
  return (
    <GlassCard className="p-5 flex flex-col justify-between h-32 group cursor-default">
       <div className="flex justify-between items-start">
          <div className={`p-2 rounded-lg ${config.bg} ${config.color} border border-white/5`}>
             <Icon size={18} />
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border border-white/5 bg-white/5 ${trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
             {trend > 0 ? '+' : ''}{trend}%
          </span>
       </div>
       <div>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">{label}</p>
          <h3 className="text-2xl font-black text-white tracking-tight group-hover:scale-105 transition-transform origin-left">
             {formatCurrency(value)}
          </h3>
       </div>
    </GlassCard>
  )
}

const DetailDrawer = ({ transaction, onClose }: { transaction: Transaction, onClose: () => void }) => {
  if (!transaction) return null
  const config = getTypeConfig(transaction.type)

  return (
    <motion.div 
       initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
       transition={{ type: "spring", damping: 30, stiffness: 300 }}
       className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-[#050505] border-l border-white/10 z-[60] shadow-[-20px_0_50px_rgba(0,0,0,0.7)] flex flex-col"
    >
       <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">Detalhes da Transação</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition"><X size={20}/></button>
       </div>

       <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 relative overflow-hidden">
             <div className={`absolute inset-0 bg-gradient-to-b ${config.bg} to-transparent opacity-20`} />
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 relative z-10">Valor Líquido</p>
             <h1 className={`text-5xl font-black ${config.color} tracking-tighter relative z-10`}>
                {transaction.type.includes('despesa') ? '-' : '+'} {formatCurrency(transaction.amount)}
             </h1>
             <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/10 relative z-10">
                <div className={`w-2 h-2 rounded-full ${transaction.status === 'confirmado' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-xs font-bold text-white uppercase">{transaction.status || 'Processado'}</span>
             </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">Metadados</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                   <p className="text-xs text-gray-500 mb-1">Data</p>
                   <p className="text-sm text-white font-bold flex items-center gap-2"><Calendar size={14} className="text-blue-500"/> {format(new Date(transaction.date), "dd/MM/yyyy")}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                   <p className="text-xs text-gray-500 mb-1">Hora</p>
                   <p className="text-sm text-white font-bold flex items-center gap-2"><Clock size={14} className="text-blue-500"/> {format(new Date(transaction.date), "HH:mm")}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                   <p className="text-xs text-gray-500 mb-1">Categoria</p>
                   <p className="text-sm text-white font-bold">{transaction.category}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                   <p className="text-xs text-gray-500 mb-1">Pagamento</p>
                   <p className="text-sm text-white font-bold flex items-center gap-2"><CreditCard size={14}/> {transaction.paymentMethod || 'N/A'}</p>
                </div>
             </div>
          </div>

          {(transaction.clientName || transaction.serviceName) && (
             <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-500">
                <div className="flex items-center gap-2">
                   <Sparkles className="text-blue-400 h-4 w-4" />
                   <h3 className="text-sm font-bold text-white uppercase tracking-widest">Integração Smart</h3>
                </div>
                
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 overflow-hidden">
                   <div className="p-4 border-b border-blue-500/10 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                         {transaction.clientName?.charAt(0)}
                      </div>
                      <div>
                         <p className="text-base font-bold text-white">{transaction.clientName}</p>
                         <p className="text-xs text-blue-200">{transaction.serviceName}</p>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 divide-x divide-blue-500/10 bg-black/20">
                      <button className="py-3 text-xs font-bold text-blue-300 hover:text-white hover:bg-blue-500/10 transition flex items-center justify-center gap-2">
                         <CalendarClock size={14} /> Ver na Agenda
                      </button>
                      <button className="py-3 text-xs font-bold text-blue-300 hover:text-white hover:bg-blue-500/10 transition flex items-center justify-center gap-2">
                         <ExternalLink size={14} /> Google Agenda
                      </button>
                   </div>
                </div>
             </div>
          )}
       </div>
    </motion.div>
  )
}

// --- VIEW PRINCIPAL ---
export default function TransactionsView({ transactions = [], onAddTransaction }: any) {
  const displayData = transactions.length > 0 ? transactions : MOCK_DATA
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  
  const summary = useMemo(() => {
     return {
        balance: displayData.reduce((acc: number, t: Transaction) => t.type.includes('receita') ? acc + Number(t.amount) : t.type.includes('despesa') ? acc - Number(t.amount) : acc, 0),
        income: displayData.filter((t: Transaction) => t.type.includes('receita')).reduce((acc: number, t: Transaction) => acc + Number(t.amount), 0),
        expense: displayData.filter((t: Transaction) => t.type.includes('despesa')).reduce((acc: number, t: Transaction) => acc + Number(t.amount), 0),
     }
  }, [displayData])

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-[1800px] mx-auto pb-32">
      
      {/* CABEÇALHO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
         <div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">Transações</h1>
            <p className="text-gray-400 font-light flex items-center gap-2">
               Controle financeiro de alta precisão.
            </p>
         </div>
         <div className="flex gap-3 w-full md:w-auto">
            <div className="relative group flex-1 md:flex-none">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
               <input 
                  type="text" 
                  placeholder="Buscar..." 
                  className="w-full md:w-72 bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none placeholder:text-gray-600"
               />
            </div>
            <button className="p-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
               <Download size={20} />
            </button>
         </div>
      </header>

      {/* DASHBOARD */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <StatCard label="Saldo do Período" value={summary.balance} type="transferencia" trend={12} />
         <StatCard label="Receita Total" value={summary.income} type="receita" trend={8.4} />
         <StatCard label="Despesas" value={summary.expense} type="despesa" trend={-2.1} />
      </section>

      {/* AI INSIGHTS */}
      <motion.div 
         initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
         className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-transparent border border-blue-500/10 relative overflow-hidden"
      >
         <div className="absolute inset-0 bg-blue-500/5 blur-xl" />
         <div className="relative z-10 p-2 bg-blue-500/10 rounded-lg text-blue-400 animate-pulse border border-blue-500/20">
            <Sparkles size={16} />
         </div>
         <p className="relative z-10 text-sm text-blue-200/80 font-medium">
            <span className="text-white font-bold">Insight:</span> Você faturou mais com <span className="text-white font-bold">Alongamento</span> este mês. Repasse de caixa está <span className="text-emerald-400 font-bold">4% acima</span> da média.
         </p>
      </motion.div>

      {/* FILTROS */}
      <section className="sticky top-0 z-20 bg-[#050505]/80 backdrop-blur-xl py-4 -mx-2 px-2 border-b border-white/5 flex flex-wrap gap-3 items-center">
         <div className="flex bg-[#0f0f0f] p-1 rounded-lg border border-white/10">
            {['Todos', 'Receitas', 'Despesas'].map((filter, i) => (
               <button key={filter} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${i === 0 ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
                  {filter}
               </button>
            ))}
         </div>
         <div className="h-6 w-px bg-white/10" />
         <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-gray-300 transition-all">
            <Calendar size={14} /> Este Mês <ChevronDown size={12}/>
         </button>
         <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-gray-300 transition-all">
            <Filter size={14} /> Categorias <ChevronDown size={12}/>
         </button>
         <div className="flex-1" />
         <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-500 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors">
            <SlidersHorizontal size={14} /> Mais Filtros
         </button>
      </section>

      {/* LISTA DE TRANSAÇÕES */}
      <section className="space-y-3">
         <AnimatePresence>
            {displayData.map((t: Transaction, i: number) => {
               const config = getTypeConfig(t.type)
               return (
               <GlassCard 
                  key={t.id} 
                  className="p-0 cursor-pointer group hover:border-white/20 transition-all"
                  onClick={() => setSelectedTransaction(t)}
               >
                  <div className="flex items-center p-5 gap-6 relative z-10">
                     <div className={`p-4 rounded-xl ${config.bg} ${config.color} border border-white/5 shadow-inner`}>
                        <config.icon size={22} />
                     </div>

                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                           <h3 className="text-base font-bold text-white truncate group-hover:text-blue-300 transition-colors">{t.description}</h3>
                           {t.clientName && (
                              <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border border-white/5">
                                 <User size={10} /> {t.clientName}
                              </span>
                           )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                           <span className="flex items-center gap-1 font-medium"><Calendar size={12} /> {format(new Date(t.date), "dd MMM, HH:mm", { locale: ptBR })}</span>
                           <span className="w-1 h-1 rounded-full bg-gray-700" />
                           <span className="font-bold uppercase tracking-wider text-gray-600">{t.category}</span>
                        </div>
                     </div>

                     <div className="hidden md:flex flex-col items-end gap-1">
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${t.status === 'pendente' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                           <div className={`w-1.5 h-1.5 rounded-full ${t.status === 'pendente' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                           <span className="text-[10px] font-bold uppercase">{t.status || 'Confirmado'}</span>
                        </div>
                        {t.paymentMethod && (
                           <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-1">
                              <CreditCard size={10} /> {t.paymentMethod}
                           </span>
                        )}
                     </div>

                     <div className="text-right min-w-[120px] pl-4 border-l border-white/5">
                        <p className={`text-lg font-mono font-bold ${config.color}`}>
                           {t.type.includes('despesa') ? '-' : '+'} {formatCurrency(Number(t.amount))}
                        </p>
                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest group-hover:text-white transition-colors">Ver Detalhes</p>
                     </div>
                  </div>
                  
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.bg.replace('/10', '')} opacity-0 group-hover:opacity-100 transition-opacity`} />
               </GlassCard>
            )})}
         </AnimatePresence>
      </section>

      {/* DRAWER */}
      <AnimatePresence>
         {selectedTransaction && (
            <>
               <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setSelectedTransaction(null)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
               />
               <DetailDrawer 
                  transaction={selectedTransaction} 
                  onClose={() => setSelectedTransaction(null)} 
               />
            </>
         )}
      </AnimatePresence>

    </div>
  )
}