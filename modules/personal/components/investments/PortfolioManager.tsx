'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, X, Loader2, Trash2, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { Investment } from '@/types_db'

// --- BASE DE DADOS PARA BUSCA RÁPIDA ---
const ASSET_DATABASE = [
  { ticker: 'BTC', name: 'Bitcoin', type: 'Criptomoedas', price: 340000.00 },
  { ticker: 'ETH', name: 'Ethereum', type: 'Criptomoedas', price: 18000.00 },
  { ticker: 'PETR4', name: 'Petrobras PN', type: 'Ações', price: 38.50 },
  { ticker: 'VALE3', name: 'Vale ON', type: 'Ações', price: 62.10 },
  { ticker: 'ITUB4', name: 'Itaú Unibanco', type: 'Ações', price: 34.20 },
  { ticker: 'MXRF11', name: 'Maxi Renda FII', type: 'Fundo Imobiliário', price: 10.40 },
  { ticker: 'Tesouro Selic', name: 'Tesouro Nacional', type: 'Renda Fixa', price: 1000.00 },
]

export default function PortfolioManager({ investments, onUpdate }: { investments: Investment[], onUpdate: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [filteredAssets, setFilteredAssets] = useState<typeof ASSET_DATABASE>([])
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [avgPrice, setAvgPrice] = useState(0)

  const supabase = createClient()

  // Lógica de busca com efeito de carregamento
  useEffect(() => {
    if (searchTerm.length < 2) { setFilteredAssets([]); return; }
    setIsSearching(true)
    const timer = setTimeout(() => {
      const results = ASSET_DATABASE.filter(asset => 
        asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) || 
        asset.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredAssets(results)
      setIsSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const selectAsset = (asset: any) => {
    setSelectedAsset(asset)
    setSearchTerm(asset.ticker)
    setAvgPrice(asset.price)
    setFilteredAssets([])
  }

  const handleSaveInvestment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAsset) return toast.error("Selecione um ativo na lista.")
    
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não logado")

      // ✅ PAYLOAD SINCRONIZADO COM AS COLUNAS DO SEU SUPABASE
      const payload = {
        user_id: user.id,
        name: selectedAsset.name,
        ticker: selectedAsset.ticker,
        type: selectedAsset.type,
        quantity: Number(quantity),
        average_price: Number(avgPrice),      
        current_price: Number(selectedAsset.price), 
        amount_invested: Number(quantity) * Number(avgPrice) 
      }

      const { error } = await supabase.from('investments').insert([payload])
      
      if (error) {
        console.error("Erro detalhado do banco:", error)
        throw error
      }

      toast.success(`${selectedAsset.ticker} adicionado à carteira!`)
      setIsModalOpen(false)
      resetForm()
      onUpdate() 
    } catch (error: any) {
      toast.error(`Erro: ${error.message || "Falha ao salvar"}`)
    } finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este ativo?")) return
    const { error } = await supabase.from('investments').delete().eq('id', id)
    if (error) return toast.error("Erro ao remover.")
    toast.success("Ativo removido.")
    onUpdate()
  }

  const resetForm = () => {
    setSearchTerm('')
    setSelectedAsset(null)
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
                <div className="relative">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Buscar Ativo (B3 ou Cripto)</label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="text" 
                      value={searchTerm} 
                      onChange={(e) => { setSearchTerm(e.target.value); setSelectedAsset(null); }}
                      placeholder="Ex: PETR4, BTC, MXRF11..." 
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500/50 outline-none transition-colors" 
                    />
                    {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-500" size={16}/>}
                  </div>

                  {filteredAssets.length > 0 && !selectedAsset && (
                    <div className="absolute w-full mt-2 bg-[#1a1a1c] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-48 overflow-y-auto custom-scrollbar">
                      {filteredAssets.map(asset => (
                        <div key={asset.ticker} onClick={() => selectAsset(asset)} className="flex items-center justify-between p-3 hover:bg-blue-600/20 cursor-pointer border-b border-white/5 last:border-0 transition">
                          <div>
                            <p className="font-bold text-white text-sm">{asset.ticker}</p>
                            <p className="text-[10px] text-gray-400">{asset.name}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-1 bg-white/5 rounded text-gray-300">{asset.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

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

                {selectedAsset && (
                  <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex justify-between items-center">
                    <span className="text-xs text-blue-300 font-bold">Total da Operação:</span>
                    <span className="text-sm font-black text-white">{formatCurrency(quantity * avgPrice)}</span>
                  </div>
                )}

                <button disabled={loading || !selectedAsset} type="submit" className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
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