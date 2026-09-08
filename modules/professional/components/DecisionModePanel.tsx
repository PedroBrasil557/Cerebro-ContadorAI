'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Target, UserPlus, Store, ArrowRight, BrainCircuit, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export default function DecisionModePanel() {
  const supabase = createClient()
  
  const [activeScenario, setActiveScenario] = useState<'hiring' | 'expansion'>('hiring')
  const [isLoading, setIsLoading] = useState(true)

  // 🟢 ESTADOS DA REALIDADE DA EMPRESA (Lidos do Banco de Dados)
  const [baseRevenue, setBaseRevenue] = useState(0)
  const [baseProfit, setBaseProfit] = useState(0)
  const [baseMargin, setBaseMargin] = useState(0)
  const [averageTicket, setAverageTicket] = useState(0)
  const [materialCostPerClient, setMaterialCostPerClient] = useState(0)

  // 🎛️ VARIÁVEIS DO SIMULADOR (Controladas pela Usuária)
  const [assistantCost, setAssistantCost] = useState(1500)
  const [extraClientsPerMonth, setExtraClientsPerMonth] = useState(30)

  // 🔄 BUSCAR DADOS REAIS DO SUPABASE
  useEffect(() => {
    const fetchRealData = async () => {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      // Buscar Receitas
      const { data: txs } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', user.id)
        .eq('scope', 'business')
        .gte('date', startOfMonth)

      // Buscar Custos de Produto
      const { data: materials } = await supabase
        .from('nail_products')
        .select('cost_per_application')
        .eq('user_id', user.id)

      let grossRev = 0
      let totalAppointments = 0

      if (txs) {
        txs.forEach((tx: { amount: number; type: string }) => {
          if (tx.type === 'receita') {
            grossRev += Number(tx.amount)
            totalAppointments += 1
          }
        })
      }

      const matCost = materials
        ? materials.reduce(
          (acc: number, curr: { cost_per_application: number | null }) =>
            acc + Number(curr.cost_per_application || 0),
          0
        )
        : 0
      const registeredExpenses = (txs ?? [])
        .filter((tx: { type: string }) => tx.type === 'despesa_fixa' || tx.type === 'despesa_variavel')
        .reduce((sum: number, tx: { amount: number }) => sum + Math.abs(Number(tx.amount)), 0)
      const netProf = grossRev - (matCost * totalAppointments) - registeredExpenses
      const margin = grossRev > 0 ? (netProf / grossRev) * 100 : 0
      const avgTicket = totalAppointments > 0 ? grossRev / totalAppointments : 0

      setBaseRevenue(grossRev)
      setBaseProfit(netProf > 0 ? netProf : 0)
      setBaseMargin(margin > 0 ? margin : 0)
      setAverageTicket(avgTicket)
      setMaterialCostPerClient(matCost)
      
      setIsLoading(false)
    }

    fetchRealData()
  }, [supabase])

  // 🧮 MOTOR MATEMÁTICO DA PROJEÇÃO
  const extraRevenue = extraClientsPerMonth * averageTicket
  const extraCost = assistantCost + (extraClientsPerMonth * materialCostPerClient)
  
  const projectedRevenue = baseRevenue + extraRevenue
  const projectedProfit = baseProfit + extraRevenue - extraCost
  const projectedMargin = projectedRevenue > 0 ? ((projectedProfit / projectedRevenue) * 100) : 0

  const profitDiff = projectedProfit - baseProfit
  const isPositiveDecision = profitDiff > 0
  const confidence = baseRevenue > 0 && averageTicket > 0 && materialCostPerClient > 0 ? 'alta' : 'baixa'

  // Se o estúdio for novo e ainda não tiver faturamento, usamos um fallback visual
  const isNewBusiness = baseRevenue === 0

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full min-h-[500px]"
    >
      {/* PAINEL ESQUERDO: Laboratório de Variáveis */}
      <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 shadow-2xl relative flex flex-col">
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-[#0a0a0c]/80 backdrop-blur-sm rounded-3xl flex items-center justify-center">
            <Loader2 className="animate-spin text-purple-500 w-10 h-10" />
          </div>
        )}

        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Target size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">Laboratório de Cenários</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Baseado no seu lucro atual</p>
          </div>
        </div>

        {/* Seleção de Cenário */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button 
            onClick={() => setActiveScenario('hiring')}
            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${activeScenario === 'hiring' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-[#050505] border-white/5 text-gray-500 hover:border-white/10'}`}
          >
            <UserPlus size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest text-center">Contratar Auxiliar</span>
          </button>
          
          <button 
            onClick={() => setActiveScenario('expansion')}
            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${activeScenario === 'expansion' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-[#050505] border-white/5 text-gray-500 hover:border-white/10'}`}
          >
            <Store size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest text-center">Alugar Espaço Maior</span>
          </button>
        </div>

        {/* Controles Dinâmicos */}
        {activeScenario === 'hiring' && (
          <div className="space-y-6 flex-1">
            {isNewBusiness && (
               <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-4">
                  Aviso: O seu faturamento deste mês está a zero. As projeções abaixo podem não ser precisas até registar as suas primeiras receitas no Caixa.
               </div>
            )}
            
            {/* Slider 1: Custo da Auxiliar */}
            <div>
              <div className="flex justify-between items-end mb-3">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Custo Mensal (Salário + Taxas)</label>
                <span className="text-xl font-black text-white">{formatCurrency(assistantCost)}</span>
              </div>
              <input 
                type="range" min="800" max="4000" step="100" value={assistantCost}
                onChange={(e) => setAssistantCost(Number(e.target.value))}
                className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Slider 2: Capacidade de Atendimento Extra */}
            <div>
              <div className="flex justify-between items-end mb-3">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Atendimentos Extras / Mês</label>
                <span className="text-xl font-black text-white">+{extraClientsPerMonth} clientes</span>
              </div>
              <input 
                type="range" min="0" max="150" step="5" value={extraClientsPerMonth}
                onChange={(e) => setExtraClientsPerMonth(Number(e.target.value))}
                className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <p className="text-[10px] text-gray-500 mt-2 font-medium">A sua auxiliar terá de atender cerca de {Math.ceil(extraClientsPerMonth / 4)} clientes a mais por semana.</p>
            </div>
          </div>
        )}

        {activeScenario === 'expansion' && (
          <div className="flex-1 flex items-center justify-center border border-white/5 border-dashed rounded-2xl bg-[#050505]">
             <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Selecione "Contratar Auxiliar" para testar o motor.</p>
          </div>
        )}
      </div>

      {/* PAINEL DIREITO: Máquina do Tempo (Projeção) */}
      <div className="bg-[#050505] border border-white/5 rounded-3xl p-6 shadow-inner relative overflow-hidden flex flex-col">
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none transition-colors duration-500 ${isPositiveDecision ? 'bg-emerald-500/5' : 'bg-rose-500/5'}`} />

        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 relative z-10">Projeção do Novo Cenário</h3>

        {/* Cards de Transformação (Antes -> Depois) */}
        <div className="space-y-4 relative z-10 mb-8">
           {/* Linha de Lucro */}
           <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0a0a0c] border border-white/5">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Lucro Atual</p>
                <p className="text-lg font-bold text-gray-300 line-through decoration-white/20">{formatCurrency(baseProfit)}</p>
              </div>
              <ArrowRight className="text-white/20" size={20} />
              <div className="text-right">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Novo Lucro Líquido</p>
                <p className={`text-2xl font-black ${isPositiveDecision ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(projectedProfit)}
                </p>
              </div>
           </div>

           {/* Linha de Margem */}
           <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0a0a0c] border border-white/5">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Margem Atual</p>
                <p className="text-lg font-bold text-gray-300">{baseMargin.toFixed(1)}%</p>
              </div>
              <ArrowRight className="text-white/20" size={20} />
              <div className="text-right">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Nova Margem</p>
                <p className={`text-2xl font-black ${projectedMargin >= baseMargin ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {projectedMargin.toFixed(1)}%
                </p>
              </div>
           </div>
        </div>

        {/* Parecer do CFO (IA) */}
        <div className="mt-auto relative z-10">
          <div className="mb-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-[11px] text-gray-400 space-y-1">
            <p><strong className="text-gray-300">Dados utilizados:</strong> faturamento, despesas e insumos cadastrados no mês.</p>
            <p><strong className="text-gray-300">Hipóteses:</strong> {extraClientsPerMonth} novos atendimentos e custo mensal de {formatCurrency(assistantCost)}.</p>
            <p><strong className="text-gray-300">Confiança:</strong> {confidence}; revise os valores antes de decidir.</p>
          </div>
          <div className={`p-5 rounded-2xl border backdrop-blur-md flex gap-4 items-start ${isPositiveDecision ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <BrainCircuit className={isPositiveDecision ? 'text-emerald-400' : 'text-rose-400'} size={24} />
            <div>
              <h4 className={`text-xs font-black uppercase tracking-widest mb-1 ${isPositiveDecision ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositiveDecision ? 'Cenário financeiramente positivo' : 'Cenário com risco de prejuízo'}
              </h4>
              <p className="text-sm text-gray-300 leading-relaxed font-medium">
                {isPositiveDecision 
                  ? `Se a auxiliar trouxer ${extraClientsPerMonth} clientes (baseado no seu ticket atual de R$ ${averageTicket.toFixed(2)}), a projeção indica R$ ${formatCurrency(profitDiff)} de resultado adicional. Confirme capacidade, demanda e custos antes da contratação.`
                  : `Atenção: A matemática não fecha. Com o seu ticket médio atual e o custo dos seus géis, a auxiliar não gera receita suficiente para cobrir o salário dela de R$ ${assistantCost}. Vai ter um PREJUÍZO de R$ ${formatCurrency(Math.abs(profitDiff))}. Tente aumentar as suas margens primeiro.`}
              </p>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  )
}
