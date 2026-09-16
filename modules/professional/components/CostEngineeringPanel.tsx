'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Package,
  Plus,
  Sliders,
  Trash2,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { businessFinanceService } from '@/services/businessFinanceService'
import { formatCurrency } from '@/lib/utils'
import type { BusinessCostItem, Transaction } from '@/types_db'

const initialForm = {
  name: '',
  category: 'Matéria-prima',
  purchase_price: '',
  quantity: '',
  estimated_yield: '',
}
export default function CostEngineeringPanel() {
  const [items, setItems] = useState<BusinessCostItem[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [salePrice, setSalePrice] = useState(120)
  const [form, setForm] = useState(initialForm)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await businessFinanceService.getDashboardData()
      setItems(data.costs)
      setTransactions(data.transactions)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível carregar os custos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const pricing = useMemo(() => {
    const revenueEntries = transactions.filter((item) => item.type === 'receita')
    const fixedCosts = transactions
      .filter((item) => item.type === 'despesa_fixa')
      .reduce((sum, item) => sum + Math.abs(Number(item.amount) || 0), 0)
    const itemsWithoutYield = items.filter((item) => item.cost_per_use === null || item.cost_per_use === undefined)
    const costPerUse = items.reduce((sum, item) => sum + Math.max(Number(item.cost_per_use) || 0, 0), 0)
    const fixedAllocation = revenueEntries.length > 0 ? fixedCosts / revenueEntries.length : null
    const hasReliableBase = items.length > 0 && itemsWithoutYield.length === 0 && fixedAllocation !== null
    const estimatedCost = hasReliableBase ? costPerUse + fixedAllocation : null
    const estimatedResult = estimatedCost === null ? null : salePrice - estimatedCost
    const estimatedMargin = salePrice > 0 && estimatedResult !== null
      ? (estimatedResult / salePrice) * 100
      : null

    return {
      revenueEntryCount: revenueEntries.length,
      fixedCosts,
      fixedAllocation,
      costPerUse,
      itemsWithoutYield: itemsWithoutYield.length,
      estimatedCost,
      estimatedResult,
      estimatedMargin,
    }
  }, [items, salePrice, transactions])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await businessFinanceService.createCostItem({
        name: form.name,
        category: form.category,
        purchase_price: Number(form.purchase_price),
        quantity: form.quantity ? Number(form.quantity) : null,
        estimated_yield: form.estimated_yield ? Number(form.estimated_yield) : null,
      })
      setModalOpen(false)
      setForm(initialForm)
      await load()
      toast.success('Item de custo salvo.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o item.')
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (id: string) => {
    try {
      await businessFinanceService.deleteCostItem(id)
      await load()
    } catch {
      toast.error('Não foi possível remover o item.')
    }
  }

  const marginTone = pricing.estimatedMargin === null
    ? 'border-gray-500/20 bg-gray-500/10 text-gray-300'
    : pricing.estimatedMargin >= 40
      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
      : pricing.estimatedMargin >= 20
        ? 'border-amber-500/20 bg-amber-500/10 text-amber-200'
        : 'border-rose-500/20 bg-rose-500/10 text-rose-200'

  return (
    <div className="relative h-full">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 xl:grid-cols-2">
        <section className="flex min-h-[600px] flex-col overflow-hidden rounded-3xl border border-white/5 bg-[#0a0a0c] p-6 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-2.5 text-indigo-400"><Package size={20} /></div>
              <div>
                <h3 className="text-lg font-black text-white">Estrutura de custos</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Custos por uso e custos fixos registrados</p>
              </div>
            </div>
            <button type="button" onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700">
              <Plus size={14} /> Novo item
            </button>
          </div>

          <div className="mb-6 flex-1 space-y-3 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-indigo-400" /></div>
            ) : items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/5 p-6 text-center text-gray-500">
                <Package size={32} className="mb-3" />
                <p className="text-sm font-bold text-gray-400">Nenhum custo por uso cadastrado</p>
                <p className="mt-1 text-xs">Ex.: matéria-prima, embalagem, licença, deslocamento ou insumo.</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="group flex items-center justify-between rounded-2xl border border-white/5 bg-[#050505] p-4 hover:border-white/10">
                  <div>
                    <p className="font-bold text-white">{item.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                      {item.category} · compra {formatCurrency(item.purchase_price)}
                      {item.estimated_yield ? ` · base ${item.estimated_yield} usos` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-right text-sm font-black text-indigo-300">
                      {item.cost_per_use == null ? 'Rendimento não informado' : `${formatCurrency(item.cost_per_use)} / uso`}
                    </p>
                    <button type="button" aria-label={`Remover ${item.name}`} onClick={() => void remove(item.id)} className="text-gray-600 opacity-0 transition group-hover:opacity-100 hover:text-rose-400">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}

            <div className="flex items-center justify-between rounded-2xl border border-dashed border-white/5 bg-white/[0.02] p-4">
              <div>
                <p className="text-sm font-bold text-gray-400">Rateio de custos fixos</p>
                <p className="text-[10px] text-gray-600">
                  {pricing.revenueEntryCount > 0
                    ? `${formatCurrency(pricing.fixedCosts)} divididos por ${pricing.revenueEntryCount} lançamentos de receita observados`
                    : 'Sem lançamentos de receita para formar uma base de rateio'}
                </p>
              </div>
              <p className="text-sm font-black text-gray-300">
                {pricing.fixedAllocation === null ? 'Dados insuficientes' : formatCurrency(pricing.fixedAllocation)}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Custos por uso</p>
              <p className="mt-1 text-xl font-black text-white">{formatCurrency(pricing.costPerUse)}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Rateio fixo</p>
              <p className="mt-1 text-xl font-black text-white">{pricing.fixedAllocation === null ? '—' : formatCurrency(pricing.fixedAllocation)}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Custo estimado</p>
              <p className="mt-1 text-xl font-black text-white">{pricing.estimatedCost === null ? 'Dados insuficientes' : formatCurrency(pricing.estimatedCost)}</p>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-[600px] flex-col overflow-hidden rounded-3xl border border-white/5 bg-[#050505] p-6 shadow-inner">
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-2.5 text-blue-400"><Sliders size={20} /></div>
            <div>
              <h3 className="text-lg font-black text-white">Simulador de preço</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Estimativa baseada nos dados registrados</p>
            </div>
          </div>

          <label className="mb-8 block">
            <span className="mb-3 flex items-end justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Preço informado</span>
              <span className="text-3xl font-black text-white">{formatCurrency(salePrice)}</span>
            </span>
            <input type="range" min="0" max="5000" step="5" value={salePrice} onChange={(event) => setSalePrice(Number(event.target.value))} className="w-full accent-blue-500" />
          </label>

          <div className="grid flex-1 grid-cols-2 gap-4">
            <div className={`flex flex-col items-center justify-center rounded-2xl border p-5 text-center ${marginTone}`}>
              <p className="text-[10px] font-black uppercase tracking-widest">Margem estimada</p>
              <p className="mt-2 text-4xl font-black">{pricing.estimatedMargin === null ? '—' : `${pricing.estimatedMargin.toFixed(1)}%`}</p>
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#0a0a0c] p-5 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Resultado estimado</p>
              <p className={`mt-2 text-3xl font-black ${(pricing.estimatedResult ?? 0) >= 0 ? 'text-white' : 'text-rose-400'}`}>
                {pricing.estimatedResult === null ? 'Dados insuficientes' : formatCurrency(pricing.estimatedResult)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs leading-relaxed text-amber-100">
            {pricing.estimatedCost === null ? <AlertTriangle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
            <p>
              {pricing.estimatedCost === null
                ? `Dados insuficientes para calcular: ${items.length === 0 ? 'cadastre custos por uso; ' : ''}${pricing.itemsWithoutYield > 0 ? 'informe o rendimento dos itens; ' : ''}${pricing.revenueEntryCount === 0 ? 'registre receitas para formar a base de rateio.' : ''}`
                : 'A estimativa considera custos por uso e rateio dos custos fixos registrados. Tributos não foram assumidos e outros gastos podem alterar o resultado.'}
            </p>
          </div>
        </section>
      </motion.div>

      <AnimatePresence>
        {modalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
            <motion.form onSubmit={submit} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="relative z-10 w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-[#0a0a0c] p-6">
              <div className="flex items-center justify-between">
                <div><h3 className="font-bold text-white">Novo item de custo</h3><p className="text-xs text-gray-500">Use categorias adequadas ao seu negócio.</p></div>
                <button type="button" onClick={() => setModalOpen(false)} aria-label="Fechar"><X /></button>
              </div>
              <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nome, ex.: embalagem" className="w-full rounded-xl border border-white/10 bg-black p-3 text-white" />
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="w-full rounded-xl border border-white/10 bg-black p-3 text-white">
                <option>Matéria-prima</option>
                <option>Embalagem</option>
                <option>Licença</option>
                <option>Deslocamento</option>
                <option>Insumo</option>
                <option>Geral</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" min="0" step="0.01" value={form.purchase_price} onChange={(event) => setForm({ ...form, purchase_price: event.target.value })} placeholder="Preço de compra" className="rounded-xl border border-white/10 bg-black p-3 text-white" />
                <input type="number" min="0" step="0.01" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} placeholder="Quantidade (opcional)" className="rounded-xl border border-white/10 bg-black p-3 text-white" />
              </div>
              <input type="number" min="0.01" step="0.01" value={form.estimated_yield} onChange={(event) => setForm({ ...form, estimated_yield: event.target.value })} placeholder="Rendimento estimado em usos (opcional)" className="w-full rounded-xl border border-white/10 bg-black p-3 text-white" />
              <button disabled={submitting} className="w-full rounded-xl bg-indigo-600 p-3 font-bold text-white disabled:opacity-50">
                {submitting ? 'Salvando…' : 'Salvar item'}
              </button>
            </motion.form>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
