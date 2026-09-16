'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Building2,
  Clock,
  Loader2,
  Plus,
  Star,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { businessFinanceService } from '@/services/businessFinanceService'
import { formatCurrency } from '@/lib/utils'
import type { BusinessCustomer } from '@/types_db'

type CustomerRule = {
  label: string
  action: string
  tone: string
  icon: typeof Star
  daysSinceInteraction: number | null
}

function customerIndicator(customer: BusinessCustomer): CustomerRule {
  if (!customer.last_interaction_at) {
    return {
      label: 'Sem histórico',
      action: 'Registrar a primeira interação',
      tone: 'border-gray-500/20 bg-gray-500/10 text-gray-400',
      icon: Clock,
      daysSinceInteraction: null,
    }
  }

  const timestamp = new Date(customer.last_interaction_at).getTime()
  const days = Number.isFinite(timestamp)
    ? Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000))
    : null

  if (days === null) {
    return {
      label: 'Data a revisar',
      action: 'Conferir o histórico informado',
      tone: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
      icon: AlertTriangle,
      daysSinceInteraction: null,
    }
  }
  if (days > 45) {
    return {
      label: 'Sem contato recente',
      action: 'Revisar o relacionamento',
      tone: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
      icon: AlertTriangle,
      daysSinceInteraction: days,
    }
  }
  if (days > 25) {
    return {
      label: 'Acompanhar',
      action: 'Considerar um novo contato',
      tone: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
      icon: Clock,
      daysSinceInteraction: days,
    }
  }
  if (Number(customer.total_spent) >= 1500) {
    return {
      label: 'Histórico relevante',
      action: 'Avaliar ações de fidelização',
      tone: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300',
      icon: Star,
      daysSinceInteraction: days,
    }
  }
  return {
    label: 'Recente',
    action: 'Manter o acompanhamento',
    tone: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    icon: TrendingUp,
    daysSinceInteraction: days,
  }
}

const initialForm: {
  name: string
  phone: string
  email: string
  customer_type: 'person' | 'company'
  total_spent: string
  interaction_count: string
  last_interaction_at: string
  notes: string
} = {
  name: '',
  phone: '',
  email: '',
  customer_type: 'person',
  total_spent: '',
  interaction_count: '',
  last_interaction_at: '',
  notes: '',
}

