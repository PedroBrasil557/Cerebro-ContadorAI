'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { CreditCard, Landmark, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { financeService } from '@/services/financeService'
import { personalAccountsService, type PersonalAccount } from '@/services/personalAccountsService'
import type { CreditCard as CreditCardRecord, Transaction } from '@/types_db'
import UpgradeModal from '@/core/components/UpgradeModal'
import { useEntitlements } from '@/core/hooks/useEntitlements'
import { Button } from '@/core/ui/button'
import { Input } from '@/core/ui/input'
import { Modal } from '@/core/ui/Modal'
import { FinancialMetricCard } from '@/core/finance-ui/FinancialMetricCard'
import { CerebroAICard } from '@/core/finance-ui/CerebroAICard'

interface CardUI extends CreditCardRecord { current_invoice: number }
const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export function transactionBelongsToCard(transaction: Transaction, card: CreditCardRecord) {
  if (transaction.card_id) return transaction.card_id === card.id
  return transaction.payment_method === card.name
}

export default function WalletView() {
  const [loading, setLoading] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [cards, setCards] = useState<CardUI[]>([])
  const [accounts, setAccounts] = useState<PersonalAccount[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isAddCardOpen, setIsAddCardOpen] = useState(false)
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aiLimitStrategy, setAiLimitStrategy] = useState<string | null>(null)
  const [generatingStrategy, setGeneratingStrategy] = useState(false)
  const { plan: userPlan } = useEntitlements()
  const isFreePlan = userPlan !== 'pro' && userPlan !== 'premium'

  const loadData = async () => {
    setLoading(true)
    try {
      const [dbCards, dbTrans, dbAccounts] = await Promise.all([
        financeService.getCards(), financeService.getTransactions(), personalAccountsService.getAccounts(),
      ])
      const now = new Date()
      setCards(dbCards.map((card) => ({
        ...card,
        current_invoice: dbTrans
          .filter((transaction) => {
            const date = new Date(transaction.date)
            return transactionBelongsToCard(transaction, card)
              && date.getMonth() === now.getMonth()
              && date.getFullYear() === now.getFullYear()
              && transaction.type !== 'receita'
          })
          .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount || 0)), 0),
      })) as CardUI[])
      setTransactions(dbTrans)
      setAccounts(dbAccounts)
    } catch { toast.error('Não foi possível carregar a carteira.') }
    finally { setLoading(false) }
  }

  useEffect(() => { void loadData() }, [])

  const handleAddAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true)
    const form = new FormData(event.currentTarget)
    try {
      await personalAccountsService.createAccount({ name: String(form.get('accountName') ?? ''), balance: Number(form.get('balance')) })
      toast.success('Conta adicionada.'); setIsAddAccountOpen(false); await loadData()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível adicionar a conta.') }
    finally { setSaving(false) }
  }

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Remover esta conta acompanhada?')) return
    try { await personalAccountsService.deleteAccount(id); toast.success('Conta removida.'); await loadData() }
    catch { toast.error('Não foi possível remover a conta.') }
  }

  const handleAddCard = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true)
    const form = new FormData(event.currentTarget)
    try {
      await financeService.createCard({
        name: String(form.get('institution') ?? ''), brand: String(form.get('brand') ?? ''), last_4_digits: String(form.get('last4') ?? ''),
        limit_amount: Number(form.get('limit')), due_day: Number(form.get('due_day')), closing_day: Number(form.get('closing_day')),
        color_start: '#6366f1', color_end: '#3b82f6',
      })
      toast.success('Cartão adicionado.'); setIsAddCardOpen(false); await loadData()
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message.includes('FREE_RESOURCE_LIMIT_REACHED')) setShowUpgradeModal(true)
      else toast.error('Não foi possível salvar o cartão.')
    } finally { setSaving(false) }
  }

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este cartão?')) return
    try { await financeService.deleteCard(id); toast.success('Cartão removido.'); await loadData() }
    catch { toast.error('Não foi possível remover o cartão.') }
  }

  const handleGenerateLimitStrategy = async () => {
    if (isFreePlan) { setShowUpgradeModal(true); return }
    if (!cards.length) { toast.error('Adicione um cartão primeiro.'); return }
    setGeneratingStrategy(true)
    try {
      const response = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Como posso planejar o uso dos meus limites de cartão com responsabilidade?' }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Falha ao consultar a IA.')
      setAiLimitStrategy(data.response)
    } catch { toast.error('Não foi possível gerar a análise agora.') }
    finally { setGeneratingStrategy(false) }
  }

  const accountTotal = useMemo(() => accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0), [accounts])
  const creditSummary = useMemo(() => {
    const totalLimit = cards.reduce((sum, card) => sum + Number(card.limit_amount), 0)
    const totalUsed = cards.reduce((sum, card) => sum + Number(card.current_invoice), 0)
    return { totalLimit, totalUsed, available: totalLimit - totalUsed, usagePercent: totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0 }
  }, [cards])
  const categoryData = useMemo(() => {
    const now = new Date()
    const grouped = transactions.filter((transaction) => {
      const date = new Date(transaction.date)
      return transaction.type !== 'receita' && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).reduce<Record<string, number>>((acc, transaction) => {
      const category = transaction.category || 'Outros'
      acc[category] = (acc[category] || 0) + Math.abs(Number(transaction.amount || 0)); return acc
    }, {})
    return Object.entries(grouped).sort(([, a], [, b]) => b - a).slice(0, 5)
  }, [transactions])

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 aria-label="Carregando carteira" className="h-7 w-7 animate-spin text-[var(--color-action-primary)]" /></div>

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-6 p-4 md:p-6 xl:p-8">
      <header><h1 className="text-[28px] font-bold leading-9 tracking-[-0.5px]">Carteira</h1><p className="mt-1 text-sm text-[var(--color-text-secondary)]">Acompanhe contas informadas manualmente e cartões cadastrados.</p></header>

      <section className="space-y-4" aria-labelledby="accounts-title">
        <div className="flex items-center justify-between gap-3"><div><h2 id="accounts-title" className="text-lg font-semibold">Contas</h2><p className="mt-1 text-xs text-[var(--color-text-helper)]">Saldos informados por você. Não há sincronização bancária automática.</p></div><Button variant="secondary" className="gap-2" onClick={() => setIsAddAccountOpen(true)}><Plus className="h-4 w-4" />Adicionar conta</Button></div>
        <div className="grid gap-4 md:grid-cols-3">
          <FinancialMetricCard label="Saldo informado nas contas" value={formatCurrency(accountTotal)} helper={`${accounts.length} ${accounts.length === 1 ? 'conta acompanhada' : 'contas acompanhadas'}`} />
          {accounts.slice(0, 2).map((account) => <article key={account.id} className="rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-5"><div className="flex justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-status-info-surface)] text-[var(--color-status-info)]"><Landmark className="h-4 w-4" /></span><Button variant="ghost" size="icon-sm" aria-label={`Remover ${account.name}`} onClick={() => void handleDeleteAccount(account.id)}><Trash2 className="h-4 w-4" /></Button></div><p className="mt-4 text-sm font-medium">{account.name}</p><p className="mt-1 text-xl font-semibold tabular-nums">{formatCurrency(Number(account.balance))}</p><p className="mt-1 text-xs text-[var(--color-text-helper)]">Saldo manual</p></article>)}
        </div>
        {accounts.length > 2 ? <div className="grid gap-3 md:grid-cols-2">{accounts.slice(2).map((account) => <div key={account.id} className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-4"><div><p className="text-sm font-medium">{account.name}</p><p className="mt-1 text-xs text-[var(--color-text-helper)]">{formatCurrency(Number(account.balance))}</p></div><Button variant="ghost" size="icon-sm" aria-label={`Remover ${account.name}`} onClick={() => void handleDeleteAccount(account.id)}><Trash2 className="h-4 w-4" /></Button></div>)}</div> : null}
      </section>

      <section className="space-y-4" aria-labelledby="cards-title">
        <div className="flex items-center justify-between gap-3"><div><h2 id="cards-title" className="text-lg font-semibold">Cartões</h2><p className="mt-1 text-xs text-[var(--color-text-helper)]">Uso calculado pelas transações vinculadas a cada cartão.</p></div><Button className="gap-2" onClick={() => setIsAddCardOpen(true)}><Plus className="h-4 w-4" />Adicionar cartão</Button></div>
        <div className="grid gap-4 md:grid-cols-3"><FinancialMetricCard label="Limite total" value={formatCurrency(creditSummary.totalLimit)} helper={`${cards.length} ${cards.length === 1 ? 'cartão' : 'cartões'}`} /><FinancialMetricCard label="Uso no mês" value={formatCurrency(creditSummary.totalUsed)} helper={`${creditSummary.usagePercent.toFixed(0)}% do limite total`} tone={creditSummary.usagePercent > 80 ? 'negative' : 'neutral'} /><FinancialMetricCard label="Limite disponível" value={formatCurrency(creditSummary.available)} helper="limite cadastrado menos uso do mês" tone="positive" /></div>
        {cards.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cards.map((card) => { const usage = Number(card.limit_amount) > 0 ? Math.min((card.current_invoice / Number(card.limit_amount)) * 100, 100) : 0; return <article key={card.id} className="rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-5"><div className="flex justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-card-accent-fill)] text-[var(--color-nav-active-text)]"><CreditCard className="h-5 w-5" /></span><Button variant="ghost" size="icon-sm" aria-label={`Remover ${card.name}`} onClick={() => void handleDeleteCard(card.id)}><Trash2 className="h-4 w-4" /></Button></div><h3 className="mt-4 font-semibold">{card.name}</h3><p className="mt-1 text-xs text-[var(--color-text-helper)]">{card.brand} · •••• {card.last_4_digits || card.last_digits || '0000'}</p><div className="mt-5 flex items-end justify-between"><div><p className="text-xs text-[var(--color-text-helper)]">Uso no mês</p><p className="mt-1 text-lg font-semibold">{formatCurrency(card.current_invoice)}</p></div><p className="text-xs text-[var(--color-text-helper)]">{usage.toFixed(0)}%</p></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-progress-track)]"><div className="h-full rounded-full bg-[var(--color-progress-active)]" style={{ width: `${usage}%` }} /></div><p className="mt-3 text-xs text-[var(--color-text-helper)]">Limite {formatCurrency(Number(card.limit_amount))} · vence dia {card.due_day}</p></article> })}</div> : <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-card-border)] p-8 text-center"><CreditCard className="mx-auto h-6 w-6 text-[var(--color-text-helper)]" /><p className="mt-3 text-sm font-medium">Nenhum cartão cadastrado</p></div>}
      </section>

      <section className="grid gap-5 lg:grid-cols-2"><article className="rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-5"><h2 className="text-base font-semibold">Principais categorias do mês</h2><div className="mt-4 space-y-3">{categoryData.length ? categoryData.map(([category, value]) => <div key={category} className="flex justify-between text-sm"><span className="text-[var(--color-text-secondary)]">{category}</span><strong className="font-medium">{formatCurrency(value)}</strong></div>) : <p className="text-sm text-[var(--color-text-helper)]">Sem despesas registradas neste mês.</p>}</div></article><CerebroAICard title={isFreePlan ? 'Análise de limites disponível no PRO' : 'Quer revisar o uso dos seus limites?'} description={aiLimitStrategy ?? (isFreePlan ? 'O Cérebro pode contextualizar o uso dos cartões a partir das movimentações registradas.' : 'Peça uma análise educativa antes de decidir ajustes ou solicitar novos limites.')} actionLabel={generatingStrategy ? 'Analisando…' : isFreePlan ? 'Conhecer PRO' : 'Analisar limites'} onAction={() => isFreePlan ? setShowUpgradeModal(true) : void handleGenerateLimitStrategy()} /></section>

      <Modal isOpen={isAddAccountOpen} onClose={() => !saving && setIsAddAccountOpen(false)} title="Adicionar conta"><p className="-mt-3 mb-5 text-sm text-[var(--color-text-secondary)]">Informe manualmente a conta e o saldo atual. Isso não conecta o Cérebro ao seu banco.</p><form onSubmit={handleAddAccount} className="space-y-4"><label className="block space-y-1.5 text-xs font-medium"><span>Nome da conta</span><Input name="accountName" required placeholder="Ex.: Conta principal" /></label><label className="block space-y-1.5 text-xs font-medium"><span>Saldo informado</span><Input name="balance" type="number" step="0.01" required placeholder="0,00" /></label><div className="flex justify-end gap-2"><Button type="button" variant="secondary" disabled={saving} onClick={() => setIsAddAccountOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Adicionar conta'}</Button></div></form></Modal>
      <Modal isOpen={isAddCardOpen} onClose={() => !saving && setIsAddCardOpen(false)} title="Adicionar cartão"><form onSubmit={handleAddCard} className="space-y-4"><label className="block space-y-1.5 text-xs font-medium"><span>Nome / instituição</span><Input name="institution" required placeholder="Ex.: Nubank" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 text-xs font-medium"><span>Bandeira</span><Input name="brand" required placeholder="Ex.: Mastercard" /></label><label className="space-y-1.5 text-xs font-medium"><span>Últimos 4 dígitos</span><Input name="last4" inputMode="numeric" maxLength={4} required placeholder="1234" /></label></div><label className="block space-y-1.5 text-xs font-medium"><span>Limite</span><Input name="limit" type="number" step="0.01" min="0" required /></label><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 text-xs font-medium"><span>Dia de fechamento</span><Input name="closing_day" type="number" min="1" max="31" required /></label><label className="space-y-1.5 text-xs font-medium"><span>Dia de vencimento</span><Input name="due_day" type="number" min="1" max="31" required /></label></div><div className="flex justify-end gap-2"><Button type="button" variant="secondary" disabled={saving} onClick={() => setIsAddCardOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Adicionar cartão'}</Button></div></form></Modal>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  )
}
