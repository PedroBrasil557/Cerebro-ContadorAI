'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // <--- O IMPORT QUE FALTAVA
import { Plus, Trash2, TrendingUp, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Investment } from '@/types_db'

interface Props {
   investments: Investment[]
   onUpdate: () => void
}

export default function PortfolioManager({ investments, onUpdate }: Props) {
   const [isModalOpen, setIsModalOpen] = useState(false)
   const supabase = createClient()

   const handleDelete = async (id: string) => {
      if (!confirm('Tem certeza que deseja remover este ativo?')) return
      await supabase.from('investments').delete().eq('id', id)
      onUpdate()
   }

   return (
      <div className="bg-[#09090b] border border-white/5 rounded-3xl p-6 overflow-hidden col-span-1 md:col-span-2">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
               Minha Carteira
               <span className="text-xs font-normal text-gray-500 bg-white/5 px-2 py-1 rounded-full">{investments.length} ativos</span>
            </h3>
            <button 
               onClick={() => setIsModalOpen(true)}
               className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
            >
               <Plus size={16} /> Novo Ativo
            </button>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                     <th className="py-3 pl-2">Ativo</th>
                     <th className="py-3">Tipo</th>
                     <th className="py-3 text-right">Qtd</th>
                     <th className="py-3 text-right">Preço Médio</th>
                     <th className="py-3 text-right">Preço Atual</th>
                     <th className="py-3 text-right">Total</th>
                     <th className="py-3 text-right pr-2">Ação</th>
                  </tr>
               </thead>
               <tbody className="text-sm">
                  {investments.map((inv) => {
                     const total = inv.quantity * inv.current_price
                     const profit = (inv.current_price - inv.average_price) * inv.quantity
                     const profitPercent = inv.average_price > 0 
                        ? ((inv.current_price - inv.average_price) / inv.average_price) * 100 
                        : 0

                     return (
                        <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                           <td className="py-4 pl-2 font-bold text-white">
                              {inv.ticker || inv.name}
                              <span className="block text-[10px] text-gray-500 font-normal">{inv.name}</span>
                           </td>
                           <td className="py-4">
                              <span className="bg-white/5 px-2 py-1 rounded text-[10px] text-gray-300 uppercase border border-white/5">
                                 {inv.type.replace('_', ' ')}
                              </span>
                           </td>
                           <td className="py-4 text-right text-gray-300">{inv.quantity}</td>
                           <td className="py-4 text-right text-gray-300">R$ {Number(inv.average_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                           <td className="py-4 text-right text-white font-medium">R$ {Number(inv.current_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                           <td className="py-4 text-right">
                              <div className="text-white font-bold">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                              <div className={`text-[10px] font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                 {profit >= 0 ? '+' : ''}{profitPercent.toFixed(1)}%
                              </div>
                           </td>
                           <td className="py-4 text-right pr-2">
                              <button onClick={() => handleDelete(inv.id)} className="text-gray-600 hover:text-rose-500 transition-colors p-2 hover:bg-white/5 rounded-lg">
                                 <Trash2 size={16} />
                              </button>
                           </td>
                        </tr>
                     )
                  })}
                  {investments.length === 0 && (
                     <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-500 text-sm border-t border-white/5">
                           <div className="flex flex-col items-center gap-2">
                              <TrendingUp size={24} className="opacity-20" />
                              Nenhum ativo cadastrado. Comece investindo! 🚀
                           </div>
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>

         {/* Modal de Adição */}
         <AnimatePresence>
            {isModalOpen && (
               <AddAssetModal onClose={() => setIsModalOpen(false)} onSave={onUpdate} />
            )}
         </AnimatePresence>
      </div>
   )
}

function AddAssetModal({ onClose, onSave }: any) {
   const supabase = createClient()
   const [loading, setLoading] = useState(false)
   
   const handleSubmit = async (e: any) => {
      e.preventDefault()
      setLoading(true)
      const form = new FormData(e.target)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const error = await supabase.from('investments').insert({
         user_id: user.id,
         name: form.get('name'),
         ticker: form.get('ticker'),
         type: form.get('type'),
         quantity: Number(form.get('quantity')),
         average_price: Number(form.get('price')),
         current_price: Number(form.get('price')), // Inicialmente igual
      })
      
      setLoading(false)
      if (!error.error) {
         onSave()
         onClose()
      }
   }

   return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
         <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#09090b] border border-white/10 rounded-3xl p-6 w-full max-w-md relative shadow-2xl"
         >
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
               <X size={20} />
            </button>
            
            <h3 className="text-white font-bold mb-6 text-lg">Adicionar Novo Ativo</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-gray-500 uppercase ml-1">Ticker</label>
                     <input name="ticker" placeholder="Ex: PETR4" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 uppercase" required />
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tipo</label>
                     <select name="type" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 [color-scheme:dark]">
                        <option value="acoes">Ações</option>
                        <option value="fii">FIIs</option>
                        <option value="cripto">Cripto</option>
                        <option value="renda_fixa">Renda Fixa</option>
                        <option value="fundos">Fundos</option>
                        <option value="exterior">Exterior</option>
                        <option value="reserva">Reserva</option>
                     </select>
                  </div>
               </div>
               
               <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome do Ativo</label>
                  <input name="name" placeholder="Ex: Petrobras PN" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500" required />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-gray-500 uppercase ml-1">Quantidade</label>
                     <input name="quantity" type="number" step="0.000001" placeholder="0" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500" required />
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-gray-500 uppercase ml-1">Preço Pago (Un)</label>
                     <input name="price" type="number" step="0.01" placeholder="R$ 0,00" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500" required />
                  </div>
               </div>

               <div className="flex gap-3 mt-6 pt-2">
                  <button type="button" onClick={onClose} className="flex-1 bg-white/5 text-gray-300 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors text-sm">Cancelar</button>
                  <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors text-sm shadow-lg shadow-blue-900/20">
                     {loading ? 'Salvando...' : 'Adicionar Ativo'}
                  </button>
               </div>
            </form>
         </motion.div>
      </div>
   )
}