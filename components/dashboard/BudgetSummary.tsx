'use client'

import React, { useMemo } from 'react'
import { PieChart, Zap, AlertTriangle, CheckCircle2, ShoppingBag, Home, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Transaction } from '@/types_db'

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
    let spent = { essentials: 0, lifestyle: 0, savings: 0 }

    transactions.forEach(t => {
      if (t.type === 'receita') return // Ignora entradas
      
      // Categorização Automática (Simulada)
      const cat = t.category.toLowerCase()
      if (['moradia', 'contas', 'alimentação', 'supermercado', 'transporte', 'saúde'].some(c => cat.includes(c))) {
        spent.essentials += t.amount
      } else if (['lazer', 'assinaturas', 'compras', 'restaurante', 'viagem'].some(c => cat.includes(c))) {
        spent.lifestyle += t.amount
      } else if (['investimento', 'reserva', 'poupança'].some(c => cat.includes(c))) {
        spent.savings += t.amount
      } else {
        // Default para Lifestyle se não souber
        spent.lifestyle += t.amount
      }
    })

    return { limits, spent }
  }, [income, transactions])

  // Função auxiliar para renderizar barras de progresso
  const renderBar = (label: string, spent: number, limit: number, icon: any, colorClass: string) => {
    const pct = Math.min((spent / limit) * 100, 100) || 0
    const isOver = spent > limit
    const available = limit - spent

    return (
      <div className="group relative overflow-hidden rounded-xl bg-white/5 p-4 border border-white/5 hover:border-white/10 transition-all">
        <div className="flex justify-between items-start mb-2 relative z-10">
           <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${colorClass} bg-opacity-20`}>
                 {icon}
              </div>
              <div>
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                 <p className="text-sm font-bold text-white">{formatCurrency(spent)} <span className="text-gray-500 text-[10px] font-normal">de {formatCurrency(limit)}</span></p>
              </div>
           </div>
           <div className="text-right">
              <p className={`text-xs font-bold ${isOver ? 'text-red-400' : 'text-emerald-400'}`}>
                 {isOver ? 'Estourou' : 'Dentro'}
              </p>
              <p className="text-[10px] text-gray-500">
                 {pct.toFixed(0)}% usado
              </p>
           </div>
        </div>

        {/* Barra de Progresso Background */}
        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden mt-2 relative z-10">
           <div 
             className={`h-full rounded-full transition-all duration-1000 ${isOver ? 'bg-red-500' : colorClass.replace('text-', 'bg-')}`} 
             style={{ width: `${pct}%` }} 
           />
        </div>

        {/* Feedback Inteligente */}
        <div className="mt-3 flex items-center gap-2 text-[10px] relative z-10">
           {isOver ? (
             <>
               <AlertTriangle className="h-3 w-3 text-red-500" />
               <span className="text-red-400 font-medium">Você excedeu R$ {formatCurrency(Math.abs(available))} do ideal.</span>
             </>
           ) : (
             <>
               <CheckCircle2 className="h-3 w-3 text-emerald-500" />
               <span className="text-gray-400">R$ {formatCurrency(available)} disponíveis para gastar.</span>
             </>
           )}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-panel flex h-full flex-col rounded-2xl border border-white/5 bg-[#111] p-5">
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-violet-500/10 p-2 rounded-lg text-violet-400">
             <Zap className="h-5 w-5" />
          </div>
          <div>
             <h3 className="text-lg font-bold text-white leading-none">Smart Budget</h3>
             <p className="text-[10px] text-gray-400 mt-0.5">Distribuição baseada na Receita Atual</p>
          </div>
        </div>
        <div className="text-right">
           <p className="text-[10px] text-gray-500 uppercase font-bold">Base de Cálculo</p>
           <p className="text-sm font-bold text-white">{formatCurrency(income)}</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
         {/* 1. Essenciais (50%) */}
         {renderBar(
            'Essenciais (50%)', 
            budgetLogic.spent.essentials, 
            budgetLogic.limits.essentials, 
            <Home className="h-4 w-4 text-blue-400" />, 
            'text-blue-400'
         )}

         {/* 2. Estilo de Vida (30%) */}
         {renderBar(
            'Estilo de Vida (30%)', 
            budgetLogic.spent.lifestyle, 
            budgetLogic.limits.lifestyle, 
            <ShoppingBag className="h-4 w-4 text-purple-400" />, 
            'text-purple-400'
         )}

         {/* 3. Investimentos (20%) */}
         {renderBar(
            'Ouro / Futuro (20%)', 
            budgetLogic.spent.savings, 
            budgetLogic.limits.savings, 
            <TrendingUp className="h-4 w-4 text-emerald-400" />, 
            'text-emerald-400'
         )}
      </div>
    </div>
  )
}