'use client'

import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Star, AlertTriangle, Clock, MessageCircle, Sparkles, TrendingUp, Plus, X, Loader2, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

// Interface do Banco de Dados
interface NailClient {
  id: string
  name: string
  phone: string
  total_spent: number
  visit_count: number
  last_visit: string
}

export default function FinancialCrmPanel() {
  const supabase = useMemo(() => createClient(), [])
  
  const [clients, setClients] = useState<NailClient[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newClient, setNewClient] = useState({ name: '', phone: '', total_spent: '', visit_count: '', last_visit: '' })

  // 🔄 BUSCAR DADOS REAIS DO SUPABASE
  const fetchClients = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('nail_clients')
        .select('*')
        .eq('user_id', user.id)
        .order('total_spent', { ascending: false }) // Ordena pelas que mais gastam (LTV)
      
      if (data) setClients(data)
    }
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    void fetchClients()
  }, [fetchClients])

  // 💾 CADASTRAR NOVA CLIENTE
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('nail_clients').insert({
        user_id: user.id,
        name: newClient.name,
        phone: newClient.phone,
        total_spent: parseFloat(newClient.total_spent || '0'),
        visit_count: parseInt(newClient.visit_count || '1', 10),
        last_visit: newClient.last_visit || new Date().toISOString().split('T')[0]
      })

      if (error) throw error

      setIsModalOpen(false)
      setNewClient({ name: '', phone: '', total_spent: '', visit_count: '', last_visit: '' })
      fetchClients()
    } catch (error: unknown) {
      alert(`Erro ao salvar cliente: ${error instanceof Error ? error.message : 'falha inesperada'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('nail_clients').delete().eq('id', id).eq('user_id', user.id)
    fetchClients()
  }

  // Classificação determinística baseada em recência e gasto registrado.
  const analyzeClient = (client: NailClient) => {
    const today = new Date()
    const lastVisitDate = new Date(client.last_visit)
    const daysSinceVisit = Math.floor((today.getTime() - lastVisitDate.getTime()) / (1000 * 3600 * 24))

    let status = 'fiel'
    let ai_action = 'Fidelizada. Manter padrão.'

    if (daysSinceVisit > 45) {
      status = 'perdida'
      ai_action = 'Pesquisa de satisfação e resgate'
    } else if (daysSinceVisit > 25) {
      status = 'risco'
      ai_action = 'Entrar em contato para entender a ausência'
    } else if (client.total_spent > 1500) {
      status = 'vip'
      ai_action = 'Revisar opções de fidelização'
    }

    return { status, ai_action, daysSinceVisit }
  }

  // 🧮 KPIs DO CRM
  const totalClients = clients.length
  const averageLTV = totalClients > 0 ? clients.reduce((acc, curr) => acc + Number(curr.total_spent), 0) / totalClients : 0
  const clientsAtRisk = clients.filter(c => analyzeClient(c).status === 'risco' || analyzeClient(c).status === 'perdida').length
  const riskPercentage = totalClients > 0 ? (clientsAtRisk / totalClients) * 100 : 0

  // Helpers Visuais
  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'vip': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'risco': return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      case 'fiel': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'perdida': return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
      default: return 'bg-white/5 text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'vip': return <Star size={12} />
      case 'risco': return <AlertTriangle size={12} />
      case 'fiel': return <TrendingUp size={12} />
      case 'perdida': return <Clock size={12} />
      default: return null
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full space-y-6">
      
      {/* HEADER DO CRM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-5 flex items-center gap-4 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
           <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
              <Users size={24} />
           </div>
           <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Base Ativa</p>
              <h3 className="text-2xl font-black text-white">{totalClients} <span className="text-xs font-medium text-gray-500">clientes</span></h3>
           </div>
        </div>

        <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-5 flex items-center gap-4 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
           <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Sparkles size={24} />
           </div>
           <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Gasto médio acumulado</p>
              <h3 className="text-2xl font-black text-white">{formatCurrency(averageLTV)}</h3>
           </div>
        </div>

        <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-5 flex items-center gap-4 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
           <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400">
              <AlertTriangle size={24} />
           </div>
           <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sem visita recente</p>
              <h3 className="text-2xl font-black text-rose-400">{riskPercentage.toFixed(1)}% <span className="text-xs font-medium text-gray-500">da base</span></h3>
           </div>
        </div>
      </div>

      {/* MATRIZ DE CLIENTES INTELIGENTE */}
      <div className="flex-1 bg-[#050505] border border-white/5 rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[400px]">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
           <div>
             <h3 className="text-lg font-black text-white tracking-tight">Matriz de Rentabilidade</h3>
             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Classificação por regras de recência e gasto</p>
           </div>
           <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              <Plus size={14} /> Importar Cliente
            </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar flex-1">
          {isLoading ? (
             <div className="h-full flex items-center justify-center text-indigo-400 min-h-[200px]">
                <Loader2 className="animate-spin h-8 w-8" />
             </div>
          ) : clients.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-center p-10 min-h-[200px]">
                <Users size={32} className="text-gray-600 mb-3" />
                <p className="text-sm font-bold text-gray-400">Sua base está limpa</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Adicione clientes para calcular indicadores a partir do histórico registrado.</p>
             </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-[#0a0a0c]">
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Cliente</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Classificação</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">LTV (Gasto Total)</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Última Visita</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-indigo-400">Sugestão baseada em regras</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clients.map((client) => {
                  const analysis = analyzeClient(client)
                  return (
                    <tr key={client.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4">
                        <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{client.name}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{client.visit_count} agendamentos</p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${getStatusStyle(analysis.status)}`}>
                           {getStatusIcon(analysis.status)}
                           {analysis.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <p className="text-sm font-black text-white">{formatCurrency(client.total_spent)}</p>
                      </td>
                      <td className="p-4 text-center">
                        <p className={`text-xs font-medium ${analysis.status === 'risco' || analysis.status === 'perdida' ? 'text-rose-400' : 'text-gray-400'}`}>
                          Há {analysis.daysSinceVisit} dias
                        </p>
                      </td>
                      <td className="p-4">
                         <button className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 rounded-xl transition-colors group/btn">
                            <span className="text-[11px] font-bold">{analysis.ai_action}</span>
                            <MessageCircle size={14} className="group-hover/btn:scale-110 transition-transform" />
                         </button>
                      </td>
                      <td className="p-4 text-right">
                         <button onClick={() => handleDelete(client.id)} className="text-gray-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={16} />
                         </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 🟢 MODAL DE ADICIONAR CLIENTE */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-6 shadow-2xl w-full max-w-md relative z-10">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-black text-white">Importar Cliente (Histórico)</h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                    <X size={20} />
                 </button>
              </div>

              <form onSubmit={handleAddClient} className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 block">Nome da Cliente</label>
                  <input required type="text" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} placeholder="Ex: Carolina Mendes" className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 block">LTV (Gasto Total R$)</label>
                    <input required type="number" step="0.01" value={newClient.total_spent} onChange={e => setNewClient({...newClient, total_spent: e.target.value})} placeholder="Ex: 2450.00" className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                     <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 block">Qtd de Visitas</label>
                     <input required type="number" value={newClient.visit_count} onChange={e => setNewClient({...newClient, visit_count: e.target.value})} placeholder="Ex: 18" className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 block">Data da Última Visita</label>
                  <input required type="date" value={newClient.last_visit} onChange={e => setNewClient({...newClient, last_visit: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500 [color-scheme:dark]" />
                </div>

                <div className="pt-2">
                   <button disabled={isSubmitting} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                     {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Salvar cliente'}
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
