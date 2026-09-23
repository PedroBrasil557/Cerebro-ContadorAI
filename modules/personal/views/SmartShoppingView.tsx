'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  BrainCircuit,
  Camera,
  CheckCircle2,
  Download,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  ScanLine,
  ShoppingCart,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { shoppingService } from '@/services/shoppingService'
import { findExactShoppingItem } from '@/core/finance/shopping'
import { Button } from '@/core/ui/button'
import { Input } from '@/core/ui/input'

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

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(value)

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
  const [editingItemName, setEditingItemName] = useState('')

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

  const handleOCRTrigger = () => fileInputRef.current?.click()

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

      const totalCupom = extractedItems.reduce((sum, item) => sum + item.price, 0)
      const preview = extractedItems.slice(0, 10).map((item) => `• ${item.name}: ${formatCurrency(item.price)}`).join('\n')
      const remainingLabel = extractedItems.length > 10 ? `\n• +${extractedItems.length - 10} item(ns)` : ''
      const confirmed = window.confirm(
        `Revise a leitura antes de aplicar:\n\n${preview}${remainingLabel}\n\nTotal detectado: ${formatCurrency(totalCupom)}\n\nConfirmar e aplicar estes dados?`,
      )
      if (!confirmed) {
        toast.info('Importação cancelada. Nenhuma alteração foi aplicada.')
        return
      }

      let storagePath: string | null = null
      try {
        storagePath = await shoppingService.uploadReceiptImage(file, session.id)
        await shoppingService.saveReceiptRecord(session.id, storagePath, totalCupom, result.confidence ?? 0)
        setReceipts(await shoppingService.getReceipts(session.id) || [])
      } catch (error) {
        if (storagePath) {
          try { await shoppingService.removeReceiptImage(session.id, storagePath) } catch { /* best effort */ }
        }
        throw error
      }

      for (const extractedItem of extractedItems) {
        const existingItem = findExactShoppingItem(items, extractedItem.name)
        if (existingItem) {
          await shoppingService.updateItem(existingItem.id, { actual_price: extractedItem.price, is_purchased: true })
        } else {
          await shoppingService.addItem({
            session_id: session.id,
            name: extractedItem.name,
            category: 'Lido pelo OCR',
            estimated_price: extractedItem.price,
            actual_price: extractedItem.price,
            is_essential: true,
            is_purchased: true,
            price_variation_pct: 0,
          })
        }
      }
      setItems(await shoppingService.getItems(session.id) || [])
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
    setItems(items.map((item) => ({ ...item, is_purchased: false, actual_price: null })))
    try {
      await Promise.all(items.map((item) => shoppingService.updateItem(item.id, { is_purchased: false, actual_price: null })))
      toast.success('Lista resetada para nova compra!')
    } catch { toast.error('Erro ao resetar.') }
  }

  const handleDeleteReceipt = async (receiptId: string) => {
    if (!window.confirm('Deseja remover este cupom do arquivo?')) return
    try {
      await shoppingService.deleteReceipt(receiptId)
      setReceipts(receipts.filter((receipt) => receipt.id !== receiptId))
      toast.success('Cupom removido.')
    } catch { toast.error('Erro ao remover cupom.') }
  }

  const handleAddItem = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!session || !newItemName.trim() || !newEstimatedPrice) return
    const estimatedValue = Number.parseFloat(newEstimatedPrice.replace(',', '.'))
    try {
      const savedItem = await shoppingService.addItem({
        session_id: session.id,
        name: newItemName,
        category: 'Geral',
        estimated_price: estimatedValue,
        is_essential: true,
        is_purchased: false,
        price_variation_pct: 0,
      })
      setItems([savedItem, ...items])
      setNewItemName('')
      setNewEstimatedPrice('')
    } catch { toast.error('Erro ao salvar item.') }
  }

  const togglePurchased = async (id: string) => {
    const item = items.find((candidate) => candidate.id === id)
    if (!item) return
    const isNowPurchased = !item.is_purchased
    const newActualPrice = isNowPurchased && !item.actual_price ? item.estimated_price : item.actual_price
    setItems(items.map((candidate) => candidate.id === id ? { ...candidate, is_purchased: isNowPurchased, actual_price: newActualPrice } : candidate))
    try { await shoppingService.updateItem(id, { is_purchased: isNowPurchased, actual_price: newActualPrice }) }
    catch { toast.error('Erro ao atualizar status.') }
  }

  const handleUpdateActualPrice = async (id: string, value: string) => {
    const amount = Number.parseFloat(value.replace(',', '.'))
    if (Number.isNaN(amount)) return
    try { await shoppingService.updateItem(id, { actual_price: amount }) }
    catch { toast.error('Erro ao salvar preço.') }
  }

  const saveEditingItem = async (id: string) => {
    if (!editingItemName.trim()) {
      setEditingItemId(null)
      return
    }
    setItems(items.map((item) => item.id === id ? { ...item, name: editingItemName } : item))
    setEditingItemId(null)
    try { await shoppingService.updateItem(id, { name: editingItemName }) }
    catch { toast.error('Erro ao renomear.') }
  }

  const handleDeleteItem = async (id: string) => {
    setItems(items.filter((item) => item.id !== id))
    try { await shoppingService.deleteItem(id) }
    catch { toast.error('Erro ao remover.') }
  }

  const handleClearList = async () => {
    if (!window.confirm('Deseja apagar todos os itens desta lista?')) return
    const itemsToDelete = [...items]
    setItems([])
    try {
      await Promise.all(itemsToDelete.map((item) => shoppingService.deleteItem(item.id)))
      toast.success('Lista limpa.')
    } catch { toast.error('Erro ao limpar lista.') }
  }

  const handleSaveBudget = async () => {
    if (!session) return
    const newBudget = Number.parseFloat(budgetInput.replace(',', '.'))
    if (Number.isNaN(newBudget) || newBudget <= 0) return
    try {
      await shoppingService.updateBudget(session.id, newBudget)
      setSession({ ...session, estimated_total: newBudget })
      toast.success('Orçamento atualizado!')
    } finally {
      setIsEditingBudget(false)
    }
  }

  const budget = session?.estimated_total ?? 0
  const totals = useMemo(() => {
    const estimatedTotal = items.reduce((sum, item) => sum + Number(item.estimated_price), 0)
    const actualTotal = items.reduce((sum, item) => sum + Number(item.actual_price || 0), 0)
    const remainingBudget = budget - actualTotal
    const potentialSavings = items.filter((item) => !item.is_essential && !item.is_purchased).reduce((sum, item) => sum + Number(item.estimated_price), 0)
    return { estimatedTotal, actualTotal, remainingBudget, potentialSavings }
  }, [items, budget])

  const purchaseProgressPct = budget > 0 ? (totals.actualTotal / budget) * 100 : 0
  const actualProgressWidth = Math.min(Math.max(purchaseProgressPct, 0), 100)
  const estimatedRemainingPct = budget > 0 ? (Math.max(totals.estimatedTotal - totals.actualTotal, 0) / budget) * 100 : 0
  const estimatedProgressWidth = Math.min(Math.max(estimatedRemainingPct, 0), Math.max(100 - actualProgressWidth, 0))

  const insights = useMemo(() => {
    const generated: Array<{
      id: string
      title: string
      message: string
      icon: typeof TrendingUp
      color: string
      bg: string
      border: string
    }> = []
    const highInflationItems = items.filter((item) => item.is_purchased && item.price_variation_pct > 15)
    if (highInflationItems.length > 0) {
      generated.push({
        id: 'i1',
        title: 'Inflação Detectada',
        message: `O item '${highInflationItems[0].name}' subiu consideravelmente.`,
        icon: TrendingUp,
        color: 'text-[var(--color-status-danger)]',
        bg: 'bg-[var(--color-status-danger-surface)]',
        border: 'border-[var(--color-status-danger)]/25',
      })
    }
    if (totals.potentialSavings > 0) {
      generated.push({
        id: 'i2',
        title: 'Economia Potencial',
        message: `Pode poupar ${formatCurrency(totals.potentialSavings)} se cortar os supérfluos.`,
        icon: Sparkles,
        color: 'text-[var(--color-status-ai)]',
        bg: 'bg-[var(--color-status-ai-surface)]',
        border: 'border-[var(--color-card-accent-border)]',
      })
    }
    return generated
  }, [items, totals])

  if (isLoading) {
    return <div className="flex min-h-[50vh] w-full items-center justify-center text-[var(--color-text-helper)]"><Loader2 className="animate-spin" size={32} /></div>
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl animate-in space-y-8 bg-[var(--color-bg-canvas)] p-4 pb-32 text-[var(--color-text-primary)] fade-in duration-500 md:p-8">
      <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" ref={fileInputRef} onChange={handleOCRUpload} className="hidden" />

      <header className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-[var(--color-status-ai)]">
            <ShoppingCart size={14} /> Sistema Operacional de Consumo
          </div>
          <h1 className="text-3xl font-black tracking-tight">Compras do Mês</h1>
          <p className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">Controle de supermercado com auditoria fiscal.</p>
        </div>
        <Button type="button" variant="secondary" onClick={handleOCRTrigger} disabled={isScanning} className="gap-3 rounded-2xl px-6 py-3.5 shadow-[var(--shadow-card)]">
          {isScanning ? <Loader2 className="animate-spin text-[var(--color-action-ai)]" size={16} /> : <ScanLine size={16} className="text-[var(--color-action-ai)]" />}
          {isScanning ? 'A ler...' : 'Escanear cupom fiscal'}
        </Button>
      </header>

      <section className="relative overflow-hidden rounded-3xl border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-6 shadow-[var(--shadow-card)] md:p-8" aria-label="Resumo das compras">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-[var(--color-card-accent-fill)] opacity-55 blur-3xl" />
        <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[var(--color-text-helper)]">Gasto Real (Caixa)</p>
            <h2 className="text-4xl font-black">{formatCurrency(totals.actualTotal)}</h2>
            <p className="mt-2 flex items-center gap-1 text-[10px] font-bold text-[var(--color-status-success)]"><CheckCircle2 size={12}/> Confirmado no cupom</p>
          </div>
          <div className="md:border-l md:border-[var(--color-card-border)] md:pl-8">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[var(--color-text-helper)]">Total Estimado</p>
            <h2 className="text-4xl font-black text-[var(--color-text-primary)]">{formatCurrency(totals.estimatedTotal)}</h2>
            <p className="mt-2 flex items-center gap-1 text-[10px] font-bold text-[var(--color-status-ai)]"><Activity size={12}/> Projeção atual</p>
          </div>
          <div className="md:border-l md:border-[var(--color-card-border)] md:pl-8">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[var(--color-text-helper)]">Orçamento Limite</p>
            {isEditingBudget ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="font-bold text-[var(--color-text-helper)]">R$</span>
                <Input type="number" autoFocus value={budgetInput} onChange={(event) => setBudgetInput(event.target.value)} onBlur={handleSaveBudget} onKeyDown={(event) => event.key === 'Enter' && void handleSaveBudget()} className="w-36 text-2xl font-black" />
              </div>
            ) : (
              <button type="button" className="group mt-1 flex items-center gap-3 text-left" onClick={() => { setBudgetInput(budget.toString()); setIsEditingBudget(true) }}>
                <span className="text-4xl font-black">{formatCurrency(budget)}</span>
                <Pencil size={18} className="text-[var(--color-text-helper)] opacity-60 transition-opacity group-hover:opacity-100" />
              </button>
            )}
            <p className={`mt-2 flex items-center gap-1 text-[10px] font-bold ${totals.remainingBudget < 200 ? 'text-[var(--color-status-danger)]' : 'text-[var(--color-text-helper)]'}`}><Wallet size={12}/> Restam {formatCurrency(totals.remainingBudget)}</p>
          </div>
        </div>
        <div className="relative z-10 mt-8">
          <div className="mb-2 flex justify-between text-xs font-bold"><span className="text-[var(--color-action-ai)]">Progresso de Compra</span><span className="text-[var(--color-text-helper)]">{purchaseProgressPct.toFixed(0)}% do orçamento</span></div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--color-progress-track)]">
            <motion.div initial={{ width: 0 }} animate={{ width: `${actualProgressWidth}%` }} className={`h-full ${totals.actualTotal > budget && budget > 0 ? 'bg-[var(--color-status-danger)]' : 'bg-[var(--color-progress-active)]'}`} />
            <motion.div initial={{ width: 0 }} animate={{ width: `${estimatedProgressWidth}%` }} className="h-full bg-[var(--color-card-accent-border)] opacity-55" />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <form onSubmit={handleAddItem} className="flex flex-col gap-2 md:flex-row">
            <div className="relative flex-[2]"><Plus size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-helper)]"/><Input type="text" required value={newItemName} onChange={(event) => setNewItemName(event.target.value)} placeholder="Novo item..." className="h-13 rounded-2xl pl-12" /></div>
            <div className="relative flex-1"><span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-xs font-bold text-[var(--color-text-helper)]">R$</span><Input type="number" step="0.01" required value={newEstimatedPrice} onChange={(event) => setNewEstimatedPrice(event.target.value)} placeholder="Preço" className="h-13 rounded-2xl pl-8" /></div>
            <Button type="submit" className="h-13 rounded-2xl px-6">Inserir</Button>
          </form>

          <section className="overflow-hidden rounded-3xl border border-[var(--color-card-border)] bg-[var(--color-card-fill)] shadow-[var(--shadow-card)]" aria-labelledby="shopping-items-title">
            <div className="flex items-center justify-between border-b border-[var(--color-card-border)] bg-[var(--color-bg-elevated)] p-4">
              <h2 id="shopping-items-title" className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-text-secondary)]"><Tag size={14}/> Lista de Itens ({items.length})</h2>
              <div className="flex flex-wrap justify-end gap-3">
                {items.length > 0 ? (
                  <>
                    <button type="button" onClick={handleUncheckAll} className="flex items-center gap-1 text-[10px] font-bold uppercase text-[var(--color-action-ai)]"><RefreshCcw size={12}/> Desmarcar todos</button>
                    <button type="button" onClick={handleClearList} className="flex items-center gap-1 text-[10px] font-bold uppercase text-[var(--color-status-danger)]"><Trash2 size={12}/> Limpar lista</button>
                  </>
                ) : null}
              </div>
            </div>
            <div className="custom-scrollbar max-h-[600px] divide-y divide-[var(--color-card-border)] overflow-y-auto">
              <AnimatePresence>
                {items.length === 0 ? <div className="p-8 text-center text-[var(--color-text-helper)]">A lista está vazia.</div> : null}
                {items.map((item) => (
                  <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`group flex items-center gap-4 p-4 transition-colors hover:bg-[var(--color-action-ghost-hover)] ${item.is_purchased ? 'opacity-65 bg-[var(--color-bg-elevated)]' : ''}`}>
                    <button type="button" aria-label={item.is_purchased ? `Desmarcar ${item.name}` : `Marcar ${item.name} como comprado`} onClick={() => void togglePurchased(item.id)} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${item.is_purchased ? 'border-[var(--color-action-primary)] bg-[var(--color-action-primary)] text-white' : 'border-[var(--color-field-border)]'}`}>{item.is_purchased ? <CheckCircle2 size={14}/> : null}</button>
                    <div className="min-w-0 flex-1">
                      {editingItemId === item.id ? (
                        <Input autoFocus type="text" value={editingItemName} onChange={(event) => setEditingItemName(event.target.value)} onBlur={() => void saveEditingItem(item.id)} onKeyDown={(event) => event.key === 'Enter' && void saveEditingItem(item.id)} className="h-9" />
                      ) : (
                        <p className={`truncate text-sm font-bold ${item.is_purchased ? 'line-through text-[var(--color-text-helper)]' : 'text-[var(--color-text-primary)]'}`}>{item.name}</p>
                      )}
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-helper)]">Estimado: {formatCurrency(item.estimated_price)}</p>
                    </div>
                    <div className="relative w-28 shrink-0">
                      <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-xs font-bold text-[var(--color-text-helper)]">R$</span>
                      <Input type="number" placeholder="0,00" value={item.actual_price || ''} onChange={(event) => setItems(items.map((candidate) => candidate.id === item.id ? { ...candidate, actual_price: Number(event.target.value) } : candidate))} onBlur={(event) => void handleUpdateActualPrice(item.id, event.target.value)} className="h-10 pl-8 pr-2 text-right text-sm font-bold" />
                    </div>
                    <div className="flex items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                      <button type="button" aria-label={`Editar ${item.name}`} onClick={() => { setEditingItemId(item.id); setEditingItemName(item.name) }} className="p-2 text-[var(--color-text-helper)] hover:text-[var(--color-action-ai)]"><Pencil size={14}/></button>
                      <button type="button" aria-label={`Excluir ${item.name}`} onClick={() => void handleDeleteItem(item.id)} className="p-2 text-[var(--color-text-helper)] hover:text-[var(--color-status-danger)]"><Trash2 size={16}/></button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        </div>

        <aside className="space-y-6" aria-label="Contexto das compras">
          <section className="rounded-3xl border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-6 shadow-[var(--shadow-card)]">
            <div className="mb-6 flex items-center gap-3 border-b border-[var(--color-card-border)] pb-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-card-accent-fill)] text-[var(--color-action-ai)]"><BrainCircuit size={20}/></div><div><h2 className="font-bold">IA Cognitiva</h2><p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-helper)]">Análise Mensal</p></div></div>
            <div className="space-y-4">
              {insights.map((insight) => (
                <div key={insight.id} className={`rounded-2xl border p-4 ${insight.border} ${insight.bg}`}>
                  <div className="mb-1 flex items-center gap-2"><insight.icon size={16} className={insight.color}/><h3 className={`text-xs font-bold uppercase tracking-wider ${insight.color}`}>{insight.title}</h3></div>
                  <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{insight.message}</p>
                </div>
              ))}
              {insights.length === 0 ? <p className="py-4 text-center text-xs italic text-[var(--color-text-helper)]">Dados insuficientes para insights.</p> : null}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest"><ImageIcon size={14} className="text-[var(--color-action-ai)]"/> Arquivo Fisco</h2>
              <span className="text-[10px] font-bold text-[var(--color-text-helper)]">{receipts.length} Cupons</span>
            </div>
            <div className="custom-scrollbar max-h-48 space-y-2 overflow-y-auto pr-1">
              {receipts.length === 0 ? <p className="py-4 text-center text-xs text-[var(--color-text-helper)]">Arquivo vazio.</p> : null}
              {receipts.slice(0, 10).map((receipt) => (
                <div key={receipt.id} className="group flex items-center justify-between rounded-xl border border-[var(--color-card-border)] bg-[var(--color-bg-elevated)] p-3 transition-colors hover:bg-[var(--color-action-ghost-hover)]">
                  <div><p className="text-xs font-bold">{new Date(receipt.created_at).toLocaleDateString('pt-BR')}</p><p className="text-[10px] font-bold text-[var(--color-status-success)]">Lido: {formatCurrency(receipt.extracted_total)}</p></div>
                  <div className="flex items-center gap-1">
                    <button type="button" disabled={!receipt.image_url} onClick={() => receipt.image_url && window.open(receipt.image_url, '_blank')} className="p-2 text-[var(--color-text-helper)] transition-colors hover:text-[var(--color-action-ai)] disabled:opacity-40" title="Abrir cupom"><Download size={14}/></button>
                    <button type="button" onClick={() => void handleDeleteReceipt(receipt.id)} className="p-2 text-[var(--color-text-helper)] transition-colors hover:text-[var(--color-status-danger)]" title="Excluir"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="secondary" onClick={handleOCRTrigger} disabled={isScanning} className="mt-4 w-full gap-2 rounded-xl">
              {isScanning ? <Loader2 size={14} className="animate-spin text-[var(--color-action-ai)]"/> : <Camera size={14} className="text-[var(--color-action-ai)]"/>}
              {isScanning ? 'Lendo...' : 'Adicionar cupom'}
            </Button>
          </section>
        </aside>
      </div>
    </div>
  )
}
