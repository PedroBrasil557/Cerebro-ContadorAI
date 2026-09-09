'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCart, Plus, ScanLine, Sparkles, TrendingUp, 
  CheckCircle2, Trash2, Tag, Camera, Activity, Wallet, BrainCircuit, Loader2, Pencil, Image as ImageIcon, Download, RefreshCcw
} from 'lucide-react'
import { toast } from 'sonner'
import { shoppingService } from '@/services/shoppingService'

// --- TIPAGENS ---
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

  // ============================================================================
  // 💾 FETCH INICIAL
  // ============================================================================
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
        console.error("Erro ao carregar compras")
        toast.error("Erro ao carregar dados.")
      } finally {
        setIsLoading(false)
      }
    }
    loadShoppingData()
  }, [])

  // ============================================================================
  // 📷 OCR REFINADO (BLINDADO)
  // ============================================================================
  const handleOCRTrigger = () => {
    fileInputRef.current?.click()
  }

  const handleOCRUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file || !session) return
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
          toast.error("Envie uma imagem JPG, PNG ou WEBP de até 5 MB.")
          if (fileInputRef.current) fileInputRef.current.value = ''
          return
      }
      setIsScanning(true)
      toast.info("Processando cupom fiscal...")
      try {
          const formData = new FormData()
          formData.set('file', file)
          const response = await fetch('/api/ocr', { method: 'POST', body: formData })
          const result = await response.json() as {
            items?: Array<{ name: string; price: number }>
            requiresManualReview?: boolean
            error?: { message?: string }
          }
          if (!response.ok) throw new Error(result.error?.message || 'Falha ao processar imagem.')

          const extractedItems = result.items ?? []
          if (extractedItems.length === 0) {
              toast.warning(result.requiresManualReview
                ? "Cupom ilegível. Revise e insira os itens manualmente."
                : "Nenhum produto foi identificado.")
              return
          }
          const totalCupom = extractedItems.reduce((acc, item) => acc + item.price, 0)
          try {
              const storagePath = await shoppingService.uploadReceiptImage(file, session.id)
              await shoppingService.saveReceiptRecord(session.id, storagePath, totalCupom)
              const dbReceipts = await shoppingService.getReceipts(session.id)
              setReceipts(dbReceipts || [])
          } catch (e) { console.error("Erro storage:", e) }

          for (const extItem of extractedItems) {
              const existingItem = items.find(i => i.name.toLowerCase().includes(extItem.name.toLowerCase().substring(0, 5)))
              if (existingItem) {
                  await shoppingService.updateItem(existingItem.id, { actual_price: extItem.price, is_purchased: true })
              } else {
                  await shoppingService.addItem({
                      session_id: session.id, name: extItem.name, category: 'Lido pelo OCR',
                      estimated_price: extItem.price, actual_price: extItem.price, is_essential: true, is_purchased: true, price_variation_pct: 0
                  })
              }
          }
          const dbItems = await shoppingService.getItems(session.id)
          setItems(dbItems || [])
          toast.success(`OCR Concluído!`)
      } catch {
          toast.error("Erro ao processar imagem.")
      } finally {
          setIsScanning(false)
          if (fileInputRef.current) fileInputRef.current.value = ''
      }
  }

  // ============================================================================
  // 🕹️ HANDLERS GERAIS
  // ============================================================================
  const handleUncheckAll = async () => {
    if (!window.confirm("Deseja desmarcar todos os itens?")) return
    const updatedItems = items.map(i => ({ ...i, is_purchased: false, actual_price: null }))
    setItems(updatedItems)
    try {
        await Promise.all(items.map(item => shoppingService.updateItem(item.id, { is_purchased: false, actual_price: null })))
        toast.success("Lista resetada para nova compra!")
    } catch { toast.error("Erro ao resetar.") }
  }

  const handleDeleteReceipt = async (receiptId: string) => {
    if (!window.confirm("Deseja remover este cupom do arquivo?")) return
    try {
        await shoppingService.deleteReceipt(receiptId)
        setReceipts(receipts.filter(r => r.id !== receiptId))
        toast.success("Cupom removido.")
    } catch { toast.error("Erro ao remover cupom.") }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !newItemName.trim() || !newEstimatedPrice) return
    const estimatedValue = parseFloat(newEstimatedPrice.replace(',', '.'))
    try {
        const savedItem = await shoppingService.addItem({ session_id: session.id, name: newItemName, category: 'Geral', estimated_price: estimatedValue, is_essential: true, is_purchased: false, price_variation_pct: 0 })
        setItems([savedItem, ...items]); setNewItemName(''); setNewEstimatedPrice('')
    } catch { toast.error("Erro ao salvar item.") }
  }

  const togglePurchased = async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    const isNowPurchased = !item.is_purchased
    const newActualPrice = isNowPurchased && !item.actual_price ? item.estimated_price : item.actual_price
    setItems(items.map(i => i.id === id ? { ...i, is_purchased: isNowPurchased, actual_price: newActualPrice } : i))
    try { await shoppingService.updateItem(id, { is_purchased: isNowPurchased, actual_price: newActualPrice }) } catch { toast.error("Erro ao atualizar status.") }
  }

  const handleUpdateActualPrice = async (id: string, value: string) => {
    const numValue = parseFloat(value.replace(',', '.'))
    if (isNaN(numValue)) return
    try { await shoppingService.updateItem(id, { actual_price: numValue }) } catch { toast.error("Erro ao salvar preço.") }
  }

  const saveEditingItem = async (id: string) => {
    if (!editingItemName.trim()) { setEditingItemId(null); return }
    setItems(items.map(i => i.id === id ? { ...i, name: editingItemName } : i))
    setEditingItemId(null)
    try { await shoppingService.updateItem(id, { name: editingItemName }) } catch { toast.error("Erro ao renomear.") }
  }

  const handleDeleteItem = async (id: string) => {
    setItems(items.filter(i => i.id !== id))
    try { await shoppingService.deleteItem(id) } catch { toast.error("Erro ao remover.") }
  }

  const handleClearList = async () => {
    if (!window.confirm("Deseja apagar todos os itens desta lista?")) return
    const itemsToDelete = [...items]; setItems([])
    try {
        await Promise.all(itemsToDelete.map(item => shoppingService.deleteItem(item.id)))
        toast.success("Lista limpa.")
    } catch { toast.error("Erro ao limpar lista.") }
  }

  const handleSaveBudget = async () => {
    if (!session) return
    const newBudget = parseFloat(budgetInput.replace(',', '.'))
    if (isNaN(newBudget) || newBudget <= 0) return
    try {
        await shoppingService.updateBudget(session.id, newBudget)
        setSession({ ...session, estimated_total: newBudget })
        toast.success("Orçamento atualizado!")
    } finally { setIsEditingBudget(false) }
  }

  // ============================================================================
  // 🧠 CÁLCULOS
  // ============================================================================
  const budget = session?.estimated_total || 1500
  const totals = useMemo(() => {
    const estimatedTotal = items.reduce((acc, item) => acc + Number(item.estimated_price), 0)
    const actualTotal = items.reduce((acc, item) => acc + Number(item.actual_price || 0), 0)
    const remainingBudget = budget - actualTotal
    const potentialSavings = items.filter(i => !i.is_essential && !i.is_purchased).reduce((acc, i) => acc + Number(i.estimated_price), 0)
    return { estimatedTotal, actualTotal, remainingBudget, potentialSavings }
  }, [items, budget])

  const insights = useMemo(() => {
    const generated = []
    const highInflationItems = items.filter(i => i.is_purchased && i.price_variation_pct > 15)
    if (highInflationItems.length > 0) generated.push({ id: 'i1', type: 'alert', title: 'Inflação Detectada', message: `O item '${highInflationItems[0].name}' subiu consideravelmente.`, icon: TrendingUp, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' })
    if (totals.potentialSavings > 0) generated.push({ id: 'i2', type: 'optimization', title: 'Economia Potencial', message: `Pode poupar ${formatCurrency(totals.potentialSavings)} se cortar os supérfluos.`, icon: Sparkles, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' })
    return generated
  }, [items, totals])

  if (isLoading) return <div className="h-full w-full flex items-center justify-center text-gray-500"><Loader2 className="animate-spin" size={32} /></div>

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 animate-in fade-in duration-500 pb-32 max-w-7xl mx-auto">
      <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" ref={fileInputRef} onChange={handleOCRUpload} className="hidden" />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
            <div className="flex items-center gap-3 mb-2 text-indigo-400 font-bold uppercase tracking-widest text-xs">
                <ShoppingCart size={14} /> Sistema Operacional de Consumo
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">Compras do Mês</h1>
            <p className="text-gray-400 mt-1 text-sm font-medium">Controle de supermercado com auditoria fiscal.</p>
        </div>
        {/* BOTÃO ESCANEAR - BLINDADO */}
        <button onClick={handleOCRTrigger} disabled={isScanning} className="group flex items-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl">
          {isScanning ? <Loader2 className="text-indigo-400 animate-spin" size={16} /> : <ScanLine size={16} className="text-indigo-400" />}
          {isScanning ? 'A LER...' : 'ESCANEAR CUPÃO FISCAL'}
        </button>
      </div>

      {/* MÉTRICAS */}
      <div className="bg-[#09090b] border border-white/5 rounded-3xl p-6 md:p-8 mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Gasto Real (Caixa)</p>
                <h2 className="text-4xl font-black text-white">{formatCurrency(totals.actualTotal)}</h2>
                <p className="text-[10px] font-bold text-emerald-400 mt-2 flex items-center gap-1"><CheckCircle2 size={12}/> Confirmado no cupom</p>
            </div>
            <div className="md:border-l md:border-white/5 pl-0 md:pl-8">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Estimado</p>
                <h2 className="text-4xl font-black text-gray-300">{formatCurrency(totals.estimatedTotal)}</h2>
                <p className="text-[10px] font-bold text-indigo-400 mt-2 flex items-center gap-1"><Activity size={12}/> Projeção atual</p>
            </div>
            <div className="md:border-l md:border-white/5 pl-0 md:pl-8">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Orçamento Limite</p>
                {isEditingBudget ? (
                    <div className="flex items-center gap-2 mt-1"><span className="text-gray-500 font-bold">R$</span><input type="number" autoFocus value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} onBlur={handleSaveBudget} onKeyDown={(e) => e.key === 'Enter' && handleSaveBudget()} className="bg-black border border-indigo-500/50 rounded-xl py-1 px-3 w-32 text-white text-2xl font-black outline-none" /></div>
                ) : (
                    <div className="group flex items-center gap-3 cursor-pointer mt-1" onClick={() => { setBudgetInput(budget.toString()); setIsEditingBudget(true); }}>
                        <h2 className="text-4xl font-black text-gray-300 group-hover:text-white transition-colors">{formatCurrency(budget)}</h2><Pencil size={18} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                )}
                <p className={`text-[10px] font-bold mt-2 flex items-center gap-1 ${totals.remainingBudget < 200 ? 'text-rose-400' : 'text-gray-500'}`}><Wallet size={12}/> Restam {formatCurrency(totals.remainingBudget)}</p>
            </div>
          </div>
          <div className="mt-8">
              <div className="flex justify-between text-xs font-bold mb-2"><span className="text-indigo-400">Progresso de Compra</span><span className="text-gray-500">{((totals.actualTotal / budget) * 100).toFixed(0)}% do Orçamento</span></div>
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(totals.actualTotal / budget) * 100}%` }} className={`h-full ${totals.actualTotal > budget ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-600 to-blue-500'}`} />
                  <motion.div initial={{ width: 0 }} animate={{ width: `${((totals.estimatedTotal - totals.actualTotal) / budget) * 100}%` }} className="h-full bg-white/10" />
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LISTA DE ITENS */}
          <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleAddItem} className="flex flex-col md:flex-row gap-2">
                  <div className="flex-[2] relative"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Plus size={18} className="text-gray-500" /></div><input type="text" required value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Novo item..." className="w-full bg-[#09090b] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none" /></div>
                  <div className="flex-1 relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">R$</span><input type="number" step="0.01" required value={newEstimatedPrice} onChange={(e) => setNewEstimatedPrice(e.target.value)} placeholder="Preço" className="w-full bg-[#09090b] border border-white/10 rounded-2xl py-4 pl-8 pr-4 text-sm text-white outline-none" /></div>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-2xl font-bold text-sm transition-colors shadow-lg">Inserir</button>
              </form>

              <div className="bg-[#09090b] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                  <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                      <h3 className="font-bold text-sm text-gray-300 uppercase tracking-widest flex items-center gap-2"><Tag size={14}/> Lista de Itens ({items.length})</h3>
                      <div className="flex gap-4">
                        {items.length > 0 && (
                            <>
                              <button onClick={handleUncheckAll} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase flex items-center gap-1 transition-colors">
                                  <RefreshCcw size={12} /> Desmarcar Todos
                              </button>
                              <button onClick={handleClearList} className="text-xs text-rose-500 hover:text-rose-400 font-bold uppercase flex items-center gap-1 transition-colors">
                                  <Trash2 size={12} /> Limpar Lista
                              </button>
                            </>
                        )}
                      </div>
                  </div>
                  <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
                      <AnimatePresence>
                          {items.length === 0 && <div className="p-8 text-center text-gray-500">A lista está vazia.</div>}
                          {items.map((item) => (
                              <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`p-4 flex items-center gap-4 group hover:bg-white/[0.02] ${item.is_purchased ? 'opacity-60 bg-black/20' : ''}`}>
                                  <button onClick={() => togglePurchased(item.id)} className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 ${item.is_purchased ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-600'}`}>{item.is_purchased && <CheckCircle2 size={14} />}</button>
                                  <div className="flex-1 min-w-0">
                                      {editingItemId === item.id ? <input autoFocus type="text" value={editingItemName} onChange={(e) => setEditingItemName(e.target.value)} onBlur={() => saveEditingItem(item.id)} onKeyDown={(e) => e.key === 'Enter' && saveEditingItem(item.id)} className="bg-black border border-indigo-500/50 rounded-lg py-1 px-2 text-white text-sm outline-none w-full" /> : <p className={`text-sm font-bold truncate ${item.is_purchased ? 'line-through text-gray-500' : 'text-white'}`}>{item.name}</p>}
                                      <p className="text-[10px] text-gray-500 mt-0.5 uppercase font-bold tracking-wider">Estimado: {formatCurrency(item.estimated_price)}</p>
                                  </div>
                                  <div className="w-24 shrink-0 relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">R$</span>
                                      <input type="number" placeholder="0,00" value={item.actual_price || ''} onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, actual_price: Number(e.target.value)} : i))} onBlur={(e) => handleUpdateActualPrice(item.id, e.target.value)} className={`w-full bg-black border rounded-xl py-2 pl-8 pr-2 text-right text-sm font-bold outline-none ${item.is_purchased ? 'text-white border-indigo-500/30' : 'text-gray-400 border-white/10'}`} />
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => { setEditingItemId(item.id); setEditingItemName(item.name); }} className="p-2 text-gray-600 hover:text-indigo-400"><Pencil size={14} /></button>
                                      <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-gray-600 hover:text-rose-400"><Trash2 size={16} /></button>
                                  </div>
                              </motion.div>
                          ))}
                      </AnimatePresence>
                  </div>
              </div>
          </div>

          {/* LATERAL DIREITA - BLINDADA */}
          <div className="space-y-6">
              {/* IA COGNITIVA COM BLUR */}
              <div className="relative group">
                <div className="bg-[#09090b] border border-white/5 rounded-3xl p-6 shadow-2xl transition-all duration-500">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5"><div className="h-10 w-10 bg-indigo-600/20 text-indigo-400 rounded-xl flex items-center justify-center"><BrainCircuit size={20} /></div><div><h3 className="font-bold text-white">IA Cognitiva</h3><p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Análise Mensal</p></div></div>
                    <div className="space-y-4">
                        {insights.map(insight => (
                            <div key={insight.id} className={`p-4 rounded-2xl border ${insight.border} ${insight.bg}`}>
                                <div className="flex items-center gap-2 mb-1"><insight.icon size={16} className={insight.color} /><h4 className={`text-xs font-bold uppercase tracking-wider ${insight.color}`}>{insight.title}</h4></div>
                                <p className="text-sm text-gray-300 leading-relaxed">{insight.message}</p>
                            </div>
                        ))}
                        {insights.length === 0 && <p className="text-xs text-gray-500 text-center py-4 italic">Dados insuficientes para insights.</p>}
                    </div>
                </div>
              </div>

              {/* ARQUIVO FISCO */}
              <div className="bg-[#09090b] border border-white/5 rounded-3xl p-6 shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-sm text-white uppercase tracking-widest flex items-center gap-2"><ImageIcon size={14} className="text-indigo-400"/> Arquivo Fisco</h3>
                      <span className="text-[10px] text-gray-500 font-bold">{receipts.length} Cupons</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {receipts.length === 0 && <p className="text-xs text-gray-600 text-center py-4">Arquivo vazio.</p>}
                      {receipts.slice(0, 10).map((receipt) => (
                          <div key={receipt.id} className="flex justify-between items-center bg-white/[0.03] p-3 rounded-xl hover:bg-white/[0.06] transition-colors group">
                              <div><p className="text-xs font-bold text-white">{new Date(receipt.created_at).toLocaleDateString('pt-BR')}</p><p className="text-[10px] text-emerald-400 font-bold">Lido: {formatCurrency(receipt.extracted_total)}</p></div>
                              <div className="flex items-center gap-1">
                                  <button disabled={!receipt.image_url} onClick={() => receipt.image_url && window.open(receipt.image_url, '_blank')} className="p-2 text-gray-400 hover:text-indigo-400 transition-colors disabled:opacity-40" title="Download"><Download size={14} /></button>
                                  <button onClick={() => handleDeleteReceipt(receipt.id)} className="p-2 text-gray-400 hover:text-rose-400 transition-colors" title="Excluir"><Trash2 size={14} /></button>
                              </div>
                          </div>
                      ))}
                  </div>
                  <button onClick={handleOCRTrigger} disabled={isScanning} className="mt-4 w-full bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex justify-center items-center gap-2">
                      {isScanning ? <Loader2 size={14} className="animate-spin text-indigo-400"/> : <Camera size={14} className="text-indigo-400"/>}
                      {isScanning ? 'LENDO...' : 'ADICIONAR CUPOM'}
                  </button>
              </div>
          </div>
      </div>

    </div>
  )
}
