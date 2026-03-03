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

const CATEGORIES = {
    income: ['Salário', 'Investimentos', 'Freelance', 'Presente', 'Outros'],
    expense: ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Compras', 'Outros']
}

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
    const result = await createTransaction(formData)
    setLoading(false)
    if (result.success) { onSuccess(); onClose(); } else { alert("Erro ao criar transação") }
  }

  if (!isOpen) return null
  const isIncome = type === 'receita'
  const headerBg = isIncome ? 'bg-emerald-500/10' : 'bg-rose-500/10'
  const headerColor = isIncome ? 'text-emerald-500' : 'text-rose-500'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg bg-[#09090b] border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className={`h-24 w-full flex items-center justify-center relative transition-colors duration-300 ${headerBg}`}>
             <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full text-white transition"><X size={20} /></button>
             <span className={`text-sm font-bold uppercase tracking-widest ${headerColor}`}>Nova Movimentação</span>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3 p-1 bg-white/5 rounded-2xl border border-white/5">
             <button type="button" onClick={() => setType('despesa_variavel')} className={`py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${!isIncome ? 'bg-rose-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}><ArrowDownLeft size={18} /> Despesa</button>
             <button type="button" onClick={() => setType('receita')} className={`py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${isIncome ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}><ArrowUpRight size={18} /> Receita</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase ml-1">Valor</label><input name="amount" required type="number" step="0.01" placeholder="0.00" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500/50 outline-none" /></div>
             <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase ml-1">Descrição</label><input name="description" required type="text" placeholder="Ex: Jantar" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500/50 outline-none" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase ml-1">Categoria</label><select name="category" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500/50 outline-none cursor-pointer bg-[#09090b]">{CATEGORIES[isIncome ? 'income' : 'expense'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
             <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase ml-1">Conta/Cartão</label><select name="payment_method" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500/50 outline-none cursor-pointer bg-[#09090b]">{PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
          </div>
          <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase ml-1">Data</label><input name="date" required type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500/50 outline-none [color-scheme:dark]" /></div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
             <div className="relative flex items-center"><input type="checkbox" name="is_fixed" id="is_fixed" className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-white/20 bg-white/5 transition-all checked:border-blue-500 checked:bg-blue-500" /><CheckCircle2 size={14} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" /></div>
             <label htmlFor="is_fixed" className="cursor-pointer select-none text-sm text-gray-300">É fixo mensal?</label>
          </div>
          <button disabled={loading} type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">{loading ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Transação'}</button>
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
  
  // Filtros
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

  // Filtro Avançado
  const filteredData = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : []
    return safeTransactions.filter(t => {
      // Filtro de Mês
      if (!t.date.startsWith(currentMonthStr)) return false
      
      // Filtros de UI
      const matchesType = filterType === 'all' ? true : filterType === 'receita' ? t.type === 'receita' : (t.type !== 'receita')
      const matchesStatus = filterStatus === 'all' ? true : filterStatus === 'pago' ? t.is_paid : !t.is_paid
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = searchTerm === '' || 
          t.description.toLowerCase().includes(searchLower) || 
          t.category.toLowerCase().includes(searchLower) ||
          (t.payment_method || '').toLowerCase().includes(searchLower)

      // Se não for fixa (já exibida no topo), OU se estivermos filtrando especificamente
      const isNotFixedOrFiltered = !t.is_fixed || searchTerm.length > 0 || filterStatus !== 'all' || filterType !== 'all'

      return matchesType && matchesStatus && matchesSearch && isNotFixedOrFiltered
    })
  }, [transactions, filterType, filterStatus, searchTerm, currentMonthStr])

  // Totais Reais
  const totals = useMemo(() => {
      const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonthStr))
      const realizedTransactions = monthTransactions.filter(t => {
          const isPaid = t.is_paid === true
          const isPast = t.date <= new Date().toISOString().split('T')[0]
          return isPaid || isPast
      })
      const inc = realizedTransactions.filter(t => t.type === 'receita').reduce((acc, t) => acc + Number(t.amount), 0)
      const exp = realizedTransactions.filter(t => t.type !== 'receita').reduce((acc, t) => acc + Number(t.amount), 0)
      return { income: inc, expense: exp, balance: inc - exp }
  }, [transactions, currentMonthStr])

  const format = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

  // --- PDF PREMIUM ---
  const generatePDF = () => {
    const doc = new jsPDF()
    const tableRows: any[] = []
    
    // Filtra dados do mês, ordenados por data
    const monthData = transactions.filter(t => t.date.startsWith(currentMonthStr)).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    monthData.forEach(t => {
        const transactionData = [
            new Date(t.date).toLocaleDateString('pt-BR'),
            t.description,
            t.category,
            t.payment_method || 'Carteira', // Mostra o banco/cartão
            t.is_paid ? `Pago (${formatDate(t.payment_date || t.date)})` : 'Pendente',
            t.type === 'receita' ? `+ ${format(t.amount)}` : `- ${format(t.amount)}`
        ]
        tableRows.push(transactionData)
    })

    // Cabeçalho
    doc.setFillColor(15, 15, 15) // Dark Background
    doc.rect(0, 0, 210, 30, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.text(`CÉREBRO.AI`, 14, 20)
    doc.setFontSize(12)
    doc.text(`Relatório Financeiro: ${currentMonthLabel.toUpperCase()}`, 100, 20)

    // Resumo
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 40)
    doc.setFontSize(12)
    doc.text(`Entradas: ${format(totals.income)}`, 14, 50)
    doc.text(`Saídas: ${format(totals.expense)}`, 80, 50)
    doc.text(`Saldo Líquido: ${format(totals.balance)}`, 150, 50)

    // Tabela Estilizada
    autoTable(doc, {
        head: [['Data', 'Descrição', 'Categoria', 'Conta/Cartão', 'Status', 'Valor']],
        body: tableRows,
        startY: 60,
        theme: 'grid',
        headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
            5: { fontStyle: 'bold', halign: 'right' } // Valor alinhado à direita
        }
    })

    doc.save(`Extrato_${currentMonthStr}.pdf`)
  }

  const handleTransactionClick = (t: Transaction) => { setSelectedTransaction(t); setIsEditModalOpen(true) }
  const handleUpdate = async (tx: Transaction, reason: string) => { setLoadingAction(true); await updateTransaction(tx, reason); await handleSuccessAction(); setLoadingAction(false); setIsEditModalOpen(false) }
  const handleDelete = async (id: string) => { setLoadingAction(true); await deleteTransaction(id); await handleSuccessAction(); setLoadingAction(false); setIsEditModalOpen(false) }

  if (loadingData) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={32} /></div>

  return (
    <div className="min-h-screen bg-[#09090b]">
        <div className="space-y-6 px-4 py-6 md:px-8 pb-24 animate-in fade-in duration-500">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Transações</h2>
                    <div className="flex items-center gap-4 mt-2 bg-white/5 w-fit px-2 py-1 rounded-full border border-white/5">
                        <button onClick={handlePrevMonth} className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition"><ChevronLeft size={18}/></button>
                        <span className="text-sm font-bold text-blue-400 capitalize min-w-[120px] text-center select-none">{currentMonthLabel}</span>
                        <button onClick={handleNextMonth} className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition"><ChevronRight size={18}/></button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={generatePDF} className="flex items-center gap-2 bg-white/5 text-gray-300 px-4 py-3 rounded-xl font-bold hover:bg-white/10 transition border border-white/10 text-sm">
                        <Download size={18} /> <span className="hidden md:inline">Baixar Extrato</span>
                    </button>
                    <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-900/20 active:scale-95 text-sm">
                        <Plus size={20} /> <span className="hidden md:inline">Nova</span>
                    </button>
                </div>
            </div>

            {/* Lista de Contas Fixas (Componente Separado) */}
            <FixedExpensesList transactions={transactions} currentDate={currentDate} />

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#09090b] border border-white/10 p-5 rounded-2xl relative overflow-hidden">
                    <div className="relative z-10"><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Saldo Real</p><h3 className={`text-2xl font-black ${totals.balance >= 0 ? 'text-white' : 'text-rose-400'}`}>{format(totals.balance)}</h3></div>
                    <Wallet className="absolute top-4 right-4 text-white/10 h-8 w-8" />
                </div>
                <div className="bg-[#09090b] border border-white/10 p-5 rounded-2xl relative overflow-hidden">
                    <div className="relative z-10"><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Entradas</p><h3 className="text-2xl font-black text-emerald-400">{format(totals.income)}</h3></div>
                    <TrendingUp className="absolute top-4 right-4 text-emerald-500/10 h-8 w-8" />
                </div>
                <div className="bg-[#09090b] border border-white/10 p-5 rounded-2xl relative overflow-hidden">
                    <div className="relative z-10"><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Saídas</p><h3 className="text-2xl font-black text-rose-400">{format(Math.abs(totals.expense))}</h3></div>
                    <TrendingDown className="absolute top-4 right-4 text-rose-500/10 h-8 w-8" />
                </div>
            </div>

            {/* Barra de Filtros */}
            <div className="bg-[#0f0f0f] border border-white/10 p-2 md:p-3 rounded-2xl flex flex-col md:flex-row gap-3 items-center shadow-2xl sticky top-2 z-20">
                 <div className="relative w-full md:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <input type="text" placeholder="Buscar por nome, categoria, banco..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:border-blue-500/50 outline-none transition-colors" />
                </div>
                <div className="flex w-full md:w-auto gap-2 overflow-x-auto scrollbar-hide">
                    {/* Selects com bg-black para corrigir o bug visual */}
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="bg-white/5 text-white text-sm font-medium px-4 py-2.5 rounded-xl border border-white/5 outline-none cursor-pointer hover:bg-white/10 appearance-none">
                        <option value="all" className="bg-[#121212]">Todas Movimentações</option>
                        <option value="receita" className="bg-[#121212]">Apenas Receitas</option>
                        <option value="despesa" className="bg-[#121212]">Apenas Despesas</option>
                    </select>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="bg-white/5 text-white text-sm font-medium px-4 py-2.5 rounded-xl border border-white/5 outline-none cursor-pointer hover:bg-white/10 appearance-none">
                        <option value="all" className="bg-[#121212]">Status: Todos</option>
                        <option value="pago" className="bg-[#121212]">Status: Pago/Recebido</option>
                        <option value="pendente" className="bg-[#121212]">Status: Pendente</option>
                    </select>
                </div>
            </div>

            {/* Lista de Transações (Design Premium) */}
            <div className="space-y-3">
                {filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                        <Search className="h-10 w-10 mb-3 opacity-20" />
                        <p className="text-sm font-medium">Nenhuma transação encontrada.</p>
                    </div>
                ) : (
                    filteredData.map((t) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                            key={t.id} 
                            onClick={() => handleTransactionClick(t)} 
                            className="group relative grid grid-cols-12 gap-4 items-center p-4 bg-[#09090b] border border-white/5 hover:border-blue-500/30 rounded-2xl transition-all cursor-pointer hover:shadow-lg hover:bg-[#0f0f0f]"
                        >
                            {/* Ícone e Data */}
                            <div className="col-span-3 md:col-span-1 flex flex-col items-center justify-center bg-white/5 rounded-xl h-14 w-14 border border-white/5">
                                <span className="text-[10px] font-bold text-gray-500 uppercase">{new Date(t.date).toLocaleString('default', { month: 'short' }).slice(0,3)}</span>
                                <span className="text-lg font-black text-white">{new Date(t.date).getDate()}</span>
                            </div>

                            {/* Detalhes Principais */}
                            <div className="col-span-5 md:col-span-5 flex flex-col justify-center pl-2">
                                <p className="font-bold text-white text-sm md:text-base truncate group-hover:text-blue-400 transition-colors">
                                    {t.description}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                        <Tag size={10} /> {t.category}
                                    </span>
                                    {/* Mostra o Método de Pagamento (Nubank, etc) */}
                                    <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                        {t.is_fixed ? <CheckCircle2 size={10}/> : <CreditCard size={10} />}
                                        {t.is_fixed ? 'Fixo' : t.payment_method || 'Carteira'}
                                    </span>
                                </div>
                            </div>

                            {/* Status e Data de Pagamento */}
                            <div className="col-span-4 md:col-span-4 flex flex-col items-end md:items-start justify-center">
                                <div className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border mb-1 ${t.is_paid ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                    {t.is_paid ? <CheckCircle2 size={10} /> : <CalendarCheck size={10} />}
                                    {t.is_paid ? (t.type === 'receita' ? 'Recebido' : 'Pago') : 'Pendente'}
                                </div>
                                {t.is_paid && t.payment_date && (
                                    <span className="text-[9px] text-gray-500 flex items-center gap-1">
                                        <CalendarCheck size={8} /> {formatDate(t.payment_date)}
                                    </span>
                                )}
                            </div>

                            {/* Valor */}
                            <div className="col-span-12 md:col-span-2 flex justify-end border-t border-white/5 md:border-t-0 pt-3 md:pt-0 mt-2 md:mt-0">
                                <p className={`font-mono font-black text-lg ${t.type === 'receita' ? 'text-emerald-400' : 'text-white'}`}>
                                    {t.type === 'receita' ? '+' : '-'} {format(Math.abs(Number(t.amount)))}
                                </p>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>

        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsCreateModalOpen(true)} className="fixed bottom-6 right-24 md:right-32 h-14 w-14 bg-blue-600 rounded-full shadow-2xl shadow-blue-600/40 flex items-center justify-center text-white z-40 md:hidden"><Plus size={28} /></motion.button>

        <AnimatePresence>{isCreateModalOpen && <NewTransactionModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={handleSuccessAction} />}</AnimatePresence>
        <AnimatePresence>{isEditModalOpen && <TransactionDetailModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} transaction={selectedTransaction} onUpdate={handleUpdate} onDelete={handleDelete} loading={loadingAction} />}</AnimatePresence>
    </div>
  )
}