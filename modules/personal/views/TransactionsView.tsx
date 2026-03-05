'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { 
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, 
  Search, Wallet, Plus, X, Loader2, Calendar, Tag, DollarSign, FileText, 
  ChevronLeft, ChevronRight, CheckCircle2, Download, CreditCard, CalendarCheck, Landmark
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation' 
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, Transaction } from '@/core/action/transactions'
import TransactionDetailModal from '@/modules/personal/components/TransactionDetailModal'
import FixedExpensesList from '@/modules/personal/components/FixedExpensesList'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { toast } from 'sonner'

const CATEGORIES = {
  income: ['Salário', 'Investimentos', 'Freelance', 'Presente', 'Outros'],
  expense: ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Compras', 'Outros']
}

// Lista sugerida, mas no banco agora aceitamos qualquer texto na coluna 'payment_method'
const PAYMENT_METHODS = ['Nubank', 'Inter', 'XP', 'Itaú', 'Bradesco', 'Santander', 'C6 Bank', 'Dinheiro', 'VR/VA', 'Outros']

// --- MODAL NOVA TRANSAÇÃO ---
function NewTransactionModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<'receita' | 'despesa_variavel'>('despesa_variavel')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    
    const formData = new FormData(event.currentTarget)
    formData.set('type', type)
    
    // 🛡️ GARANTIA DE DADO: Força o envio do is_fixed como string booleana explícita
    const isFixedChecked = (event.currentTarget.elements.namedItem('is_fixed') as HTMLInputElement).checked
    formData.set('is_fixed', isFixedChecked ? 'true' : 'false')
    
    // Envia para a Server Action
    const result = await createTransaction(formData)
    
    setLoading(false)
    if (result.success) { 
      toast.success("Movimentação registrada com sucesso!")
      onSuccess()
      onClose()
    } else { 
      toast.error("Erro ao criar transação: " + result.error) 
    }
  }

  if (!isOpen) return null
  const isIncome = type === 'receita'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg bg-[#09090b] border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className={`h-24 w-full flex items-center justify-center relative transition-colors duration-300 ${isIncome ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
             <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full text-white transition"><X size={20} /></button>
             <span className={`text-sm font-black uppercase tracking-widest ${isIncome ? 'text-emerald-500' : 'text-rose-500'}`}>Nova Movimentação</span>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3 p-1 bg-white/5 rounded-2xl border border-white/5">
             <button type="button" onClick={() => setType('despesa_variavel')} className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${!isIncome ? 'bg-rose-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}><ArrowDownLeft size={16} /> Despesa</button>
             <button type="button" onClick={() => setType('receita')} className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isIncome ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}><ArrowUpRight size={16} /> Receita</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-500 uppercase ml-1 tracking-widest">Valor</label>
               <input name="amount" required type="number" step="0.01" placeholder="0.00" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500/50 outline-none font-mono" />
             </div>
             <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-500 uppercase ml-1 tracking-widest">Descrição</label>
               <input name="description" required type="text" placeholder="Ex: Mercado" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500/50 outline-none" />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-500 uppercase ml-1 tracking-widest">Categoria</label>
               <select name="category" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500/50 outline-none cursor-pointer bg-[#09090b]">
                 {CATEGORIES[isIncome ? 'income' : 'expense'].map(c => <option key={c} value={c}>{c}</option>)}
               </select>
             </div>
             <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-500 uppercase ml-1 tracking-widest">Conta / Cartão</label>
               <select name="payment_method" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500/50 outline-none cursor-pointer bg-[#09090b]">
                 {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
               </select>
             </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase ml-1 tracking-widest">Data</label>
            <input name="date" required type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500/50 outline-none [color-scheme:dark]" />
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
             <div className="relative flex items-center">
               <input type="checkbox" name="is_fixed" id="is_fixed" className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-white/20 bg-white/5 transition-all checked:border-blue-500 checked:bg-blue-500" />
               <CheckCircle2 size={14} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" />
             </div>
             <label htmlFor="is_fixed" className="cursor-pointer select-none text-xs font-bold text-gray-400 uppercase tracking-widest">Lançar como despesa fixa mensal</label>
          </div>

          <button disabled={loading} type="submit" className="w-full mt-4 bg-white text-black font-black uppercase tracking-[0.2em] text-xs py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 hover:bg-gray-200">
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Processar Transação'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

// --- TRANSACTIONS VIEW ---
export default function TransactionsView() {
  const router = useRouter() 
  const [currentDate, setCurrentDate] = useState(new Date())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pago' | 'pendente'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [loadingAction, setLoadingAction] = useState(false)

  const loadData = async () => {
    const data = await getTransactions()
    setTransactions(data)
    setLoadingData(false)
  }

  useEffect(() => { loadData() }, [])

  const handleSuccessAction = async () => { await loadData(); router.refresh() }
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  
  const currentMonthLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const currentMonthStr = currentDate.toISOString().slice(0, 7)

  const filteredData = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : []
    return safeTransactions.filter(t => {
      if (!t.date.startsWith(currentMonthStr)) return false
      
      const matchesType = filterType === 'all' ? true : filterType === 'receita' ? t.type === 'receita' : (t.type !== 'receita')
      const matchesStatus = filterStatus === 'all' ? true : filterStatus === 'pago' ? t.is_paid : !t.is_paid
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = searchTerm === '' || 
          t.description.toLowerCase().includes(searchLower) || 
          t.category.toLowerCase().includes(searchLower) ||
          (t.payment_method || '').toLowerCase().includes(searchLower)

      const isNotFixedOrFiltered = !t.is_fixed || searchTerm.length > 0 || filterStatus !== 'all' || filterType !== 'all'

      return matchesType && matchesStatus && matchesSearch && isNotFixedOrFiltered
    })
  }, [transactions, filterType, filterStatus, searchTerm, currentMonthStr])

  const totals = useMemo(() => {
      const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonthStr))
      const realizedTransactions = monthTransactions.filter(t => t.is_paid === true || t.date <= new Date().toISOString().split('T')[0])
      
      const inc = realizedTransactions.filter(t => t.type === 'receita').reduce((acc, t) => acc + Number(t.amount), 0)
      const exp = realizedTransactions.filter(t => t.type !== 'receita').reduce((acc, t) => acc + Number(t.amount), 0)
      return { income: inc, expense: exp, balance: inc - exp }
  }, [transactions, currentMonthStr])

  const format = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const generatePDF = () => {
    const doc = new jsPDF()
    const tableRows: any[] = []
    const monthData = transactions.filter(t => t.date.startsWith(currentMonthStr)).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    monthData.forEach(t => {
        tableRows.push([
            new Date(t.date).toLocaleDateString('pt-BR'),
            t.description,
            t.category,
            t.payment_method || 'Carteira',
            t.is_paid ? 'Concluído' : 'Pendente',
            t.type === 'receita' ? `+ ${format(t.amount)}` : `- ${format(t.amount)}`
        ])
    })

    doc.setFillColor(15, 15, 15); doc.rect(0, 0, 210, 30, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text(`CÉREBRO.AI`, 14, 20)
    
    autoTable(doc, {
      head: [['Data', 'Descrição', 'Categoria', 'Método', 'Status', 'Valor']],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [236, 72, 153] }
    })

    doc.save(`Extrato_${currentMonthStr}.pdf`)
  }

  const handleTransactionClick = (t: Transaction) => { setSelectedTransaction(t); setIsEditModalOpen(true) }
  const handleUpdate = async (tx: Transaction, reason: string) => { setLoadingAction(true); await updateTransaction(tx, reason); await handleSuccessAction(); setLoadingAction(false); setIsEditModalOpen(false) }
  const handleDelete = async (id: string) => { setLoadingAction(true); await deleteTransaction(id); await handleSuccessAction(); setLoadingAction(false); setIsEditModalOpen(false) }

  if (loadingData) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={32} /></div>

  return (
    <div className="min-h-screen bg-[#09090b]">
        <div className="space-y-6 px-4 py-6 md:px-8 pb-32 animate-in fade-in duration-500">
            
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Transações</h2>
                    <div className="flex items-center gap-4 mt-2 bg-white/5 w-fit px-3 py-1.5 rounded-2xl border border-white/5">
                        <button onClick={handlePrevMonth} className="p-1 text-gray-400 hover:text-white transition"><ChevronLeft size={18}/></button>
                        <span className="text-xs font-black text-blue-400 uppercase tracking-widest min-w-[140px] text-center select-none">{currentMonthLabel}</span>
                        <button onClick={handleNextMonth} className="p-1 text-gray-400 hover:text-white transition"><ChevronRight size={18}/></button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={generatePDF} className="flex items-center gap-2 bg-white/5 text-gray-300 px-5 py-3 rounded-xl font-bold hover:bg-white/10 transition border border-white/10 text-[10px] uppercase tracking-widest">
                        <Download size={14} /> PDF
                    </button>
                    <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-black hover:bg-gray-200 transition shadow-lg text-[10px] uppercase tracking-widest">
                        <Plus size={16} /> Nova
                    </button>
                </div>
            </header>

            <FixedExpensesList transactions={transactions} currentDate={currentDate} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0a0a0c] border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 relative z-10">Saldo Projetado</p>
                    <h3 className={`text-2xl font-black relative z-10 ${totals.balance >= 0 ? 'text-white' : 'text-rose-400'}`}>{format(totals.balance)}</h3>
                    <Wallet className="absolute -right-2 -bottom-2 text-white/5 h-20 w-20 transition-transform group-hover:scale-110" />
                </div>
                <div className="bg-[#0a0a0c] border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 relative z-10">Total Entradas</p>
                    <h3 className="text-2xl font-black text-emerald-400 relative z-10">{format(totals.income)}</h3>
                    <TrendingUp className="absolute -right-2 -bottom-2 text-emerald-500/5 h-20 w-20 transition-transform group-hover:scale-110" />
                </div>
                <div className="bg-[#0a0a0c] border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 relative z-10">Total Saídas</p>
                    <h3 className="text-2xl font-black text-rose-400 relative z-10">{format(Math.abs(totals.expense))}</h3>
                    <TrendingDown className="absolute -right-2 -bottom-2 text-rose-500/5 h-20 w-20 transition-transform group-hover:scale-110" />
                </div>
            </div>

            <div className="bg-[#0f0f11] border border-white/5 p-3 rounded-2xl flex flex-col md:flex-row gap-3 items-center sticky top-4 z-20 shadow-2xl">
                 <div className="relative w-full md:flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 h-4 w-4" />
                    <input type="text" placeholder="Pesquisar extrato..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-transparent rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-blue-500/30 outline-none transition-all" />
                </div>
                <div className="flex w-full md:w-auto gap-2">
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="bg-white/5 text-white text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl border border-white/5 outline-none cursor-pointer hover:bg-white/10 appearance-none">
                        <option value="all" className="bg-[#09090b]">Todos</option>
                        <option value="receita" className="bg-[#09090b]">Receitas</option>
                        <option value="despesa" className="bg-[#09090b]">Despesas</option>
                    </select>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="bg-white/5 text-white text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl border border-white/5 outline-none cursor-pointer hover:bg-white/10 appearance-none">
                        <option value="all" className="bg-[#09090b]">Status</option>
                        <option value="pago" className="bg-[#09090b]">Liquidado</option>
                        <option value="pendente" className="bg-[#09090b]">Aberto</option>
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                {filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-700 border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                        <p className="text-xs font-black uppercase tracking-widest">Nada encontrado</p>
                    </div>
                ) : (
                    filteredData.map((t) => (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} 
                            key={t.id} 
                            onClick={() => handleTransactionClick(t)} 
                            className="group grid grid-cols-12 gap-4 items-center p-4 bg-[#0a0a0c] border border-white/5 hover:border-white/20 rounded-2xl transition-all cursor-pointer"
                        >
                            <div className="col-span-2 md:col-span-1 flex flex-col items-center justify-center bg-white/5 rounded-xl h-12 w-12 border border-white/5">
                                <span className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">{new Date(t.date).toLocaleString('default', { month: 'short' })}</span>
                                <span className="text-base font-black text-white">{new Date(t.date).getDate()}</span>
                            </div>

                            <div className="col-span-6 md:col-span-6 flex flex-col justify-center">
                                <p className="font-bold text-white text-sm truncate group-hover:text-blue-400 transition-colors">{t.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{t.category}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 flex items-center gap-1">
                                        <Landmark size={10} /> {t.payment_method || 'Conta'}
                                    </span>
                                </div>
                            </div>

                            <div className="col-span-4 md:col-span-3 flex flex-col items-end md:items-start justify-center">
                                <div className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md border ${t.is_paid ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                    {t.is_paid ? 'Liquidado' : 'Pendente'}
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

        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsCreateModalOpen(true)} className="fixed bottom-6 right-6 h-14 w-14 bg-blue-600 rounded-full shadow-2xl shadow-blue-600/40 flex items-center justify-center text-white z-40 md:hidden"><Plus size={28} /></motion.button>

        <AnimatePresence>{isCreateModalOpen && <NewTransactionModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={handleSuccessAction} />}</AnimatePresence>
        <AnimatePresence>{isEditModalOpen && <TransactionDetailModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} transaction={selectedTransaction!} onUpdate={handleUpdate} onDelete={handleDelete} loading={loadingAction} />}</AnimatePresence>
    </div>
  )
}