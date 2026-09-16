'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Package, Plus, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { businessFinanceService } from '@/services/businessFinanceService'
import { formatCurrency } from '@/lib/utils'
import type { BusinessCostItem } from '@/types_db'

export default function CostEngineeringPanel() {
  const [items, setItems] = useState<BusinessCostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [salePrice, setSalePrice] = useState(0)
  const [form, setForm] = useState({ name: '', category: 'Geral', purchase_price: '', quantity: '', estimated_yield: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try { setItems((await businessFinanceService.getDashboardData()).costs) }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível carregar os custos.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  const costPerUse = useMemo(() => items.reduce((sum, item) => sum + Number(item.cost_per_use || 0), 0), [items])
  const result = salePrice - costPerUse
  const margin = salePrice > 0 ? (result / salePrice) * 100 : 0

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSubmitting(true)
    try {
      await businessFinanceService.createCostItem({ name: form.name, category: form.category, purchase_price: Number(form.purchase_price), quantity: form.quantity ? Number(form.quantity) : null, estimated_yield: form.estimated_yield ? Number(form.estimated_yield) : null })
      setModalOpen(false); setForm({ name: '', category: 'Geral', purchase_price: '', quantity: '', estimated_yield: '' }); await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o item.') }
    finally { setSubmitting(false) }
  }

  return <div className="grid gap-6 xl:grid-cols-2">
    <motion.section initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="rounded-3xl border border-white/5 bg-[#0a0a0c] p-6">
      <div className="mb-6 flex items-center justify-between"><div><h3 className="font-black text-white">Estrutura de custos</h3><p className="text-xs text-gray-500">Itens e custos por uso informado.</p></div><button onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white"><Plus size={14}/> Novo item</button></div>
      <div className="h-[420px] space-y-3 overflow-y-auto">{loading ? <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-indigo-400"/></div> : items.length === 0 ? <div className="flex h-full flex-col items-center justify-center text-gray-500"><Package/><p className="mt-3 text-sm">Nenhum custo cadastrado.</p><p className="text-xs">Ex.: embalagem, matéria-prima ou licença.</p></div> : items.map((item) => <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/30 p-4"><div><p className="font-bold text-white">{item.name}</p><p className="text-xs text-gray-500">{item.category} · compra {formatCurrency(item.purchase_price)}</p></div><div className="flex items-center gap-4"><p className="font-bold text-indigo-300">{item.cost_per_use == null ? 'Rendimento não informado' : `${formatCurrency(item.cost_per_use)} / uso`}</p><button aria-label="Remover custo" onClick={() => void businessFinanceService.deleteCostItem(item.id).then(load)} className="text-gray-600 hover:text-rose-400"><Trash2 size={15}/></button></div></div>)}</div>
    </motion.section>
    <section className="rounded-3xl border border-white/5 bg-[#050505] p-6"><h3 className="font-black text-white">Simulador de preço</h3><p className="text-xs text-gray-500">Estimativa simples com os custos por uso cadastrados.</p><div className="mt-14"><div className="mb-3 flex justify-between"><span className="text-xs uppercase tracking-widest text-gray-500">Preço de venda</span><strong className="text-3xl text-white">{formatCurrency(salePrice)}</strong></div><input className="w-full accent-indigo-500" type="range" min="0" max="1000" step="5" value={salePrice} onChange={(e) => setSalePrice(Number(e.target.value))}/></div><div className="mt-12 grid grid-cols-2 gap-4"><div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 text-center"><p className="text-xs text-gray-500">Margem estimada</p><p className="mt-2 text-4xl font-black text-white">{margin.toFixed(1)}%</p></div><div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 text-center"><p className="text-xs text-gray-500">Resultado por venda</p><p className="mt-2 text-3xl font-black text-white">{formatCurrency(result)}</p></div></div><p className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-100">Estimativa parcial: custos fixos, tributos e outros gastos não configurados não estão incluídos.</p></section>
    <AnimatePresence>{modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><motion.div className="absolute inset-0 bg-black/70" onClick={() => setModalOpen(false)}/><motion.form onSubmit={submit} className="relative z-10 w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-[#0a0a0c] p-6"><div className="flex justify-between"><h3 className="font-bold text-white">Novo item de custo</h3><button type="button" onClick={() => setModalOpen(false)}><X/></button></div>{(['name','category','purchase_price','quantity','estimated_yield'] as const).map((field) => <input key={field} required={field === 'name' || field === 'purchase_price'} type={field === 'name' || field === 'category' ? 'text' : 'number'} min="0" step="0.01" value={form[field]} onChange={(e) => setForm({...form,[field]:e.target.value})} placeholder={{name:'Nome',category:'Categoria',purchase_price:'Preço de compra',quantity:'Quantidade (opcional)',estimated_yield:'Rendimento estimado (opcional)'}[field]} className="w-full rounded-xl border border-white/10 bg-black p-3 text-white"/>)}<button disabled={submitting} className="w-full rounded-xl bg-indigo-600 p-3 font-bold text-white disabled:opacity-50">{submitting ? 'Salvando…' : 'Salvar item'}</button></motion.form></div>}</AnimatePresence>
  </div>
}
