'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Loader2, Trash2, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { Investment } from '@/types_db'
import { financeService } from '@/services/financeService'

export default function PortfolioManager({ investments, onUpdate }: { investments: Investment[], onUpdate: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ticker, setTicker] = useState('')
  const [name, setName] = useState('')
  const [assetType, setAssetType] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [avgPrice, setAvgPrice] = useState(0)

  const handleSaveInvestment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticker.trim() || !name.trim() || !assetType.trim()) return toast.error('Preencha os dados reais do ativo.')
    
    setLoading(true)
    try {
      await financeService.createInvestment({
        name,
        ticker,
        type: assetType,
        quantity: Number(quantity),
        average_price: Number(avgPrice),
        current_price: Number(avgPrice),
      })

      toast.success(`${ticker.toUpperCase()} adicionado à carteira!`)
      setIsModalOpen(false)
      resetForm()
      onUpdate() 
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Falha ao salvar')
    } finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este ativo?")) return
    try {
      await financeService.deleteInvestment(id)
      toast.success('Ativo removido.')
      onUpdate()
    } catch {
      toast.error('Erro ao remover.')
    }
  }

  const resetForm = () => {
    setTicker('')
    setName('')
    setAssetType('')
    setQuantity(1)
    setAvgPrice(0)
  }

  return (
    <div className="bg-[#09090b]/80 border border-white/5 p-6 rounded-3xl backdrop-blur-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-400"/> Ativos na Carteira
        </h3>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95">
          <Plus size={16} /> Adicionar Ativo
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs font-bold text-gray-500 uppercase tracking-widest">
              <th className="pb-3 pl-2">Ativo</th>
              <th className="pb-3">Tipo</th>
              <th className="pb-3 text-right">Qtd</th>
              <th className="pb-3 text-right">Preço Médio</th>
              <th className="pb-3 text-right">Total</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody>
            {investments.length > 0 ? (
              investments.map((inv) => (
                <tr key={inv.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <td className="py-4 pl-2 font-bold text-white">
                    {inv.ticker}
                    <br/>
                    <span className="text-[10px] text-gray-500 font-normal uppercase tracking-tighter">{inv.name}</span>
                  </td>
                  <td className="py-4">
                    <span className="text-[10px] font-bold px-2 py-1 bg-white/5 rounded text-gray-400 border border-white/10">{inv.type}</span>
                  </td>
                  <td className="py-4 text-right font-mono text-gray-300">{inv.quantity}</td>
                  <td className="py-4 text-right font-mono text-gray-300">{formatCurrency(inv.average_price)}</td>
                  <td className="py-4 text-right font-bold text-white">{formatCurrency(inv.amount_invested)}</td>
                  <td className="py-4 text-right pr-2">
                    <button onClick={() => handleDelete(inv.id)} className="p-2 text-gray-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500 italic">
                  Sua carteira está vazia. Comece adicionando seu primeiro ativo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
              
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Plus className="bg-blue-500/20 text-blue-400 p-1 rounded-lg" size={24} /> Novo Investimento
              </h3>
              
              <form onSubmit={handleSaveInvestment} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Código</label><input value={ticker} onChange={(event) => setTicker(event.target.value)} required placeholder="Ex: PETR4" className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500" /></div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Tipo</label><input value={assetType} onChange={(event) => setAssetType(event.target.value)} required placeholder="Ex: Ação" className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500" /></div>
                </div>

                <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome do ativo</label><input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Nome conforme sua corretora" className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500" /></div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Quantidade</label>
                    <input type="number" step="0.01" value={quantity} onChange={e => setQuantity(Number(e.target.value))} required className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Preço Médio (R$)</label>
                    <input type="number" step="0.01" value={avgPrice} onChange={e => setAvgPrice(Number(e.target.value))} required className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors" />
                  </div>
                </div>

                {quantity > 0 && avgPrice >= 0 && (
                  <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex justify-between items-center">
                    <span className="text-xs text-blue-300 font-bold">Total da Operação:</span>
                    <span className="text-sm font-black text-white">{formatCurrency(quantity * avgPrice)}</span>
                  </div>
                )}

                <button disabled={loading || !ticker.trim() || !name.trim() || !assetType.trim()} type="submit" className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : 'Confirmar e Salvar'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
