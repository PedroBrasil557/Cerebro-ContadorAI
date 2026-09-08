'use client'

import React, { useMemo } from 'react'
import { PieChart, Zap, AlertTriangle, CheckCircle2, ShoppingBag, Home, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Transaction } from '@/types_db'
import { motion } from 'framer-motion'

interface BudgetProps {
  income: number
  transactions: Transaction[]
}

export default function BudgetSummary({ income, transactions }: BudgetProps) {
  
  // 1. Lógica de Inteligência Financeira (Smart Allocation)
  const budgetLogic = useMemo(() => {
    // Regra 50/30/20
    const limits = {
      essentials: income * 0.50, // 50% para Contas/Casa
      lifestyle: income * 0.30,  // 30% para Lazer/Compras
      savings: income * 0.20     // 20% para o Futuro
    }

    // Calcular gastos reais baseados nas categorias das transações
    const spent = { essentials: 0, lifestyle: 0, savings: 0 }

    transactions.forEach(t => {
      if (t.type === 'receita') return // Ignora entradas
      
      // ✅ CORREÇÃO TS: Garantir que amount é tratado como número
      const amountValue = Number(t.amount) || 0;

      // Categorização Automática
      const cat = t.category.toLowerCase()
      if (['moradia', 'contas', 'alimentação', 'supermercado', 'transporte', 'saúde'].some(c => cat.includes(c))) {
        spent.essentials += amountValue
      } else if (['lazer', 'assinaturas', 'compras', 'restaurante', 'viagem'].some(c => cat.includes(c))) {
        spent.lifestyle += amountValue
      } else if (['investimento', 'reserva', 'poupança'].some(c => cat.includes(c))) {
        spent.savings += amountValue
      } else {
        // Default para Lifestyle se não souber
        spent.lifestyle += amountValue
      }
    })

    return { limits, spent }
  }, [income, transactions])

  // Função auxiliar para renderizar barras de progresso premium
  const renderBar = (label: string, spent: number, limit: number, icon: any, colorClass: string, bgClass: string) => {
    const pct = Math.min((limit > 0 ? (spent / limit) * 100 : 0), 100)
    const isOver = spent > limit
    const available = limit - spent

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative overflow-hidden rounded-2xl bg-[#0a0a0c] p-4 border border-white/5 hover:border-white/10 transition-all duration-300"
      >
        <div className="flex justify-between items-start mb-3 relative z-10">
           <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${bgClass} bg-opacity-10 backdrop-blur-sm border border-white/5`}>
                 {icon}
              </div>
              <div>
                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
                 <p className="text-sm font-black text-white mt-0.5">
                    {formatCurrency(spent)} 
                    <span className="text-gray-500 font-medium text-xs ml-1">/ {formatCurrency(limit)}</span>
                 </p>
              </div>
           </div>
           <div className="text-right flex flex-col items-end justify-center">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${isOver ? 'bg-rose-500/10 text-rose-400' : 'bg-white/5 text-gray-400'}`}>
                 {pct.toFixed(0)}%
              </span>
           </div>
        </div>

        {/* Barra de Progresso Estrutural */}
        <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden relative z-10 border border-white/5">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${pct}%` }}
             transition={{ duration: 1, ease: "easeOut" }}
             className={`h-full rounded-full ${isOver ? 'bg-rose-500' : bgClass}`} 
           />
        </div>

        {/* Feedback Cognitivo */}
        <div className="mt-3 flex items-center gap-2 text-[10px] relative z-10">
           {isOver ? (
             <>
               <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
               <span className="text-rose-400 font-medium">Atenção: Limite excedido em R$ {formatCurrency(Math.abs(available))}.</span>
             </>
           ) : (
             <>
               <CheckCircle2 className={`h-3.5 w-3.5 ${colorClass}`} />
               <span className="text-gray-400">R$ {formatCurrency(available)} disponíveis para uso.</span>
             </>
           )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/5 bg-[#09090b] shadow-2xl p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-violet-500/10 p-2.5 rounded-xl border border-violet-500/20 text-violet-400">
             <Zap className="h-5 w-5" />
          </div>
          <div>
             <h3 className="text-lg font-black text-white tracking-tight">Smart Budget</h3>
             <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">Alocação 50/30/20</p>
          </div>
        </div>
        <div className="text-right bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
           <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-0.5">Base Mensal</p>
           <p className="text-sm font-black text-emerald-400">{formatCurrency(income)}</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2 relative z-10">
         {/* 1. Essenciais (50%) */}
         {renderBar(
            'Essenciais (50%)', 
            budgetLogic.spent.essentials, 
            budgetLogic.limits.essentials, 
            <Home className="h-4 w-4 text-blue-400" />, 
            'text-blue-400',
            'bg-blue-500'
         )}

         {/* 2. Estilo de Vida (30%) */}
         {renderBar(
            'Estilo de Vida (30%)', 
            budgetLogic.spent.lifestyle, 
            budgetLogic.limits.lifestyle, 
            <ShoppingBag className="h-4 w-4 text-purple-400" />, 
            'text-purple-400',
            'bg-purple-500'
         )}

         {/* 3. Investimentos (20%) */}
         {renderBar(
            'Construção Futuro (20%)', 
            budgetLogic.spent.savings, 
            budgetLogic.limits.savings, 
            <TrendingUp className="h-4 w-4 text-emerald-400" />, 
            'text-emerald-400',
            'bg-emerald-500'
         )}
      </div>
    </div>
  )
}
