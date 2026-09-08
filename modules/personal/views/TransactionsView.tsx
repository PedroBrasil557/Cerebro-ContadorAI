'use client'

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { 
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, 
  Search, Wallet, Plus, X, Loader2, Calendar, Tag, DollarSign, FileText, 
  ChevronLeft, ChevronRight, CheckCircle2, Download, CreditCard, CalendarCheck, Landmark, Lock, ChevronDown
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation' 
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, Transaction } from '@/core/action/transactions'
import { financeService } from '@/services/financeService'
import TransactionDetailModal from '@/modules/personal/components/TransactionDetailModal'
import FixedExpensesList from '@/modules/personal/components/FixedExpensesList'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { toast } from 'sonner'
import UpgradeModal from '@/core/components/UpgradeModal'
import { calculateBalance, calculateExpenses, calculateIncome } from '@/core/finance/transactionMath'

interface TransactionsViewProps {
  user: any
}

// --- COMPONENTE: CUSTOM DROPDOWN (Design Elite) ---
function CustomFilter({ label, value, options, onChange, isPro = false, onProClick }: any) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const activeOption = options.find((opt: any) => opt.id === value)

    return (
        <div className="relative" ref={containerRef}>
            <button 
                onClick={() => isPro ? onProClick() : setIsOpen(!isOpen)}
                className={`flex items-center justify-between gap-3 bg-white/5 border border-white/5 px-4 py-3 rounded-xl min-w-[160px] transition-all hover:bg-white/10 group ${isOpen ? 'ring-2 ring-indigo-500/50' : ''}`}
            >
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                    {isPro ? `${label} (PRO)` : activeOption?.label || label}
                </span>
                {isPro ? <Lock size={12} className="text-indigo-500" /> : <ChevronDown size={14} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
            </button>

            <AnimatePresence>
                {isOpen && !isPro && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 md:left-0 mt-2 w-full min-w-[180px] bg-[#0f0f13] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden p-1 backdrop-blur-xl"
                    >
                        {options.map((opt: any) => (
                            <button
                                key={opt.id}
                                onClick={() => { onChange(opt.id); setIsOpen(false); }}
                                className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-xl ${value === opt.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// --- NOVO COMPONENTE: CUSTOM SELECT PARA O MODAL (Sem visual nativo) ---
function CustomSelect({ label, value, options, onChange, name }: any) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const clickOut = (e: any) => { if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false) }
    document.addEventListener('mousedown', clickOut)
    return () => document.removeEventListener('mousedown', clickOut)
  }, [])

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      <label className="text-[10px] font-black text-gray-500 uppercase ml-1 tracking-widest">{label}</label>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white text-left text-sm flex justify-between items-center hover:bg-white/10 transition-all"
      >
        {value || "Selecione..."}
        <ChevronDown size={14} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <input type="hidden" name={name} value={value} />
      
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-[70] w-full mt-2 bg-[#16161a] border border-white/10 rounded-2xl shadow-2xl p-1 max-h-48 overflow-y-auto custom-scrollbar">
            {options.map((opt: string) => (
              <button key={opt} type="button" onClick={() => { onChange(opt); setIsOpen(false); }} className={`w-full text-left px-4 py-3 text-xs font-bold uppercase rounded-xl transition-colors ${value === opt ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const CATEGORIES = {
  income: ['Salário', 'Investimentos', 'Freelance', 'Presente', 'Outros'],
  expense: ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Compras', 'Outros']
}

// --- MODAL NOVA TRANSAÇÃO ---
function NewTransactionModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<'receita' | 'despesa_variavel'>('despesa_variavel')
  const [category, setCategory] = useState('Alimentação')
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro / Pix')
  const [userCards, setUserCards] = useState<any[]>([])

  useEffect(() => {
    async function fetchCards() {
      const dbCards = await financeService.getCards()
      setUserCards(dbCards || [])
    }
    if (isOpen) fetchCards()
  }, [isOpen])

  const paymentOptions = useMemo(() => ["Dinheiro / Pix", ...userCards.map(c => c.name)], [userCards])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const formData = new FormData(event.currentTarget)
    formData.set('type', type)
    const isFixed = (event.currentTarget.elements.namedItem('is_fixed') as HTMLInputElement).checked
    formData.set('is_fixed', isFixed ? 'true' : 'false')
    
    const result = await createTransaction(formData)
    setLoading(false)
    if (result.success) { toast.success("Sincronizado!"); onSuccess(); onClose() } 
    else { toast.error("Falha: " + result.error) }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg bg-[#09090b] border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className={`h-28 w-full flex items-center justify-center relative ${type === 'receita' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
             <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition"><X size={20} /></button>
             <h3 className={`text-sm font-black uppercase tracking-[0.3em] ${type === 'receita' ? 'text-emerald-500' : 'text-rose-500'}`}>Registrar Fluxo</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-white/5 rounded-2xl border border-white/5">
             <button type="button" onClick={() => { setType('despesa_variavel'); setCategory('Alimentação'); }} className={`py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${type !== 'receita' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-gray-500 hover:text-gray-300'}`}><ArrowDownLeft size={14} /> Despesa</button>
             <button type="button" onClick={() => { setType('receita'); setCategory('Salário'); }} className={`py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${type === 'receita' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-gray-500 hover:text-gray-300'}`}><ArrowUpRight size={14} /> Receita</button>
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-1"><label className="text-[10px] font-black text-gray-500 uppercase ml-1 tracking-widest">Montante</label><input name="amount" required type="number" step="0.01" placeholder="0,00" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-lg font-black focus:border-indigo-500/50 outline-none" /></div>
             <div className="space-y-1"><label className="text-[10px] font-black text-gray-500 uppercase ml-1 tracking-widest">Identificação</label><input name="description" required type="text" placeholder="Ex: Aluguel" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-indigo-500/50 outline-none" /></div>
          </div>

          <div className="grid grid-cols-2 gap-6">
             <CustomSelect label="Categoria" value={category} options={CATEGORIES[type === 'receita' ? 'income' : 'expense']} onChange={setCategory} name="category" />
             <CustomSelect label="Forma / Cartão" value={paymentMethod} options={paymentOptions} onChange={setPaymentMethod} name="payment_method" />
          </div>

          <div className="space-y-1"><label className="text-[10px] font-black text-gray-500 uppercase ml-1 tracking-widest">Data Efetiva</label><input name="date" required type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none [color-scheme:dark]" /></div>

          <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 group cursor-pointer">
             <input type="checkbox" name="is_fixed" id="is_fixed" className="peer hidden" />
             <div onClick={() => { const el = document.getElementById('is_fixed') as HTMLInputElement; el.checked = !el.checked; }} className="h-6 w-6 rounded-lg border-2 border-white/10 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 flex items-center justify-center transition-all"><CheckCircle2 size={14} className="text-white" /></div>
             <label htmlFor="is_fixed" className="flex-1 cursor-pointer select-none text-[10px] font-black text-gray-500 uppercase tracking-[0.1em] group-hover:text-gray-300">Fixar no cronograma mensal</label>
          </div>

          <button disabled={loading} type="submit" className="w-full bg-white text-black font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle2 size={18} /> Processar Agora</>}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

// --- TRANSACTIONS VIEW ---
export default function TransactionsView({ user }: TransactionsViewProps) {
  const router = useRouter() 
  const [currentDate, setCurrentDate] = useState(new Date())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  
  const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pago' | 'pendente'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [loadingAction, setLoadingAction] = useState(false)

  const userPlan = user?.user_metadata?.plan_tier || 'free'
  const isFreePlan = userPlan !== 'pro' && userPlan !== 'premium'

  const loadData = async () => {
    const data = await getTransactions()
    setTransactions(data); setLoadingData(false)
  }
  useEffect(() => { loadData() }, [])

  const handleSuccessAction = async () => { await loadData(); router.refresh() }
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  
  const currentMonthLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const currentMonthStr = currentDate.toISOString().slice(0, 7)

  const filteredData = useMemo(() => {
    const safe = Array.isArray(transactions) ? transactions : []
    return safe.filter(t => {
      if (!t.date.startsWith(currentMonthStr)) return false
      const matchesType = filterType === 'all' ? true : filterType === 'receita' ? t.type === 'receita' : (t.type !== 'receita')
      const matchesStatus = filterStatus === 'all' ? true : filterStatus === 'pago' ? t.is_paid : !t.is_paid
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = searchTerm === '' || t.description.toLowerCase().includes(searchLower) || t.category.toLowerCase().includes(searchLower)
      return matchesType && matchesStatus && matchesSearch
    })
  }, [transactions, filterType, filterStatus, searchTerm, currentMonthStr])

  const totals = useMemo(() => {
      const monthData = transactions.filter(t => t.date.startsWith(currentMonthStr))
      return {
        income: calculateIncome(monthData),
        expense: calculateExpenses(monthData),
        balance: calculateBalance(monthData),
      }
  }, [transactions, currentMonthStr])

  const format = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const generatePDF = () => {
    if (isFreePlan) { setShowUpgradeModal(true); return }
    const doc = new jsPDF()
    doc.setFillColor(10, 10, 15); doc.rect(0, 0, 210, 45, 'F')
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(24); doc.text("CÉREBRO.OS", 15, 25)
    doc.setFillColor(30, 30, 40); doc.roundedRect(140, 10, 55, 25, 3, 3, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.text(format(totals.balance), 145, 28)
    const rows = filteredData.map(t => [new Date(t.date).toLocaleDateString('pt-BR'), t.description.toUpperCase(), t.category, t.payment_method || 'CONTA', t.is_paid ? 'OK' : 'PEND', format(t.amount)])
    autoTable(doc, { head: [['DATA', 'DESCRIÇÃO', 'CATEGORIA', 'CONTA', 'STATUS', 'VALOR']], body: rows, startY: 55, headStyles: { fillColor: [79, 70, 229] } })
    doc.save(`Extrato_${currentMonthStr}.pdf`)
  }

  const handleTransactionClick = (t: Transaction) => { setSelectedTransaction(t); setIsEditModalOpen(true) }
  const handleUpdate = async (tx: Transaction, reason: string) => { setLoadingAction(true); await updateTransaction(tx, reason); await handleSuccessAction(); setLoadingAction(false); setIsEditModalOpen(false) }
  const handleDelete = async (id: string) => { setLoadingAction(true); await deleteTransaction(id); await handleSuccessAction(); setLoadingAction(false); setIsEditModalOpen(false) }

  if (loadingData) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={32} /></div>

  return (
    <div className="min-h-screen bg-[#09090b]">
        <div className="space-y-6 px-4 py-6 md:px-8 pb-32 animate-in fade-in duration-500 max-w-7xl mx-auto">
            
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Transações</h2>
                    <div className="flex items-center gap-4 mt-2 bg-white/5 w-fit px-3 py-1.5 rounded-2xl border border-white/5">
                        <button onClick={handlePrevMonth} className="p-1 text-gray-400 hover:text-white transition"><ChevronLeft size={18}/></button>
                        <span className="text-xs font-black text-indigo-400 uppercase tracking-widest min-w-[140px] text-center select-none">{currentMonthLabel}</span>
                        <button onClick={handleNextMonth} className="p-1 text-gray-400 hover:text-white transition"><ChevronRight size={18}/></button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={generatePDF} className="flex items-center gap-2 bg-white/5 text-gray-300 px-5 py-3 rounded-xl font-bold hover:bg-white/10 transition border border-white/10 text-[10px] uppercase tracking-widest group">
                        {isFreePlan ? <Lock size={14} className="text-indigo-500" /> : <Download size={14} />} 
                        {isFreePlan ? 'Relatório PRO' : 'Exportar PDF'}
                    </button>
                    <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-black hover:bg-gray-200 transition shadow-lg text-[10px] uppercase tracking-widest">
                        <Plus size={16} /> Nova
                    </button>
                </div>
            </header>

            <FixedExpensesList transactions={transactions} currentDate={currentDate} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0a0a0c] border border-white/5 p-6 rounded-[2rem] relative overflow-hidden group">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 relative z-10">Projeção Saldo</p>
                    <h3 className={`text-2xl font-black relative z-10 ${totals.balance >= 0 ? 'text-white' : 'text-rose-400'}`}>{format(totals.balance)}</h3>
                    <Wallet className="absolute -right-2 -bottom-2 text-white/5 h-20 w-20 transition-transform group-hover:scale-110" />
                </div>
                <div className="bg-[#0a0a0c] border border-white/5 p-6 rounded-[2rem] relative overflow-hidden group">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 relative z-10">Entradas</p>
                    <h3 className="text-2xl font-black text-emerald-400 relative z-10">{format(totals.income)}</h3>
                    <TrendingUp className="absolute -right-2 -bottom-2 text-emerald-500/5 h-20 w-20 transition-transform group-hover:scale-110" />
                </div>
                <div className="bg-[#0a0a0c] border border-white/5 p-6 rounded-[2rem] relative overflow-hidden group">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 relative z-10">Saídas</p>
                    <h3 className="text-2xl font-black text-rose-400 relative z-10">{format(Math.abs(totals.expense))}</h3>
                    <TrendingDown className="absolute -right-2 -bottom-2 text-rose-500/5 h-20 w-20 transition-transform group-hover:scale-110" />
                </div>
            </div>

            <div className="bg-[#0f0f11] border border-white/5 p-3 rounded-2xl flex flex-col md:flex-row gap-3 items-center sticky top-4 z-20 shadow-2xl backdrop-blur-xl">
                 <div className="relative w-full md:flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 h-4 w-4" />
                    <input type="text" placeholder="Filtrar por descrição..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-transparent rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-indigo-500/30 outline-none transition-all" />
                </div>
                
                <div className="flex w-full md:w-auto gap-2">
                    <CustomFilter 
                        label="Operações" 
                        value={filterType} 
                        options={[
                            { id: 'all', label: 'Todas' },
                            { id: 'receita', label: 'Receitas' },
                            { id: 'despesa', label: 'Despesas' },
                        ]} 
                        onChange={setFilterType} 
                    />

                    <CustomFilter 
                        label="Status" 
                        value={filterStatus} 
                        isPro={isFreePlan}
                        onProClick={() => setShowUpgradeModal(true)}
                        options={[
                            { id: 'all', label: 'Tudo' },
                            { id: 'pago', label: 'Liquidado' },
                            { id: 'pendente', label: 'Em Aberto' },
                        ]} 
                        onChange={setFilterStatus} 
                    />
                </div>
            </div>

            <div className="space-y-2">
                {filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-700 border border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
                        <p className="text-xs font-black uppercase tracking-widest italic opacity-50 text-white">Silêncio no Fluxo...</p>
                    </div>
                ) : (
                    filteredData.map((t) => (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} 
                            key={t.id} 
                            onClick={() => handleTransactionClick(t)} 
                            className="group grid grid-cols-12 gap-4 items-center p-5 bg-[#0a0a0c] border border-white/5 hover:border-white/20 rounded-2xl transition-all cursor-pointer"
                        >
                            <div className="col-span-2 md:col-span-1 flex flex-col items-center justify-center bg-white/5 rounded-xl h-12 w-12 border border-white/5 group-hover:border-indigo-500/30 transition-colors">
                                <span className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">{new Date(t.date).toLocaleString('default', { month: 'short' })}</span>
                                <span className="text-base font-black text-white">{new Date(t.date).getUTCDate()}</span>
                            </div>

                            <div className="col-span-6 md:col-span-6 flex flex-col justify-center">
                                <p className="font-bold text-white text-sm truncate group-hover:text-indigo-400 transition-colors uppercase italic">{t.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{t.category}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 flex items-center gap-1">
                                        <Landmark size={10} /> {t.payment_method || 'Conta'}
                                    </span>
                                </div>
                            </div>

                            <div className="col-span-4 md:col-span-3 flex flex-col items-end md:items-start justify-center">
                                <div className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md border ${t.is_paid ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                    {t.is_paid ? 'LIQUIDADO' : 'ABERTO'}
                                </div>
                            </div>

                            <div className="col-span-12 md:col-span-2 flex justify-end border-t border-white/5 md:border-t-0 pt-2 md:pt-0 mt-2 md:mt-0">
                                <p className={`font-black text-base ${t.type === 'receita' ? 'text-emerald-400' : 'text-white'}`}>
                                    {t.type === 'receita' ? '+' : '-'} {format(Math.abs(Number(t.amount)))}
                                </p>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>

        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsCreateModalOpen(true)} className="fixed bottom-6 right-6 h-14 w-14 bg-indigo-600 rounded-full shadow-2xl shadow-indigo-600/40 flex items-center justify-center text-white z-40 md:hidden"><Plus size={28} /></motion.button>

        <AnimatePresence>{isCreateModalOpen && <NewTransactionModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={handleSuccessAction} />}</AnimatePresence>
        <AnimatePresence>{isEditModalOpen && <TransactionDetailModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} transaction={selectedTransaction!} onUpdate={handleUpdate} onDelete={handleDelete} loading={loadingAction} />}</AnimatePresence>
        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  )
}
