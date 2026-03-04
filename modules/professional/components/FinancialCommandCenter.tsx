'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, Activity, DollarSign, BrainCircuit, 
  ShieldCheck, AlertTriangle, Target, Calculator, Users, Loader2
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

import CostEngineeringPanel from './CostEngineeringPanel'
import FinancialCrmPanel from './FinancialCrmPanel'
import DecisionModePanel from './DecisionModePanel'

// Interface dos Dados Reais
interface HealthData {
  gross_revenue: number
  net_profit: number
  average_ticket: number
  profit_margin_pct: number
  stability_index: number
  safe_pro_labore: number
  reinvestment_pool: number
}

export default function FinancialCommandCenter() {
  const supabase = createClient()
  const [activeSubTab, setActiveSubTab] = useState<'visao_geral' | 'custos' | 'crm' | 'decisao'>('visao_geral')
  
  // 🟢 ESTADOS REAIS DO SISTEMA
  const [isLoading, setIsLoading] = useState(true)
  const [health, setHealth] = useState<HealthData>({
    gross_revenue: 0,
    net_profit: 0,
    average_ticket: 0,
    profit_margin_pct: 0,
    stability_index: 0,
    safe_pro_labore: 0,
    reinvestment_pool: 0,
  })

  // 🧠 MOTOR DE CÁLCULO FINANCEIRO (BUSCA NO BANCO)
  useEffect(() => {
    const fetchRealData = async () => {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Pegar o início do mês atual para filtrar transações
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      // 2. Buscar Transações (Faturamento)
      const { data: txs } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', user.id)
        .gte('date', startOfMonth)

      // 3. Buscar Insumos (Custos)
      const { data: materials } = await supabase
        .from('nail_products')
        .select('cost_per_application')
        .eq('user_id', user.id)

      // 🧮 MATEMÁTICA
      let grossRev = 0
      let totalAppointments = 0 // Simulação baseada em número de receitas

      if (txs) {
        txs.forEach(tx => {
          if (tx.type === 'receita') {
            grossRev += Number(tx.amount)
            totalAppointments += 1
          }
        })
      }

      // Custo dos materiais por cada atendimento feito
      const materialCostPerApp = materials ? materials.reduce((acc, curr) => acc + Number(curr.cost_per_application || 0), 0) : 0
      const totalMaterialCost = materialCostPerApp * totalAppointments
      
      // Simulação de Despesa Fixa (ex: aluguel) = 30% do faturamento (ajustável no futuro)
      const estimatedFixedCost = grossRev * 0.30 
      
      const netProfit = grossRev - totalMaterialCost - estimatedFixedCost
      const margin = grossRev > 0 ? (netProfit / grossRev) * 100 : 0
      
      // Algoritmo do Pró-labore (Seguro sacar 60% do lucro, reinvestir 40%)
      const safeProLabore = netProfit > 0 ? netProfit * 0.6 : 0
      const reinvestment = netProfit > 0 ? netProfit * 0.4 : 0

      // Algoritmo do Índice de Estabilidade (0 a 100)
      let stability = 0
      if (margin >= 50) stability += 40
      else if (margin >= 30) stability += 20
      if (grossRev > 2000) stability += 30
      if (totalAppointments > 10) stability += 30
      if (stability > 100) stability = 95 // Teto visual

      setHealth({
        gross_revenue: grossRev,
        net_profit: netProfit > 0 ? netProfit : 0,
        average_ticket: totalAppointments > 0 ? grossRev / totalAppointments : 0,
        profit_margin_pct: margin > 0 ? margin : 0,
        stability_index: stability,
        safe_pro_labore: safeProLabore,
        reinvestment_pool: reinvestment,
      })

      setIsLoading(false)
    }

    if (activeSubTab === 'visao_geral') {
      fetchRealData()
    }
  }, [activeSubTab, supabase])

  // Lógica visual do Índice de Estabilidade
  const getIndexColor = (index: number) => {
    if (index >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    if (index >= 50) return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
  }

  const getIndexGlow = (index: number) => {
    if (index >= 80) return 'bg-emerald-500/5'
    if (index >= 50) return 'bg-amber-500/5'
    return 'bg-rose-500/5'
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* HEADER & SUB-NAVEGAÇÃO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Activity className="text-pink-500" />
            Command Center
          </h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
            Gestão Financeira Estratégica
          </p>
        </div>

        <div className="flex items-center p-1 bg-[#050505] border border-white/5 rounded-xl shadow-inner overflow-x-auto scrollbar-none">
          {[
            { id: 'visao_geral', label: 'Visão Geral', icon: Activity },
            { id: 'custos', label: 'Engenharia de Preços', icon: Calculator },
            { id: 'crm', label: 'CRM Financeiro', icon: Users },
            { id: 'decisao', label: 'Modo Decisão', icon: Target }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                activeSubTab === tab.id 
                  ? 'bg-white/10 text-white shadow-md' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 🟢 RENDERIZAÇÃO DA VISÃO GERAL COM DADOS REAIS */}
      {activeSubTab === 'visao_geral' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative"
        >
          {isLoading && (
            <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm rounded-3xl flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-500 w-10 h-10" />
            </div>
          )}

          {/* COLUNA ESQUERDA: KPIs Financeiros */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                    <DollarSign size={20} strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md flex items-center gap-1">
                    Mês Atual
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Faturamento Bruto</p>
                <h3 className="text-3xl font-black text-white mt-1">{formatCurrency(health.gross_revenue)}</h3>
              </div>

              <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none ${health.net_profit > 0 ? 'bg-emerald-500/5' : 'bg-gray-500/5'}`} />
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Target size={20} strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-1 rounded-md">
                    Margem: {health.profit_margin_pct.toFixed(1)}%
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest relative z-10">Lucro Líquido Real</p>
                <h3 className="text-3xl font-black text-white mt-1 relative z-10">{formatCurrency(health.net_profit)}</h3>
              </div>
            </div>

            <div className="bg-[#050505] border border-white/5 rounded-3xl p-6 shadow-inner">
               <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Distribuição de Lucro Recomendada</h4>
               <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 bg-[#0a0a0c] border border-white/5 rounded-2xl p-4">
                     <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Pró-Labore Seguro (Saque)</p>
                     <p className="text-xl font-black text-emerald-400">{formatCurrency(health.safe_pro_labore)}</p>
                  </div>
                  <div className="flex-1 bg-[#0a0a0c] border border-white/5 rounded-2xl p-4">
                     <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Caixa da Empresa (Reinvestir)</p>
                     <p className="text-xl font-black text-white">{formatCurrency(health.reinvestment_pool)}</p>
                  </div>
               </div>
            </div>
          </div>

          {/* COLUNA DIREITA: IA & Índice de Estabilidade */}
          <div className="space-y-6 flex flex-col">
            
            <div className={`relative bg-[#0a0a0c] border rounded-3xl p-6 flex flex-col items-center justify-center text-center overflow-hidden transition-colors ${getIndexColor(health.stability_index)}`}>
               <div className={`absolute inset-0 ${getIndexGlow(health.stability_index)} blur-2xl pointer-events-none`} />
               
               <ShieldCheck size={28} className="mb-3 relative z-10" />
               <p className="text-[10px] font-black uppercase tracking-[0.2em] relative z-10 mb-1">Índice de Estabilidade</p>
               
               <div className="relative flex items-center justify-center w-32 h-32 my-4 z-10">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="8" className="opacity-10" />
                    <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="351" strokeDashoffset={351 - (351 * health.stability_index) / 100} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-white tracking-tighter">{health.stability_index}</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase mt-1">Score Real</span>
                  </div>
               </div>
               <p className="text-xs font-bold text-white relative z-10">
                 {health.stability_index >= 80 ? 'Negócio Saudável' : health.stability_index >= 40 ? 'Atenção Necessária' : 'Risco Crítico'}
               </p>
            </div>

            <div className="flex-1 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden">
               <div className="flex items-center gap-2 mb-4">
                 <BrainCircuit className="text-indigo-400 animate-pulse" size={18} />
                 <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">CFO Virtual</h4>
               </div>
               
               <div className="space-y-4 relative z-10">
                  <div className="bg-black/20 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                     <p className="text-sm text-gray-300 leading-relaxed font-medium">
                       {health.gross_revenue === 0 
                         ? "Olá! Eu sou a sua IA CFO. Registre suas primeiras receitas no Caixa para eu começar a analisar o seu negócio."
                         : `Seu ticket médio atual é de R$ ${health.average_ticket.toFixed(2)}. Continue registrando suas clientes para que eu possa projetar seu fechamento de mês.`}
                     </p>
                  </div>
                  {health.profit_margin_pct < 40 && health.gross_revenue > 0 && (
                    <div className="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 backdrop-blur-sm flex gap-3 items-start">
                       <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                       <p className="text-xs text-rose-200 leading-relaxed">
                         Alerta: Sua margem está abaixo de 40%. Vá até a aba "Engenharia de Preços" para recalcular seus custos urgemente.
                       </p>
                    </div>
                  )}
               </div>
            </div>

          </div>
        </motion.div>
      )}

      {activeSubTab === 'custos' && <CostEngineeringPanel />}
      {activeSubTab === 'crm' && <FinancialCrmPanel />}
      {activeSubTab === 'decisao' && <DecisionModePanel />}
    </div>
  )
}