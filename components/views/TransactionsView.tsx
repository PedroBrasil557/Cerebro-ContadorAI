'use client'

import React, { useMemo, useState } from 'react'
import { 
  TrendingUp, TrendingDown, Filter, ArrowUpRight, ArrowDownLeft, Search, Wallet, Calendar, Plus 
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Transaction } from '@/types_db'
// Importando do caminho que você mostrou na imagem
import TransactionDetailModal from '@/components/TransactionDetailModal'

interface TransactionsViewProps {
  transactions: Transaction[]
  onAddTransaction: (t: Transaction) => void
}

export default function TransactionsView({ transactions, onAddTransaction }: TransactionsViewProps) {
  const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // ESTADOS DO MODAL
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 1. FILTRAGEM
  const filteredData = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : []
    return safeTransactions.filter(t => {
      const matchesType = filterType === 'all' 
        ? true 
        : filterType === 'receita' ? t.type === 'receita' : (t.type !== 'receita')
      
      const desc = t.description ? t.description.toLowerCase() : ''
      const cat = t.category ? t.category.toLowerCase() : ''
      const search = searchTerm.toLowerCase()
      return matchesType && (desc.includes(search) || cat.includes(search))
    })
  }, [transactions, filterType, searchTerm])

  // 2. CÁLCULOS
  const totals = useMemo(() => {
      const inc = filteredData.filter(t => t.type === 'receita').reduce((acc, t) => acc + Number(t.amount), 0)
      const exp = filteredData.filter(t => t.type !== 'receita').reduce((acc, t) => acc + Number(t.amount), 0)
      const rawBalance = filteredData.reduce((acc, t) => {
          const val = Number(t.amount)
          return t.type === 'receita' ? acc + val : acc - Math.abs(val)
      }, 0)
      return { income: inc, expense: exp, balance: rawBalance }
  }, [filteredData])

  const format = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  // AÇÃO DE CLIQUE
  const handleTransactionClick = (t: Transaction) => {
      setSelectedTransaction(t)
      setIsModalOpen(true)
  }

  // --- FUNÇÕES DE SUPORTE PARA O MODAL ---
  // (Adicionei para satisfazer o TypeScript. Futuramente conectaremos ao backend)
  const handleUpdate = async (tx: Transaction) => {
      console.log("Atualizar:", tx)
      alert("Edição salva com sucesso! (Atualize a página para ver)")
      setIsModalOpen(false)
  }

  const handleDelete = async (id: string) => {
      console.log("Deletar:", id)
      alert("Transação excluída! (Atualize a página para ver)")
      setIsModalOpen(false)
  }

  return (
    <>
        {/* Container Principal: Padding menor no mobile (px-4), maior no desktop (md:px-8) */}
        <div className="space-y-6 md:space-y-8 px-4 py-6 md:px-8 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Transações</h2>
                <p className="text-sm md:text-base text-gray-400 mt-1">Gestão detalhada do fluxo.</p>
            </div>
            
            <div className="self-start md:self-auto flex items-center gap-2 bg-white/5 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/5">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"/>
                <span className="text-xs font-bold text-gray-300">{filteredData.length} registros</span>
            </div>
        </div>

        {/* CARDS DE RESUMO - MOBILE: SCROLL HORIZONTAL (SNAP) */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 md:grid md:grid-cols-3 md:gap-6 pb-2 md:pb-0 scrollbar-hide">
            <div className="min-w-[85%] md:min-w-0 snap-center bg-[#09090b] border border-white/10 p-5 md:p-6 rounded-2xl md:rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20 text-white"><Wallet size={32} className="md:w-12 md:h-12" /></div>
                <div className="relative z-10">
                    <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Saldo Filtrado</p>
                    <h3 className={`text-2xl md:text-3xl font-black tracking-tight ${totals.balance >= 0 ? 'text-white' : 'text-rose-400'}`}>
                        {format(totals.balance)}
                    </h3>
                </div>
            </div>
            <div className="min-w-[85%] md:min-w-0 snap-center bg-[#09090b] border border-white/10 p-5 md:p-6 rounded-2xl md:rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20 text-emerald-500"><TrendingUp size={32} className="md:w-12 md:h-12" /></div>
                <div className="relative z-10">
                    <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Entradas</p>
                    <h3 className="text-2xl md:text-3xl font-black tracking-tight text-emerald-400">{format(totals.income)}</h3>
                </div>
            </div>
            <div className="min-w-[85%] md:min-w-0 snap-center bg-[#09090b] border border-white/10 p-5 md:p-6 rounded-2xl md:rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20 text-rose-500"><TrendingDown size={32} className="md:w-12 md:h-12" /></div>
                <div className="relative z-10">
                    <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Saídas</p>
                    <h3 className="text-2xl md:text-3xl font-black tracking-tight text-rose-400">{format(Math.abs(totals.expense))}</h3>
                </div>
            </div>
        </div>

        {/* BARRA DE FERRAMENTAS */}
        <div className="sticky top-0 z-30 flex flex-col md:flex-row items-center justify-between gap-3 bg-[#050505]/95 backdrop-blur-xl p-2 md:p-3 rounded-xl md:rounded-2xl border border-white/10 shadow-2xl">
             <div className="flex gap-1 bg-black/40 p-1 rounded-xl w-full md:w-auto overflow-x-auto scrollbar-hide">
                <button onClick={() => setFilterType('all')} className={`flex-1 md:flex-none whitespace-nowrap px-4 py-2 md:px-6 md:py-2.5 rounded-lg text-xs font-bold uppercase transition-all ${filterType === 'all' ? 'bg-white text-black' : 'text-gray-500'}`}>Todos</button>
                <button onClick={() => setFilterType('receita')} className={`flex-1 md:flex-none whitespace-nowrap px-4 py-2 md:px-6 md:py-2.5 rounded-lg text-xs font-bold uppercase transition-all ${filterType === 'receita' ? 'bg-emerald-500 text-white' : 'text-gray-500'}`}>Receitas</button>
                <button onClick={() => setFilterType('despesa')} className={`flex-1 md:flex-none whitespace-nowrap px-4 py-2 md:px-6 md:py-2.5 rounded-lg text-xs font-bold uppercase transition-all ${filterType === 'despesa' ? 'bg-rose-500 text-white' : 'text-gray-500'}`}>Despesas</button>
            </div>
             <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full md:w-72 bg-white/5 border border-white/5 rounded-lg md:rounded-xl pl-9 pr-4 py-2.5 md:py-3 text-sm text-white focus:border-blue-500/50 outline-none" />
            </div>
        </div>

        {/* LISTA DE TRANSAÇÕES */}
        <div className="space-y-2 md:space-y-3">
            {filteredData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500 border border-dashed border-white/10 rounded-2xl md:rounded-3xl bg-white/[0.02]">
                    <Search className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">Nenhuma transação encontrada.</p>
                </div>
            ) : (
                filteredData.map((t) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={t.id} 
                        onClick={() => handleTransactionClick(t)} 
                        className="group relative flex items-center justify-between p-3 md:p-5 bg-[#09090b] border border-white/5 hover:border-blue-500/30 rounded-xl md:rounded-2xl transition-all cursor-pointer active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-3 md:gap-5 overflow-hidden">
                            <div className={`h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-2xl flex-shrink-0 flex items-center justify-center border border-white/5 transition-colors ${
                                t.type === 'receita' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                            }`}>
                                {t.type === 'receita' ? <ArrowUpRight size={18} className="md:w-5 md:h-5" /> : <ArrowDownLeft size={18} className="md:w-5 md:h-5" />}
                            </div>
                            
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-white text-sm md:text-base truncate group-hover:text-blue-400 transition-colors">
                                    {t.description}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wide mt-0.5">
                                    <span className="flex items-center gap-1">
                                        {new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                    </span>
                                    <span className="hidden xs:inline text-gray-700">•</span>
                                    <span className="truncate text-blue-400/80">
                                        {t.category}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="text-right flex-shrink-0 pl-2">
                            <p className={`font-black text-sm md:text-lg ${t.type === 'receita' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {t.type === 'receita' ? '+' : '-'} {format(Math.abs(Number(t.amount)))}
                            </p>
                        </div>
                    </motion.div>
                ))
            )}
        </div>
        </div>

        {/* CTA FLUTUANTE */}
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { /* Lógica de nova transação */ }}
            className="fixed bottom-6 right-6 h-14 w-14 bg-blue-600 rounded-full shadow-2xl shadow-blue-600/40 flex items-center justify-center text-white z-40 md:hidden"
        >
            <Plus size={28} />
        </motion.button>

        {/* MODAL CORRIGIDO (COM AS PROPS FALTANTES) */}
        <TransactionDetailModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            transaction={selectedTransaction}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
        />
    </>
  )
}