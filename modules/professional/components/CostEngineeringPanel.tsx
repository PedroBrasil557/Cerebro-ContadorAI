'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, Package, Sliders, TrendingUp, AlertTriangle, CheckCircle2, Plus, X, Loader2, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface NailProduct {
  id: string
  name: string
  category: string
  purchase_price: number
  quantity: number
  estimated_yield: number
  cost_per_application: number
  status: string
}

export default function CostEngineeringPanel() {
  const supabase = createClient()
  
  const [materials, setMaterials] = useState<NailProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPrice, setCurrentPrice] = useState<number>(120)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newMat, setNewMat] = useState({ name: '', category: 'gel', purchase_price: '', quantity: '', estimated_yield: '' })

  const fetchMaterials = async () => {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase
        .from('nail_products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
         console.error("Erro ao buscar insumos:", error)
      } else if (data) {
         setMaterials(data)
      }
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchMaterials()
  }, [])

  // 💾 NOVA FUNÇÃO BLINDADA (COM AVISO DE ERROS)
  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        alert("Erro de Autenticação: Sua sessão pode ter expirado. Recarregue a página.")
        setIsSubmitting(false)
        return
      }

      const insertPayload = {
        user_id: user.id,
        name: newMat.name,
        category: newMat.category,
        purchase_price: parseFloat(newMat.purchase_price),
        quantity: parseFloat(newMat.quantity),
        estimated_yield: parseInt(newMat.estimated_yield, 10),
        status: 'ok'
      }

      console.log("Enviando para o Supabase:", insertPayload)

      const { error } = await supabase.from('nail_products').insert(insertPayload)

      if (error) {
        console.error("Erro do Supabase:", error)
        alert(`O banco de dados bloqueou o salvamento: ${error.message}`)
      } else {
        setIsModalOpen(false)
        setNewMat({ name: '', category: 'gel', purchase_price: '', quantity: '', estimated_yield: '' })
        fetchMaterials() // Recarrega a lista instantaneamente
      }
    } catch (err) {
      console.error("Erro fatal inesperado:", err)
      alert("Ocorreu um erro no sistema ao tentar salvar.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('nail_products').delete().eq('id', id)
    if (error) {
       alert(`Erro ao deletar: ${error.message}`)
    } else {
       fetchMaterials()
    }
  }

  const totalMaterialCost = materials.reduce((acc, curr) => acc + Number(curr.cost_per_application || 0), 0)
  const fixedCostApportionment = 15.00
  const totalRealCost = totalMaterialCost + fixedCostApportionment
  
  const netProfit = currentPrice - totalRealCost
  const profitMarginPct = currentPrice > 0 ? ((netProfit / currentPrice) * 100) : 0

  const getMarginColor = (margin: number) => {
    if (margin >= 60) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    if (margin >= 40) return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
  }

  return (
    <div className="relative h-full">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* PAINEL ESQUERDO: A Estrutura de Custos */}
        <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Package size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">Custo por Serviço</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Seus Insumos Reais</p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              <Plus size={14} /> Novo Insumo
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2 relative z-10 mb-6">
            {isLoading ? (
               <div className="h-full flex items-center justify-center text-indigo-400">
                  <Loader2 className="animate-spin h-8 w-8" />
               </div>
            ) : materials.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/5 rounded-2xl">
                  <Package size={32} className="text-gray-600 mb-3" />
                  <p className="text-sm font-bold text-gray-400">Nenhum insumo cadastrado</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Adicione seu Gel, Fibra e Top Coat.</p>
               </div>
            ) : (
              materials.map((mat) => (
                <div key={mat.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#050505] border border-white/5 hover:border-white/10 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${mat.status === 'ok' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                    <div>
                       <span className="text-sm font-bold text-gray-300 block">{mat.name}</span>
                       <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">
                         Pagou {formatCurrency(mat.purchase_price)} • Rende {mat.estimated_yield} clientes
                       </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="text-sm font-black text-indigo-400">{formatCurrency(mat.cost_per_application)}</span>
                     <button onClick={() => handleDelete(mat.id)} className="text-gray-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={14} />
                     </button>
                  </div>
                </div>
              ))
            )}
            
            {materials.length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 border-dashed">
                <span className="text-sm font-bold text-gray-500">Rateio Custo Fixo (Aluguel/Energia)</span>
                <span className="text-sm font-black text-gray-500">{formatCurrency(fixedCostApportionment)}</span>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 flex items-center justify-between relative z-10">
            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Custo Real Total</span>
            <span className="text-xl font-black text-indigo-400">{formatCurrency(totalRealCost)}</span>
          </div>
        </div>

        {/* PAINEL DIREITO: Simulador */}
        <div className="bg-[#050505] border border-white/5 rounded-3xl p-6 shadow-inner flex flex-col relative overflow-hidden h-[600px]">
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none transition-colors duration-500 ${profitMarginPct >= 60 ? 'bg-emerald-500/5' : profitMarginPct >= 40 ? 'bg-amber-500/5' : 'bg-rose-500/5'}`} />

          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sliders size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Simulador de Preço</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Baseado nos seus custos reais</p>
            </div>
          </div>

          <div className="mb-8 relative z-10">
            <div className="flex justify-between items-end mb-4">
              <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Preço Cobrado da Cliente</label>
              <span className="text-3xl font-black text-white tracking-tighter">{formatCurrency(currentPrice)}</span>
            </div>
            <input 
              type="range" min="50" max="350" step="5" value={currentPrice}
              onChange={(e) => setCurrentPrice(Number(e.target.value))}
              className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1 relative z-10">
            <div className={`p-5 rounded-2xl border transition-colors duration-300 flex flex-col justify-center items-center text-center ${getMarginColor(profitMarginPct)}`}>
              <p className="text-[10px] font-black uppercase tracking-widest mb-2">Margem de Lucro</p>
              <span className="text-4xl font-black tracking-tighter">{profitMarginPct.toFixed(1)}%</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#0a0a0c] border border-white/5 flex flex-col justify-center items-center text-center">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Lucro Limpo no Bolso</p>
              <span className={`text-3xl font-black tracking-tighter ${netProfit > 0 ? 'text-white' : 'text-rose-500'}`}>
                {formatCurrency(netProfit)}
              </span>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3 relative z-10">
            {profitMarginPct >= 60 ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" /> : profitMarginPct >= 40 ? <TrendingUp size={16} className="text-amber-400 shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />}
            <p className="text-xs text-gray-400 font-medium leading-relaxed">
              {profitMarginPct >= 60 ? "Excelente! Sua margem está no padrão Ouro. O seu esforço está sendo muito bem remunerado baseado nos seus insumos." : profitMarginPct >= 40 ? "Sua margem está na média. Cuidado com desperdício de produto para não diminuir seu rendimento." : "Alerta Crítico: Você está pagando para trabalhar. O custo dos seus materiais está engolindo seu preço."}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 🟢 MODAL DE ADICIONAR INSUMO */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-6 shadow-2xl w-full max-w-md relative z-10">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-black text-white">Novo Insumo</h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                    <X size={20} />
                 </button>
              </div>

              <form onSubmit={handleAddMaterial} className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 block">Nome do Produto</label>
                  <input required type="text" value={newMat.name} onChange={e => setNewMat({...newMat, name: e.target.value})} placeholder="Ex: Gel Construtor Vòlia" className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 block">Preço Pago (R$)</label>
                    <input required type="number" step="0.01" min="0" value={newMat.purchase_price} onChange={e => setNewMat({...newMat, purchase_price: e.target.value})} placeholder="Ex: 120.00" className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 block">Categoria</label>
                    <select value={newMat.category} onChange={e => setNewMat({...newMat, category: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500 appearance-none">
                      <option value="gel">Gel/Fibra</option>
                      <option value="prep">Preparadores</option>
                      <option value="esmalte">Esmaltes</option>
                      <option value="descartavel">Descartáveis</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 block">Qtd (g/ml)</label>
                     <input required type="number" step="0.01" min="0" value={newMat.quantity} onChange={e => setNewMat({...newMat, quantity: e.target.value})} placeholder="Ex: 24" className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                     <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 block">Rende Clientes</label>
                     <input required type="number" min="1" value={newMat.estimated_yield} onChange={e => setNewMat({...newMat, estimated_yield: e.target.value})} placeholder="Ex: 30" className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500" />
                  </div>
                </div>

                <div className="pt-2">
                   <button disabled={isSubmitting} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                     {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Insumo no Cérebro'}
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}