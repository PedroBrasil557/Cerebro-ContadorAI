'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Loader2, Target, UserPlus } from 'lucide-react'
import { motion } from 'framer-motion'
import { businessFinanceService } from '@/services/businessFinanceService'
import { formatCurrency } from '@/lib/utils'
import { finiteNumber } from '@/lib/business/finance'

export default function DecisionModePanel() {
  const [loading, setLoading] = useState(true)
  const [revenue, setRevenue] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [averageSale, setAverageSale] = useState(0)
  const [variableCost, setVariableCost] = useState(0)
  const [employeeCost, setEmployeeCost] = useState(2500)
  const [extraSales, setExtraSales] = useState(20)

  useEffect(() => {
    void businessFinanceService.getDashboardData().then((data) => {
      const sales = data.transactions.filter((item) => item.type === 'receita')
      const gross = sales.reduce((sum, item) => sum + finiteNumber(item.amount), 0)
      const observedExpenses = data.transactions.filter((item) => item.type === 'despesa_fixa' || item.type === 'despesa_variavel').reduce((sum, item) => sum + Math.abs(finiteNumber(item.amount)), 0)
      setRevenue(gross)
      setExpenses(observedExpenses)
      setAverageSale(sales.length ? gross / sales.length : 0)
      setVariableCost(data.costs.reduce((sum, item) => sum + finiteNumber(item.cost_per_use), 0))
    }).finally(() => setLoading(false))
  }, [])

  const projection = useMemo(() => {
    const currentResult = revenue - expenses
    const additionalRevenue = extraSales * averageSale
    const additionalCosts = employeeCost + extraSales * variableCost
    const projectedResult = currentResult + additionalRevenue - additionalCosts
    return { currentResult, projectedResult, difference: projectedResult - currentResult }
  }, [averageSale, employeeCost, expenses, extraSales, revenue, variableCost])
  const sufficient = revenue > 0 && averageSale > 0

  return <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="grid min-h-[500px] gap-6 xl:grid-cols-2">
    <section className="relative rounded-3xl border border-white/5 bg-[#0a0a0c] p-6">{loading && <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-black/70"><Loader2 className="animate-spin text-purple-400"/></div>}<div className="mb-8 flex items-center gap-3"><div className="rounded-xl bg-purple-500/10 p-3 text-purple-400"><Target/></div><div><h3 className="font-black text-white">Simulador de contratação</h3><p className="text-xs text-gray-500">Cenário educativo baseado nos lançamentos registrados.</p></div></div><div className="mb-8 rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4"><UserPlus className="text-purple-300"/><p className="mt-2 font-bold text-white">Contratar funcionário</p></div><div className="space-y-8"><div><div className="mb-3 flex justify-between"><label className="text-xs text-gray-400">Custo mensal total</label><strong className="text-white">{formatCurrency(employeeCost)}</strong></div><input className="w-full accent-purple-500" type="range" min="800" max="10000" step="100" value={employeeCost} onChange={(e) => setEmployeeCost(Number(e.target.value))}/></div><div><div className="mb-3 flex justify-between"><label className="text-xs text-gray-400">Vendas ou atendimentos adicionais</label><strong className="text-white">+{extraSales}</strong></div><input className="w-full accent-emerald-500" type="range" min="0" max="150" step="5" value={extraSales} onChange={(e) => setExtraSales(Number(e.target.value))}/></div></div>{!sufficient && <p className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-100">Dados insuficientes: registre receitas do negócio antes de usar a projeção.</p>}</section>
    <section className="rounded-3xl border border-white/5 bg-[#050505] p-6"><h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Comparação do cenário</h3><div className="mt-8 flex items-center justify-between rounded-2xl border border-white/5 bg-[#0a0a0c] p-5"><div><p className="text-xs text-gray-500">Resultado atual</p><p className="text-xl font-bold text-white">{formatCurrency(projection.currentResult)}</p></div><ArrowRight className="text-gray-600"/><div className="text-right"><p className="text-xs text-gray-500">Resultado projetado</p><p className={`text-2xl font-black ${projection.difference >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(projection.projectedResult)}</p></div></div><div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-xs leading-relaxed text-gray-300"><p><strong>Dados usados:</strong> receitas e despesas observadas, ticket médio e custos por uso cadastrados.</p><p className="mt-2"><strong>Hipóteses:</strong> {extraSales} novas vendas ou atendimentos e custo mensal de {formatCurrency(employeeCost)}.</p><p className="mt-2"><strong>Limites:</strong> a projeção não garante demanda, produtividade ou disponibilidade de caixa. Revise encargos e obrigações com profissionais qualificados.</p></div><div className={`mt-4 rounded-2xl border p-5 ${sufficient && projection.difference >= 0 ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100' : 'border-amber-500/20 bg-amber-500/10 text-amber-100'}`}>{!sufficient ? 'Ainda não há base suficiente para uma conclusão.' : projection.difference >= 0 ? `A hipótese produz variação positiva estimada de ${formatCurrency(projection.difference)}.` : `A hipótese reduz o resultado estimado em ${formatCurrency(Math.abs(projection.difference))}.`}</div></section>
  </motion.div>
}