export default function FinancialCrmPanel() {
  const [customers, setCustomers] = useState<BusinessCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(initialForm)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await businessFinanceService.getDashboardData()
      setCustomers(data.customers)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível carregar os clientes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const averageSpent = useMemo(
    () => customers.length > 0
      ? customers.reduce((sum, item) => sum + Number(item.total_spent || 0), 0) / customers.length
      : 0,
    [customers],
  )
  const withoutRecentContact = useMemo(
    () => customers.filter((customer) => {
      const rule = customerIndicator(customer)
      return rule.label === 'Sem contato recente' || rule.label === 'Acompanhar'
    }).length,
    [customers],
  )

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await businessFinanceService.createCustomer({
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
        customer_type: form.customer_type,
        total_spent: form.total_spent ? Number(form.total_spent) : 0,
        interaction_count: form.interaction_count ? Number(form.interaction_count) : 0,
        last_interaction_at: form.last_interaction_at
          ? new Date(`${form.last_interaction_at}T12:00:00`).toISOString()
          : null,
        notes: form.notes || null,
      })
      setModalOpen(false)
      setForm(initialForm)
      await load()
      toast.success('Cliente salvo com o histórico informado.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível cadastrar o cliente.')
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (id: string) => {
    try {
      await businessFinanceService.deleteCustomer(id)
      await load()
    } catch {
      toast.error('Não foi possível remover o cliente.')
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Base cadastrada', value: `${customers.length} clientes`, Icon: Users, color: 'text-blue-400 bg-blue-500/10' },
          { label: 'Gasto médio acumulado', value: formatCurrency(averageSpent), Icon: TrendingUp, color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Para acompanhar', value: `${withoutRecentContact} clientes`, Icon: AlertTriangle, color: 'text-rose-400 bg-rose-500/10' },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="relative flex items-center gap-4 overflow-hidden rounded-3xl border border-white/5 bg-[#0a0a0c] p-5">
            <div className={`rounded-2xl p-3 ${color}`}><Icon size={24} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</p>
              <p className="text-2xl font-black text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="flex min-h-[440px] flex-1 flex-col overflow-hidden rounded-3xl border border-white/5 bg-[#050505] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] p-6">
          <div>
            <h3 className="text-lg font-black text-white">Histórico de clientes</h3>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Classificação determinística por recência e gasto registrado — não é análise por IA
            </p>
          </div>
          <button type="button" onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700">
            <Plus size={14} /> Registrar ou importar
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[260px] flex-1 items-center justify-center"><Loader2 className="animate-spin text-indigo-400" /></div>
        ) : customers.length === 0 ? (
          <div className="flex min-h-[260px] flex-1 flex-col items-center justify-center p-10 text-center text-gray-500">
            <Users size={34} className="mb-3" />
            <p className="text-sm font-bold text-gray-400">Nenhum cliente cadastrado</p>
            <p className="mt-1 text-xs">Registre clientes e, quando disponível, importe o histórico anterior.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/5 bg-[#0a0a0c] text-[10px] uppercase tracking-widest text-gray-500">
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Regra de acompanhamento</th>
                  <th className="p-4 text-right">Histórico financeiro</th>
                  <th className="p-4 text-center">Interações</th>
                  <th className="p-4">Sugestão</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {customers.map((customer) => {
                  const indicator = customerIndicator(customer)
                  const IndicatorIcon = indicator.icon
                  return (
                    <tr key={customer.id} className="group hover:bg-white/[0.02]">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-white/5 p-2 text-gray-400">
                            {customer.customer_type === 'company' ? <Building2 size={16} /> : <Users size={16} />}
                          </div>
                          <div>
                            <p className="font-bold text-white">{customer.name}</p>
                            <p className="text-[10px] text-gray-500">{customer.phone || customer.email || 'Contato não informado'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${indicator.tone}`}>
                          <IndicatorIcon size={12} /> {indicator.label}
                        </span>
                      </td>
                      <td className="p-4 text-right font-black text-white">{formatCurrency(customer.total_spent)}</td>
                      <td className="p-4 text-center">
                        <p className="text-sm font-bold text-white">{customer.interaction_count}</p>
                        <p className="text-[10px] text-gray-500">
                          {indicator.daysSinceInteraction === null ? 'data não informada' : `última há ${indicator.daysSinceInteraction} dias`}
                        </p>
                      </td>
                      <td className="p-4 text-xs text-gray-300">{indicator.action}</td>
                      <td className="p-4 text-right">
                        <button type="button" onClick={() => void remove(customer.id)} aria-label={`Remover ${customer.name}`} className="text-gray-600 opacity-0 transition group-hover:opacity-100 hover:text-rose-400">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AnimatePresence>
        {modalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
            <motion.form onSubmit={submit} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="relative z-10 max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-3xl border border-white/10 bg-[#0a0a0c] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white">Registrar ou importar cliente</h3>
                  <p className="text-xs text-gray-500">Os campos de histórico são opcionais.</p>
                </div>
                <button type="button" onClick={() => setModalOpen(false)} aria-label="Fechar"><X /></button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nome" className="rounded-xl border border-white/10 bg-black p-3 text-white md:col-span-2" />
                <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Telefone (opcional)" className="rounded-xl border border-white/10 bg-black p-3 text-white" />
                <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="E-mail (opcional)" className="rounded-xl border border-white/10 bg-black p-3 text-white" />
                <select value={form.customer_type} onChange={(event) => setForm({ ...form, customer_type: event.target.value as 'person' | 'company' })} className="rounded-xl border border-white/10 bg-black p-3 text-white">
                  <option value="person">Pessoa</option>
                  <option value="company">Empresa</option>
                </select>
                <input type="number" min="0" step="0.01" value={form.total_spent} onChange={(event) => setForm({ ...form, total_spent: event.target.value })} placeholder="Total comprado/gasto (opcional)" className="rounded-xl border border-white/10 bg-black p-3 text-white" />
                <input type="number" min="0" step="1" value={form.interaction_count} onChange={(event) => setForm({ ...form, interaction_count: event.target.value })} placeholder="Número de interações (opcional)" className="rounded-xl border border-white/10 bg-black p-3 text-white" />
                <label className="space-y-1 text-xs text-gray-500">
                  <span>Última interação (opcional)</span>
                  <input type="date" value={form.last_interaction_at} onChange={(event) => setForm({ ...form, last_interaction_at: event.target.value })} className="w-full rounded-xl border border-white/10 bg-black p-3 text-white [color-scheme:dark]" />
                </label>
                <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Observações (opcional)" rows={3} className="rounded-xl border border-white/10 bg-black p-3 text-white md:col-span-2" />
              </div>

              <button disabled={submitting} className="w-full rounded-xl bg-indigo-600 p-3 font-bold text-white disabled:opacity-50">
                {submitting ? 'Salvando…' : 'Salvar cliente'}
              </button>
            </motion.form>
          </div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}
