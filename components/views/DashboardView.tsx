'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion' // Correção para o erro 'motion is not defined'
import { Wallet, TrendingUp, CreditCard, PiggyBank, Brain, Target, ShieldAlert, Zap, Activity } from 'lucide-react'
import ModernSummaryCard from '@/components/dashboard/ModernSummaryCard'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardView({ summary, onUpdateEmergencyFund, emergencyFund, transactions = [] }: any) {
  const safeSummary = summary || { currentBalance: 0, monthlyIncome: 0, monthlyExpense: 0 }
  const safeEmergency = emergencyFund || { current_amount: 0, goal_amount: 50000 }

  // IA COORDENADORA FUNCIONAL: Monitora o estado real do caixa
  const aiEngine = useMemo(() => {
    const balance = safeSummary.currentBalance;
    const isCrisis = balance <= 0;

    if (isCrisis) {
      return {
        status: 'CRÍTICO',
        advice: 'Cérebro detectou saldo zerado. Ação: Priorize recebíveis e corte saídas não essenciais imediatamente.',
        color: 'text-red-400',
        icon: ShieldAlert,
        bg: 'bg-red-500/10'
      }
    }
    return {
      status: 'OTIMIZADO',
      advice: 'Fluxo estável. Sugestão: Rentabilizar excedente com a Selic 2026 em 15% a.a.',
      color: 'text-indigo-400',
      icon: Brain,
      bg: 'bg-indigo-500/10'
    }
  }, [safeSummary]);

  // SCORE REATIVO: Reflete a saúde baseada em saldo e reserva
  const financialScore = useMemo(() => {
    if (safeSummary.currentBalance <= 0) return 0; // Score crítico se não houver saldo
    const balanceWeight = Math.min(safeSummary.currentBalance / 5000, 1) * 300;
    const reserveWeight = Math.min(safeEmergency.current_amount / safeEmergency.goal_amount, 1) * 400;
    return Math.floor(balanceWeight + reserveWeight + 300);
  }, [safeSummary, safeEmergency]);

  return (
    <div className="space-y-5 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
      
      {/* Bloco da IA Coordenadora Ativa */}
      <div className={`rounded-2xl border border-white/5 ${aiEngine.bg} p-4 backdrop-blur-md`}>
        <div className="flex items-center gap-4">
           <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <aiEngine.icon className="text-white" size={20} />
           </div>
           <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-tighter">IA Coordenadora — {aiEngine.status}</h2>
              <p className={`text-xs mt-0.5 font-medium ${aiEngine.color}`}>{aiEngine.advice}</p>
           </div>
        </div>
      </div>

      {/* Cards de Saldo com Cores Premium solicitadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ModernSummaryCard title="Saldo Total" value={safeSummary.currentBalance} icon={Wallet} color="indigo" />
        <ModernSummaryCard title="Receita (Mês)" value={safeSummary.monthlyIncome} icon={TrendingUp} color="emerald" />
        <ModernSummaryCard title="Gastos (Mês)" value={safeSummary.monthlyExpense} icon={CreditCard} color="red" />
        <ModernSummaryCard title="Reserva / Caixa" value={safeEmergency.current_amount} icon={PiggyBank} color="amber" />
      </div>

      {/* Área Analítica Compacta */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
         <div className="lg:col-span-8 bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-gray-400 mb-6 flex items-center gap-2">
                <Activity size={14} /> Performance Financeira
            </h3>
            <div className="h-[250px] w-full text-center flex items-center justify-center">
               <p className="text-gray-600 text-xs italic">Gráfico Analítico de Fluxo</p>
            </div>
         </div>

         <div className="lg:col-span-4 bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center">
            <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-6">Cérebro Score</h3>
            <div className="relative h-40 w-40 flex items-center justify-center">
                <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" stroke="#111" strokeWidth="4" fill="none" />
                    <circle cx="50" cy="50" r="44" 
                        stroke={financialScore < 300 ? '#ef4444' : '#10b981'} 
                        strokeWidth="6" fill="none" 
                        strokeDasharray="276" 
                        strokeDashoffset={276 - (276 * financialScore) / 1000} 
                        strokeLinecap="round" 
                    />
                </svg>
                <div className="text-center">
                    <span className="text-5xl font-black text-white">{financialScore}</span>
                    <p className={`text-[10px] font-bold mt-1 ${financialScore < 300 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {financialScore < 300 ? 'CRÍTICO' : 'EXCELENTE'}
                    </p>
                </div>
            </div>
         </div>
      </div>
    </div>
  )
}