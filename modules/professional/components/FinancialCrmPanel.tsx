'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Loader2, Plus, Trash2, Users, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { businessFinanceService } from '@/services/businessFinanceService'
import { formatCurrency } from '@/lib/utils'
import type { BusinessCustomer } from '@/types_db'

function customerIndicator(customer: BusinessCustomer) {
  if (!customer.last_interaction_at) return { label: 'sem histórico', action: 'Registrar a primeira interação', tone: 'text-gray-400' }
  const days = Math.max(0, Math.floor((Date.now() - new Date(customer.last_interaction_at).getTime()) / 86_400_000))
  if (days > 45) return { label: 'sem contato recente', action: 'Revisar o relacionamento', tone: 'text-rose-400' }
  if (days > 25) return { label: 'acompanhar', action: 'Considerar um novo contato', tone: 'text-amber-400' }
  return { label: 'recente', action: 'Manter o acompanhamento', tone: 'text-emerald-400' }
}

export default function FinancialCrmPanel() {
  const [customers, setCustomers] = useState<BusinessCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await businessFinanceService.getDashboardData()
      setCustomers(data.customers)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível carregar os clientes.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])
  const averageSpent = useMemo(() => customers.length ? customers.reduce((sum, item) => sum + Number(item.total_spent), 0) / customers.length : 0, [customers])
  const withoutRecentContact = customers.filter((customer) => customerIndicator(customer).label !== 'recente').length

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await businessFinanceService.createCustomer({ name: form.name, phone: form.phone || null, email: form.email || null })
      setModalOpen(false)
      setForm({ name: '', phone: '', email: '' })
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível cadastrar o cliente.')
    } finally { setSubmitting(false) }
  }

  const remove = async (id: string) => {
    try { await businessFinanceService.deleteCustomer(id); await load() }
    catch { toast.error('Não foi possível remover o cliente.') }
  }

  return <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-6">
    <div className="grid gap-4 md:grid-cols-3">
      {[
        { label: 'Clientes cadastrados', value: `${customers.length}`, Icon: Users },
        { label: 'Gasto médio registrado', value: formatCurrency(averageSpent), Icon: Users },
        { label: 'Para acompanhar', value: `${withoutRecentContact}`, Icon: AlertTriangle },
      ].map(({ label, value, Icon }) => <div key={label} className="flex items-center gap-4 rounded-3xl border border-white/5 bg-[#0a0a0c] p-5"><div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-400"><Icon size={22}/></div><div><p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</p><p className="text-2xl font-black text-white">{value}</p></div></div>)}
    </div>
    <div className="overflow-hidden rounded-3xl border border-white/5 bg-[#050505]">
      <div className="flex items-center justify-between border-b border-white/5 p-6"><div><h3 className="font-black text-white">Clientes</h3><p className="text-xs text-gray-500">Indicadores baseados no histórico registrado.</p></div><button onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white"><Plus size={14}/> Novo cliente</button></div>
      {loading ? <div className="flex h-56 items-center justify-center"><Loader2 className="animate-spin text-indigo-400"/></div> : customers.length === 0 ? <div className="flex h-56 flex-col items-center justify-center text-gray-500"><Users/><p className="mt-3 text-sm">Nenhum cliente cadastrado.</p></div> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-500"><th className="p-4">Cliente</th><th className="p-4">Indicador</th><th className="p-4">Gasto registrado</th><th className="p-4">Sugestão</th><th/></tr></thead><tbody>{customers.map((customer) => { const indicator = customerIndicator(customer); return <tr key={customer.id} className="border-b border-white/5"><td className="p-4"><p className="font-bold text-white">{customer.name}</p><p className="text-xs text-gray-500">{customer.phone || customer.email || 'Sem contato informado'}</p></td><td className={`p-4 text-xs font-bold ${indicator.tone}`}>{indicator.label}</td><td className="p-4 font-bold text-white">{formatCurrency(customer.total_spent)}</td><td className="p-4 text-xs text-gray-300">{indicator.action}</td><td className="p-4"><button onClick={() => void remove(customer.id)} aria-label="Remover cliente" className="text-gray-600 hover:text-rose-400"><Trash2 size={16}/></button></td></tr> })}</tbody></table></div>}
    </div>
    <AnimatePresence>{modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/70" onClick={() => setModalOpen(false)}/><motion.form onSubmit={submit} className="relative z-10 w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-[#0a0a0c] p-6"><div className="flex justify-between"><h3 className="font-bold text-white">Novo cliente</h3><button type="button" onClick={() => setModalOpen(false)}><X/></button></div><input required value={form.name} onChange={(e) => setForm({...form,name:e.target.value})} placeholder="Nome" className="w-full rounded-xl border border-white/10 bg-black p-3 text-white"/><input value={form.phone} onChange={(e) => setForm({...form,phone:e.target.value})} placeholder="Telefone (opcional)" className="w-full rounded-xl border border-white/10 bg-black p-3 text-white"/><input type="email" value={form.email} onChange={(e) => setForm({...form,email:e.target.value})} placeholder="E-mail (opcional)" className="w-full rounded-xl border border-white/10 bg-black p-3 text-white"/><button disabled={submitting} className="w-full rounded-xl bg-indigo-600 p-3 font-bold text-white disabled:opacity-50">{submitting ? 'Salvando…' : 'Salvar cliente'}</button></motion.form></div>}</AnimatePresence>
  </motion.div>
}
