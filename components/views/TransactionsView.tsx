'use client'

import React, { useMemo, useState } from 'react'
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, 
  Filter, ArrowUpRight, ArrowDownLeft, Search, Wallet 
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Transaction } from '@/types_db'

interface TransactionsViewProps {
  transactions: Transaction[]
  onAddTransaction: (t: Transaction) => void
}

export default function TransactionsView({ transactions, onAddTransaction }: TransactionsViewProps) {
  const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // 1. FILTRAGEM (Lógica Real)
  const filteredData = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : []

    return safeTransactions.filter(t => {
      // Filtro por Tipo
      const matchesType = filterType === 'all' 
        ? true 
        : filterType === 'receita' ? t.type === 'receita' : (t.type !== 'receita')
      
      // Filtro por Busca
      const desc = t.description ? t.description.toLowerCase() : ''
      const cat = t.category ? t.category.toLowerCase() : ''
      const search = searchTerm.toLowerCase()
      const matchesSearch = desc.includes(search) || cat.includes(search)
      
      return matchesType && matchesSearch
    })
  }, [transactions, filterType, searchTerm])

  // 2. CÁLCULO DE TOTAIS (Matemática Real)
  const totals = useMemo(() => {
      const inc = filteredData
          .filter(t => t.type === 'receita')
          .reduce((acc, t) => acc + Number(t.amount), 0)
      
      const exp = filteredData
          .filter(t => t.type !== 'receita')
          .reduce((acc, t) => acc + Number(t.amount), 0)
      
      // Saldo Real
      const rawBalance = filteredData.reduce((acc, t) => {
          const val = Number(t.amount)
          return t.type === 'receita' ? acc + val : acc - Math.abs(val)
      }, 0)

      return {
          income: inc,
          expense: exp,
          balance: rawBalance
      }
  }, [filteredData])

  const format = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="space-y-8 px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Transações</h2>
          <p className="text-gray-400 mt-1">Gestão detalhada do seu fluxo de caixa.</p>
        </div>
        {/* Contador */}
        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
           <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"/>
           <span className="text-xs font-bold text-gray-300">{filteredData.length} registros</span>
        </div>
      </div>

      {/* CARDS DE RESUMO (Visual Premium + Dados Reais) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Saldo */}
        <div className="group relative bg-[#09090b] border border-white/10 p-6 rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-300">
           <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity text-white"><Wallet size={48} /></div>
           
           <div className="relative z-10">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Saldo Filtrado</p>
              <h3 className={`text-3xl font-black tracking-tight ${totals.balance >= 0 ? 'text-white' : 'text-rose-400'}`}>
                  {format(totals.balance)}
              </h3>
           </div>
        </div>
        
        {/* Card Receitas */}
        <div className="group relative bg-[#09090b] border border-white/10 p-6 rounded-3xl overflow-hidden hover:border-emerald-500/30 transition-all duration-300">
           <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="absolute top-0 right-0 p-4 opacity-20 text-emerald-500"><TrendingUp size={48} /></div>
           
           <div className="relative z-10">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Entradas</p>
              <h3 className="text-3xl font-black tracking-tight text-emerald-400">
                  {format(totals.income)}
              </h3>
           </div>
        </div>
        
        {/* Card Despesas */}
        <div className="group relative bg-[#09090b] border border-white/10 p-6 rounded-3xl overflow-hidden hover:border-rose-500/30 transition-all duration-300">
           <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="absolute top-0 right-0 p-4 opacity-20 text-rose-500"><TrendingDown size={48} /></div>
           
           <div className="relative z-10">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Saídas</p>
              <h3 className="text-3xl font-black tracking-tight text-rose-400">
                  {format(Math.abs(totals.expense))}
              </h3>
           </div>
        </div>
      </div>

      {/* BARRA DE FERRAMENTAS (Filtros e Busca) */}
      <div className="sticky top-0 z-20 flex flex-col md:flex-row items-center justify-between gap-4 bg-[#09090b]/80 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-xl">
          {/* Botões de Filtro */}
          <div className="flex gap-1 bg-black/40 p-1 rounded-xl w-full md:w-auto">
              <button onClick={() => setFilterType('all')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-xs font-bold uppercase transition-all duration-300 ${filterType === 'all' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                  Todos
              </button>
              <button onClick={() => setFilterType('receita')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-xs font-bold uppercase transition-all duration-300 ${filterType === 'receita' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10'}`}>
                  Receitas
              </button>
              <button onClick={() => setFilterType('despesa')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-xs font-bold uppercase transition-all duration-300 ${filterType === 'despesa' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-gray-500 hover:text-rose-400 hover:bg-rose-500/10'}`}>
                  Despesas
              </button>
          </div>

          {/* Campo de Busca */}
          <div className="relative w-full md:w-auto group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4 group-focus-within:text-blue-400 transition-colors" />
              <input 
                  type="text" 
                  placeholder="Buscar lançamentos..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full md:w-72 bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-blue-500/50 focus:bg-white/[0.03] outline-none transition-all placeholder:text-gray-600"
              />
          </div>
      </div>

      {/* LISTA DE TRANSAÇÕES */}
      <div className="space-y-3 pb-20">
          {filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                  <div className="p-4 bg-white/5 rounded-full mb-4">
                      <Filter className="h-8 w-8 opacity-50" />
                  </div>
                  <p className="font-medium">Nenhuma transação encontrada.</p>
                  <p className="text-xs mt-1">Tente mudar os filtros ou adicione um novo registro.</p>
              </div>
          ) : (
              filteredData.map((t) => (
                  <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={t.id} 
                      className="group flex items-center justify-between p-5 bg-[#09090b] border border-white/5 hover:border-white/10 rounded-2xl transition-all hover:bg-white/[0.02] hover:shadow-lg hover:shadow-black/50"
                  >
                      <div className="flex items-center gap-5">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border border-white/5 transition-colors ${
                              t.type === 'receita' 
                                  ? 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20 group-hover:border-rose-500/20'
                          }`}>
                              {t.type === 'receita' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                          </div>
                          
                          <div>
                              <p className="font-bold text-white text-base mb-1">{t.description}</p>
                              <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
                                  <span className="text-gray-500 flex items-center gap-1">
                                      <Calendar size={10} /> {new Date(t.date).toLocaleDateString('pt-BR')}
                                  </span>
                                  <span className="text-gray-700">•</span>
                                  <span className="text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-md border border-blue-400/10">
                                      {t.category}
                                  </span>
                              </div>
                          </div>
                      </div>

                      <div className="text-right">
                           <p className={`font-black text-lg mb-1 ${t.type === 'receita' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {t.type === 'receita' ? '+' : '-'} {format(Math.abs(Number(t.amount)))}
                           </p>
                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                               t.status === 'concluido' 
                                  ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' 
                                  : 'border-gray-700 text-gray-500 bg-white/5'
                           }`}>
                              {t.status || 'Concluído'}
                           </span>
                      </div>
                  </motion.div>
              ))
          )}
      </div>
    </div>
  )
}