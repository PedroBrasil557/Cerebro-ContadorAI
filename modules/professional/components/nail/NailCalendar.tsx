'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle2, BrainCircuit, ArrowUpRight, 
  Loader2, Calculator, TrendingUp, Layers, Info
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function NailCalendar() {
  const supabase = createClient()
  const [inputValue, setInputValue] = useState('')
  const [materials, setMaterials] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Busca de insumos para precisão
  useEffect(() => {
    const fetchMaterials = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('nail_products')
          .select('cost_per_application, name')
          .eq('user_id', user.id)
        if (data) setMaterials(data)
      }
    }
    fetchMaterials()
  }, [supabase])

  const metrics = useMemo(() => {
    const revenue = parseFloat(inputValue) || 0
    const realMaterialCost = materials.reduce((acc, curr) => acc + Number(curr.cost_per_application), 0)
    const materialCost = realMaterialCost > 0 ? realMaterialCost : (revenue * 0.12)
    const tax = revenue * 0.06 
    const netProfit = revenue - materialCost - tax
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0

    return { materialCost, tax, netProfit, margin, isRealData: realMaterialCost > 0 }
  }, [inputValue, materials])

  const handleQuickLaunch = async () => {
    if (!inputValue || isProcessing) return
    setIsProcessing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        description: 'Checkout Profissional',
        amount: parseFloat(inputValue),
        type: 'receita',
        category: 'Serviço',
        date: new Date().toISOString(),
        status: 'concluido'
      })
      if (error) throw error
      setInputValue('')
      toast.success("Venda consolidada.")
    } catch (err) {
      toast.error("Erro ao registrar.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      
      {/* TERMINAL DE LANÇAMENTO - FOCO EM PRECISÃO */}
      <div className="lg:col-span-5 bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-pink-500 rounded-full" />
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Terminal de Venda</h3>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Valor Recebido</label>
            <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl px-4 py-4 focus-within:border-pink-500/40 transition-all">
              <span className="text-xl font-medium text-gray-600">R$</span>
              <input 
                type="number"
                inputMode="decimal"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="0,00"
                className="bg-transparent w-full text-3xl font-bold text-white outline-none placeholder:text-white/5"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleQuickLaunch}
          disabled={!inputValue || isProcessing}
          className="mt-6 w-full bg-white hover:bg-gray-100 disabled:opacity-20 text-black h-12 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
        >
          {isProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : <>Finalizar Atendimento <ArrowUpRight size={14}/></>}
        </button>
      </div>

      {/* COMPOSIÇÃO DE CUSTOS - CONCORDÂNCIA VISUAL */}
      <div className="lg:col-span-4 bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <Calculator size={14} className="text-gray-600" /> Detalhamento
          </h4>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${metrics.isRealData ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500' : 'bg-amber-500/5 border-amber-500/10 text-amber-500'}`}>
            {metrics.isRealData ? 'Custo Real' : 'Estimado'}
          </span>
        </div>
        
        <div className="space-y-3 mt-4">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Materiais</span>
            <span className="text-rose-500 font-bold">-{formatCurrency(metrics.materialCost)}</span>
          </div>
          <div className="flex justify-between text-xs border-b border-white/5 pb-3">
            <span className="text-gray-500">Impostos</span>
            <span className="text-rose-500 font-bold">-{formatCurrency(metrics.tax)}</span>
          </div>
          <div className="pt-1 flex justify-between items-center">
            <span className="text-[10px] font-black text-white uppercase">Lucro Líquido</span>
            <span className="text-2xl font-black text-emerald-400">{formatCurrency(metrics.netProfit)}</span>
          </div>
        </div>
      </div>

      {/* CFO INSIGHT - LIMPO E DIRETO */}
      <div className="lg:col-span-3 bg-gradient-to-br from-[#0a0a0c] to-black border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
        <div className="flex items-center gap-2 text-indigo-400">
          <BrainCircuit size={16} />
          <h4 className="text-[11px] font-bold uppercase tracking-wider">CFO Insight</h4>
        </div>
        
        <p className="text-xs text-gray-400 leading-relaxed py-4">
          {metrics.margin > 70 
            ? "Margem excelente para o padrão do estúdio." 
            : "Margem estável dentro do previsto."}
        </p>

        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <span className="text-[10px] font-bold text-gray-600 uppercase">Saúde</span>
          <div className="flex items-center gap-1 text-emerald-400 font-black text-xs">
            <TrendingUp size={12} /> {metrics.margin.toFixed(0)}%
          </div>
        </div>
      </div>

    </div>
  )
}