'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, Plus, ScanLine, Sparkles, TrendingUp,
  CheckCircle2, Trash2, Tag, Camera, Activity, Wallet, BrainCircuit, Loader2, Pencil, Image as ImageIcon, Download, RefreshCcw
} from 'lucide-react'
import { toast } from 'sonner'
import { shoppingService } from '@/services/shoppingService'
import { findExactShoppingItem } from '@/core/finance/shopping'

interface ShoppingItem {
  id: string
  session_id: string
  name: string
  category: string
  estimated_price: number
  actual_price: number | null
  is_essential: boolean
  is_purchased: boolean
  price_variation_pct: number
}

interface ReceiptItem {
  id: string
  image_url?: string | null
  storage_path?: string | null
  extracted_total: number
  created_at: string
}

interface ShoppingSession {
  id: string
  estimated_total: number
  actual_total: number
}

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

export default function SmartShoppingView() {
  const [isLoading, setIsLoading] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [session, setSession] = useState<ShoppingSession | null>(null)
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [receipts, setReceipts] = useState<ReceiptItem[]>([])

  const [newItemName, setNewItemName] = useState('')
  const [newEstimatedPrice, setNewEstimatedPrice] = useState('')

  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')

  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItemName, setEditingItemName] = useState<string>('')

  useEffect(() => {
    async function loadShoppingData() {
      try {
        const currentSession = await shoppingService.getCurrentSession()
        setSession(currentSession)
        const dbItems = await shoppingService.getItems(currentSession.id)
        setItems(dbItems || [])
        const dbReceipts = await shoppingService.getReceipts(currentSession.id)
        setReceipts(dbReceipts || [])
      } catch {
        console.error('Erro ao carregar compras')
        toast.error('Erro ao carregar dados.')
      } finally {
        setIsLoading(false)
      }
    }
    void loadShoppingData()
  }, [])

  const handleOCRTrigger = () => {
    fileInputRef.current?.click()
  }

  const handleOCRUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !session) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size <= 0 || file.size > 5 * 1024 * 1024) {
      toast.error('Envie uma imagem JPG, PNG ou WEBP de até 5 MB.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setIsScanning(true)
    toast.info('Processando cupom fiscal...')
    try {
      const formData = new FormData()
      formData.set('file', file)
      const response = await fetch('/api/ocr', { method: 'POST', body: formData })
      const result = await response.json() as {
        items?: Array<{ name: string; price: number }>
        detectedItems?: number
        confidence?: number
        requiresManualReview?: boolean
        error?: { message?: string }
      }
      if (!response.ok) throw new Error(result.error?.message || 'Falha ao processar imagem.')

      if (result.requiresManualReview) {
        toast.warning(result.detectedItems
          ? `Leitura insegura (${result.detectedItems} itens detectados). Nenhuma alteração foi aplicada; revise e insira manualmente.`
          : 'Cupom ilegível. Nenhuma alteração foi aplicada; revise e insira manualmente.')
        return
      }

      const extractedItems = result.items ?? []
      if (extractedItems.length === 0) {
        toast.warning('Nenhum produto foi identificado. Nenhuma alteração foi aplicada.')
        return
      }

      const totalCupom = extractedItems.reduce((acc, item) => acc + item.price, 0)
      const preview = extractedItems
        .slice(0, 10)
        .map((item) => `• ${item.name}: ${formatCurrency(item.price)}`)
        .join('\n')
      const remainingLabel = extractedItems.length > 10 ? `\n• +${extractedItems.length - 10} item(ns)` : ''
      const confirmed = window.confirm(
        `Revise a leitura antes de aplicar:\n\n${preview}${remainingLabel}\n\nTotal detectado: ${formatCurrency(totalCupom)}\n\nConfirmar e aplicar estes dados?`
      )
      if (!confirmed) {
        toast.info('Importação cancelada. Nenhuma alteração foi aplicada.')
        return
      }

      let storagePath: string | null = null
      try {
        storagePath = await shoppingService.uploadReceiptImage(file, session.id)
        await shoppingService.saveReceiptRecord(session.id, storagePath, totalCupom, result.confidence ?? 0)
        const dbReceipts = await shoppingService.getReceipts(session.id)
        setReceipts(dbReceipts || [])
      } catch (error) {
        if (storagePath) {
          try { await shoppingService.removeReceiptImage(session.id, storagePath) } catch { /* limpeza best-effort */ }
        }
        throw error
      }

      for (const extItem of extractedItems) {
        const existingItem = findExactShoppingItem(items, extItem.name)
        if (existingItem) {
          await shoppingService.updateItem(existingItem.id, { actual_price: extItem.price, is_purchased: true })
        } else {
          await shoppingService.addItem({
            session_id: session.id,
            name: extItem.name,
            category: 'Lido pelo OCR',
            estimated_price: extItem.price,
            actual_price: extItem.price,
            is_essential: true,
            is_purchased: true,
            price_variation_pct: 0,
          })
        }
      }
      const dbItems = await shoppingService.getItems(session.id)
      setItems(dbItems || [])
      toast.success('OCR Concluído!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao processar imagem.')
    } finally {
      setIsScanning(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleUncheckAll = async () => {
    if (!window.confirm('Deseja desmarcar todos os itens?')) return
    const updatedItems = items.map(i => ({ ...i, is_purchased: false, actual_price: null }))
    setItems(updatedItems)
    try {
      await Promise.all(items.map(item => shoppingService.updateItem(item.id, { is_purchased: false, actual_price: null })))
      toast.success('Lista resetada para nova compra!')
    } catch { toast.error('Erro ao resetar.') }
  }

  const handleDeleteReceipt = async (receiptId: string) => {
    if (!window.confirm('Deseja remover este cupom do arquivo?')) return
    try {
      await shoppingService.deleteReceipt(receiptId)
      setReceipts(receipts.filter(r => r.id !== receiptId))
      toast.success('Cupom removido.')
    } catch { toast.error('Erro ao remover cupom.') }
  }

  const handleAddItem = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!session || !newItemName.trim() || !newEstimatedPrice) return
    const estimatedValue = parseFloat(newEstimatedPrice.replace(',', '.'))
    try {
      const savedItem = await shoppingService.addItem({ session_id: session.id, name: newItemName, category: 'Geral', estimated_price: estimatedValue, is_essential: true, is_purchased: false, price_variation_pct: 0 })
      setItems([savedItem, ...items])
      setNewItemName('')
      setNewEstimatedPrice('')
    } catch { toast.error('Erro ao salvar item.') }
  }

  const togglePurchased = async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    const isNowPurchased = !item.is_purchased
    const newActualPrice = isNowPurchased && !item.actual_price ? item.estimated_price : item.actual_price
    setItems(items.map(i => i.id === id ? { ...i, is_purchased: isNowPurchased, actual_price: newActualPrice } : i))
    try { await shoppingService.updateItem(id, { is_purchased: isNowPurchased, actual_price: newActualPrice }) } catch { toast.error('Erro ao atualizar status.') }
  }

  const handleUpdateActualPrice = async (id: string, value: string) => {
    const numValue = parseFloat(value.replace(',', '.'))
    if (Number.isNaN(numValue)) return
    try { await shoppingService.updateItem(id, { actual_price: numValue }) } catch { toast.error('Erro ao salvar preço.') }
  }

  const saveEditingItem = async (id: string) => {
    if (!editingItemName.trim()) { setEditingItemId(null); return }
    setItems(items.map(i => i.id === id ? { ...i, name: editingItemName } : i))
    setEditingItemId(null)
    try { await shoppingService.updateItem(id, { name: editingItemName }) } catch { toast.error('Erro ao renomear.') }
  }

  const handleDeleteItem = async (id: string) => {
    setItems(items.filter(i => i.id !== id))
    try { await shoppingService.deleteItem(id) } catch { toast.error('Erro ao remover.') }
  }

  const handleClearList = async () => {
    if (!window.confirm('Deseja apagar todos os itens desta lista?')) return
    const itemsToDelete = [...items]
    setItems([])
    try {
      await Promise.all(itemsToDelete.map(item => shoppingService.deleteItem(item.id)))
      toast.success('Lista limpa.')
    } catch { toast.error('Erro ao limpar lista.') }
  }

  const handleSaveBudget = async () => {
    if (!session) return
    const newBudget = parseFloat(budgetInput.replace(',', '.'))
    if (Number.isNaN(newBudget) || newBudget <= 0) return
    try {
      await shoppingService.updateBudget(session.id, newBudget)
      setSession({ ...session, estimated_total: newBudget })
      toast.success('Orçamento atualizado!')
    } finally { setIsEditingBudget(false) }
  }

  const budget = session?.estimated_total ?? 0
  const totals = useMemo(() => {
    const estimatedTotal = items.reduce((acc, item) => acc + Number(item.estimated_price), 0)
    const actualTotal = items.reduce((acc, item) => acc + Number(item.actual_price || 0), 0)
    const remainingBudget = budget - actualTotal
    const potentialSavings = items.filter(i => !i.is_essential && !i.is_purchased).reduce((acc, item) => acc + Number(item.estimated_price), 0)
    return { estimatedTotal, actualTotal, remainingBudget, potentialSavings }
  }, [items, budget])

  const purchaseProgressPct = budget > 0 ? (totals.actualTotal / budget) * 100 : 0
  const actualProgressWidth = Math.min(Math.max(purchaseProgressPct, 0), 100)
  const estimatedRemainingPct = budget > 0
    ? (Math.max(totals.estimatedTotal - totals.actualTotal, 0) / budget) * 100
    : 0
  const estimatedProgressWidth = Math.min(
    Math.max(estimatedRemainingPct, 0),
    Math.max(100 - actualProgressWidth, 0)
  )

  const insights = useMemo(() => {
    const generated = []
    const highInflationItems = items.filter(i => i.is_purchased && i.price_variation_pct > 15)
    if (highInflationItems.length > 0) generated.push({ id: 'i1', type: 'alert', title: 'Inflação Detectada', message: `O item '${highInflationItems[0].name}' subiu consideravelmente.`, icon: TrendingUp, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' })
    if (totals.potentialSavings > 0) generated.push({ id: 'i2', type: 'optimization', title: 'Economia Potencial', message: `Pode poupar ${formatCurrency(totals.potentialSavings)} se cortar os supérfluos.`, icon: Sparkles, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' })
    return generated
  }, [items, totals])

  if (isLoading) return <div className="flex h-full w-full items-center justify-center text-[var(--color-text-helper)]"><Loader2 className="animate-spin" size={32} /></div>

  return (
    <div className="mx-auto min-h-screen max-w-7xl animate-in fade-in space-y-8 bg-[var(--color-bg-canvas)] p-4 pb-32 text-[var(--color-text-primary)] duration-500 md:p-8">
      <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" ref={fileInputRef} onChange={handleOCRUpload} className="hidden" />

      <header className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-[var(--color-action-ai)]">
            <ShoppingCart size={14} /> Sistema Operacional de Consumo
          </div>
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight">Compras do Mês</h1>
          <p className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">Controle de supermercado com auditoria fiscal.</p>
        </div>
        <button onClick={handleOCRTrigger} disabled={isScanning} className="group flex items-center gap-3 rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-bg-elevated)] px-6 py-3.5 text-xs font-black uppercase tracking-widest text-[var(--color-text-primary)] shadow-[var(--shadow-surface)] transition-all hover:-translate-y-px hover:border-[var(--color-card-accent-border)] hover:bg-[var(--color-action-ghost-hover)] disabled:opacity-60">
          {isScanning ? <Loader2 className="animate-spin text-[var(--color-action-ai)]" size={16} /> : <ScanLine size={16} className="text-[var(--color-action-ai)]" />}
          {isScanning ? 'A LER...' : 'ESCANEAR CUPÃO FISCAL'}
        </button>
      </header>

      <section className="relative overflow-hidden rounded-3xl border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-6 shadow-[var(--shadow-surface)] md:p-8" aria-label="Resumo de compras">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-indigo-600/5 blur-3xl" />
        <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[var(--color-text-helper)]">Gasto Real (Caixa)</p>
            <h2 className="text-4xl font-black">{formatCurrency(totals.actualTotal)}</h2>
            <p className="mt-2 flex items-center gap-1 text-[10px] font-bold text-[var(--color-status-success)]"><CheckCircle2 size={12}/> Confirmado no cupom</p>
          </div>
          <div className="pl-0 md:border-l md:border-[var(--color-card-border)] md:pl-8">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[var(--color-text-helper)]">Total Estimado</p>
            <h2 className="text-4xl font-black text-[var(--color-text-secondary)]">{formatCurrency(totals.estimatedTotal)}</h2>
            <p className="mt-2 flex items-center gap-1 text-[10px] font-bold text-[var(--color-action-ai)]"><Activity size={12}/> Projeção atual</p>
          </div>
          <div className="pl-0 md:border-l md:border-[var(--color-card-border)] md:pl-8">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[var(--color-text-helper)]">Orçamento Limite</p>
            {isEditingBudget ? (
              <div className="mt-1 flex items-center gap-2"><span className="font-bold text-[var(--color-text-helper)]">R$</span><input type="number" autoFocus value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} onBlur={handleSaveBudget} onKeyDown={(e) => e.key === 'Enter' && handleSaveBudget()} className="w-32 rounded-xl border border-[var(--color-field-border-focus)] bg-[var(--color-field-fill)] px-3 py-1 text-2xl font-black text-[var(--color-text-primary)] outline-none" /></div>
            ) : (
              <button type="button" className="group mt-1 flex items-center gap-3 text-left" onClick={() => { setBudgetInput(budget.toString()); setIsEditingBudget(true) }}>
                <span className="text-4xl font-black text-[var(--color-text-secondary)] transition-colors group-hover:text-[var(--color-text-primary)]">{formatCurrency(budget)}</span><Pencil size={18} className="text-[var(--color-text-helper)] opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            )}
            <p className={`mt-2 flex items-center gap-1 text-[10px] font-bold ${totals.remainingBudget < 200 ? 'text-[var(--color-status-danger)]' : 'text-[var(--color-text-helper)]'}`}><Wallet size={12}/> Restam {formatCurrency(totals.remainingBudget)}</p>
          </div>
        </div>
        <div className="mt-8">
          <div className="mb-2 flex justify-between text-xs font-bold"><span className="text-[var(--color-action-ai)]">Progresso de Compra</span><span className="text-[var(--color-text-helper)]">{purchaseProgressPct.toFixed(0)}% do Orçamento</span></div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--color-progress-track)]">
            <motion.div initial={{ width: 0 }} animate={{ width: `${actualProgressWidth}%` }} className={`h-full ${totals.actualTotal > budget && budget > 0 ? 'bg-[var(--color-chart-negative)]' : 'bg-gradient-to-r from-indigo-600 to-blue-500'}`} />
            <motion.div initial={{ width: 0 }} animate={{ width: `${estimatedProgressWidth}%` }} className="h-full bg-[var(--color-chart-secondary)]/25" />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <form onSubmit={handleAddItem} className="flex flex-col gap-2 md:flex-row">
            <div className="relative flex-[2]"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><Plus size={18} className="text-[var(--color-text-helper)]" /></div><input type="text" required value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Novo item..." className="w-full rounded-2xl border border-[var(--color-field-border)] bg-[var(--color-field-fill)] py-4 pl-12 pr-4 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-field-border-focus)]" /></div>
            <div className="relative flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-text-helper)]">R$</span><input type="number" step="0.01" required value={newEstimatedPrice} onChange={(e) => setNewEstimatedPrice(e.target.value)} placeholder="Preço" className="w-full rounded-2xl border border-[var(--color-field-border)] bg-[var(--color-field-fill)] py-4 pl-8 pr-4 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-field-border-focus)]" /></div>
            <button type="submit" className="rounded-2xl bg-[var(--color-action-primary)] px-6 py-4 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[var(--color-action-primary-hover)]">Inserir</button>
          </form>

          <section className="overflow-hidden rounded-3xl border border-[var(--color-card-border)] bg-[var(--color-card-fill)] shadow-[var(--shadow-surface)]" aria-labelledby="shopping-list-title">
            <div className="flex items-center justify-between border-b border-[var(--color-card-border)] bg-[var(--color-bg-surface)] p-4">
              <h3 id="shopping-list-title" className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-text-secondary)]"><Tag size={14}/> Lista de Itens ({items.length})</h3>
              <div className="flex gap-4">
                {items.length > 0 && (
                  <>
                    <button type="button" onClick={handleUncheckAll} className="flex items-center gap-1 text-xs font-bold uppercase text-[var(--color-action-ai)] transition-colors hover:text-[var(--color-nav-active-text)]"><RefreshCcw size={12} /> Desmarcar Todos</button>
                    <button type="button" onClick={handleClearList} className="flex items-center gap-1 text-xs font-bold uppercase text-[var(--color-status-danger)] transition-opacity hover:opacity-80"><Trash2 size={12} /> Limpar Lista</button>
                  </>
                )}
              </div>
            </div>
            <div className="custom-scrollbar max-h-[600px] divide-y divide-[var(--color-card-border)] overflow-y-auto">
              <AnimatePresence>
                {items.length === 0 && <div className="p-8 text-center text-[var(--color-text-helper)]">A lista está vazia.</div>}
                {items.map((item) => (
                  <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`group flex items-center gap-4 p-4 transition-colors hover:bg-[var(--color-action-ghost-hover)] ${item.is_purchased ? 'bg-[var(--color-status-neutral-surface)]/45 opacity-70' : ''}`}>
                    <button type="button" onClick={() => togglePurchased(item.id)} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${item.is_purchased ? 'border-[var(--color-action-ai)] bg-[var(--color-action-ai)] text-white' : 'border-[var(--color-field-border-hover)] text-transparent'}`}>{item.is_purchased && <CheckCircle2 size={14} />}</button>
                    <div className="min-w-0 flex-1">
                      {editingItemId === item.id ? <input autoFocus type="text" value={editingItemName} onChange={(e) => setEditingItemName(e.target.value)} onBlur={() => saveEditingItem(item.id)} onKeyDown={(e) => e.key === 'Enter' && saveEditingItem(item.id)} className="w-full rounded-lg border border-[var(--color-field-border-focus)] bg-[var(--color-field-fill)] px-2 py-1 text-sm text-[var(--color-text-primary)] outline-none" /> : <p className={`truncate text-sm font-bold ${item.is_purchased ? 'line-through text-[var(--color-text-helper)]' : 'text-[var(--color-text-primary)]'}`}>{item.name}</p>}
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-helper)]">Estimado: {formatCurrency(item.estimated_price)}</p>
                    </div>
                    <div className="relative w-24 shrink-0">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-text-helper)]">R$</span>
                      <input type="number" placeholder="0,00" value={item.actual_price || ''} onChange={(e) => setItems(items.map(i => i.id === item.id ? { ...i, actual_price: Number(e.target.value) } : i))} onBlur={(e) => handleUpdateActualPrice(item.id, e.target.value)} className={`w-full rounded-xl border bg-[var(--color-field-fill)] py-2 pl-8 pr-2 text-right text-sm font-bold outline-none ${item.is_purchased ? 'border-[var(--color-card-accent-border)] text-[var(--color-text-primary)]' : 'border-[var(--color-field-border)] text-[var(--color-text-secondary)]'}`} />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button type="button" onClick={() => { setEditingItemId(item.id); setEditingItemName(item.name) }} className="p-2 text-[var(--color-text-helper)] hover:text-[var(--color-action-ai)]" aria-label={`Editar ${item.name}`}><Pencil size={14} /></button>
                      <button type="button" onClick={() => handleDeleteItem(item.id)} className="p-2 text-[var(--color-text-helper)] hover:text-[var(--color-status-danger)]" aria-label={`Remover ${item.name}`}><Trash2 size={16} /></button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        </div>

        <aside className="space-y-6" aria-label="Contexto de compras">
          <section className="rounded-3xl border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-6 shadow-[var(--shadow-surface)]">
            <div className="mb-6 flex items-center gap-3 border-b border-[var(--color-card-border)] pb-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-card-accent-fill)] text-[var(--color-action-ai)]"><BrainCircuit size={20} /></div><div><h3 className="font-bold">IA Cognitiva</h3><p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-helper)]">Análise Mensal</p></div></div>
            <div className="space-y-4">
              {insights.map(insight => (
                <div key={insight.id} className={`rounded-2xl border p-4 ${insight.border} ${insight.bg}`}>
                  <div className="mb-1 flex items-center gap-2"><insight.icon size={16} className={insight.color} /><h4 className={`text-xs font-bold uppercase tracking-wider ${insight.color}`}>{insight.title}</h4></div>
                  <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{insight.message}</p>
                </div>
              ))}
              {insights.length === 0 && <p className="py-4 text-center text-xs italic text-[var(--color-text-helper)]">Dados insuficientes para insights.</p>}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-6 shadow-[var(--shadow-surface)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest"><ImageIcon size={14} className="text-[var(--color-action-ai)]"/> Arquivo Fisco</h3>
              <span className="text-[10px] font-bold text-[var(--color-text-helper)]">{receipts.length} Cupons</span>
            </div>
            <div className="custom-scrollbar max-h-48 space-y-2 overflow-y-auto pr-1">
              {receipts.length === 0 && <p className="py-4 text-center text-xs text-[var(--color-text-helper)]">Arquivo vazio.</p>}
              {receipts.slice(0, 10).map((receipt) => (
                <div key={receipt.id} className="group flex items-center justify-between rounded-xl border border-transparent bg-[var(--color-action-ghost-hover)] p-3 transition-colors hover:border-[var(--color-card-border)]">
                  <div><p className="text-xs font-bold">{new Date(receipt.created_at).toLocaleDateString('pt-BR')}</p><p className="text-[10px] font-bold text-[var(--color-status-success)]">Lido: {formatCurrency(receipt.extracted_total)}</p></div>
                  <div className="flex items-center gap-1">
                    <button type="button" disabled={!receipt.image_url} onClick={() => receipt.image_url && window.open(receipt.image_url, '_blank')} className="p-2 text-[var(--color-text-helper)] transition-colors hover:text-[var(--color-action-ai)] disabled:opacity-40" title="Download"><Download size={14} /></button>
                    <button type="button" onClick={() => handleDeleteReceipt(receipt.id)} className="p-2 text-[var(--color-text-helper)] transition-colors hover:text-[var(--color-status-danger)]" title="Excluir"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={handleOCRTrigger} disabled={isScanning} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-bg-elevated)] px-4 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-action-ghost-hover)]">
              {isScanning ? <Loader2 size={14} className="animate-spin text-[var(--color-action-ai)]"/> : <Camera size={14} className="text-[var(--color-action-ai)]"/>}
              {isScanning ? 'LENDO...' : 'ADICIONAR CUPOM'}
            </button>
          </section>
        </aside>
      </div>
    </div>
  )
}
