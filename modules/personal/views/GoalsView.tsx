'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  ChevronRight,
  Flag,
  MoreHorizontal,
  Pencil,
  PiggyBank,
  Plus,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ActiveTab, Goal, NewGoal, Transaction } from '@/types_db'
import { buildGoalMetrics, type GoalMetrics } from '@/core/finance/goalMetrics'
import { goalsService, type GoalMovement, type GoalType } from '@/services/goalsService'
import { Button } from '@/core/ui/button'
import { Field } from '@/core/ui/field'
import { Input } from '@/core/ui/input'
import { Modal } from '@/core/ui/Modal'

type GoalsViewProps = {
  goals: Goal[]
  transactions: Transaction[]
  onAddGoal: (goal: NewGoal) => Promise<void> | void
  onAdjustGoal: (id: string, delta: number) => Promise<void>
  onUpdateGoal: (id: string, updates: Pick<Goal, 'title' | 'target_amount' | 'deadline'>) => Promise<void>
  onDeleteGoal: (id: string) => Promise<void>
  handleRedirect: (tab: ActiveTab) => void
}

type GoalAction = 'contribute' | 'withdraw' | 'edit' | 'delete'

type GoalWithType = Goal & { goal_type?: GoalType }
type GoalUpdateWithType = Pick<Goal, 'title' | 'target_amount' | 'deadline'> & { goal_type?: GoalType }

function brl(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function parseAmount(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function typeOfGoal(goal: Goal): GoalType {
  return (goal as GoalWithType).goal_type === 'emergency_fund' ? 'emergency_fund' : 'standard'
}

function goalState(goal: Goal): 'on-track' | 'at-risk' | 'completed' {
  if (Number(goal.current_amount || 0) >= Number(goal.target_amount || 0)) return 'completed'
  const deadline = new Date(goal.deadline)
  if (!Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now()) return 'at-risk'
  return 'on-track'
}

function deadlineLabel(deadline: string) {
  const date = new Date(`${deadline.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(date.getTime())) return 'Prazo não informado'
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
}

function forecastLabel(date: Date | null) {
  if (!date) return null
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
}

function metricFor(goal: Goal, metrics: Map<string, GoalMetrics>) {
  return metrics.get(goal.id) ?? buildGoalMetrics(goal, [], [])
}

export default function GoalsView({
  goals,
  transactions,
  onAddGoal,
  onAdjustGoal,
  onUpdateGoal,
  onDeleteGoal,
  handleRedirect,
}: GoalsViewProps) {
  const [movements, setMovements] = useState<GoalMovement[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [action, setAction] = useState<GoalAction | null>(null)
  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [goalType, setGoalType] = useState<GoalType>('standard')
  const [adjustAmount, setAdjustAmount] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const loadMovements = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryError(false)
    try {
      setMovements(await goalsService.listMovements())
    } catch {
      setHistoryError(true)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadMovements()
  }, [loadMovements])

  const metrics = useMemo(() => {
    const now = new Date()
    return new Map(goals.map((goal) => [goal.id, buildGoalMetrics(goal, movements, transactions, now)]))
  }, [goals, movements, transactions])

  const highlightedGoal = useMemo(() => {
    const active = goals.filter((goal) => goalState(goal) !== 'completed')
    if (!active.length) return null
    const emergency = active.find((goal) => typeOfGoal(goal) === 'emergency_fund')
    if (emergency) return emergency
    return [...active].sort((left, right) => {
      const leftMetrics = metricFor(left, metrics)
      const rightMetrics = metricFor(right, metrics)
      return rightMetrics.progressPercent - leftMetrics.progressPercent
    })[0]
  }, [goals, metrics])

  const highlightedMetrics = highlightedGoal ? metricFor(highlightedGoal, metrics) : null

  const insight = useMemo(() => {
    if (!highlightedGoal || !highlightedMetrics) {
      return {
        title: 'Crie uma meta para transformar intenção em progresso visível.',
        description: 'O Cérebro usa apenas movimentos reais para explicar ritmo e evolução.',
      }
    }

    if (!highlightedMetrics.paceHasSufficientHistory) {
      return {
        title: 'Ainda sem histórico suficiente para prever esta meta.',
        description: highlightedMetrics.consistencyWeeks > 0
          ? `Você contribuiu em ${highlightedMetrics.consistencyWeeks} das últimas 4 semanas. A previsão aparece quando houver histórico mensal suficiente.`
          : 'Aportes futuros formarão o histórico necessário para calcular ritmo e previsão sem estimativas artificiais.',
      }
    }

    const forecast = forecastLabel(highlightedMetrics.forecastDate)
    if (forecast) {
      return {
        title: `Mantendo seu ritmo, esta meta pode ser concluída em ${forecast}.`,
        description: `Ritmo líquido recente de ${brl(highlightedMetrics.monthlyPace || 0)} por mês e contribuição positiva em ${highlightedMetrics.consistencyWeeks} das últimas 4 semanas.`,
      }
    }

    return {
      title: 'Seu histórico já existe, mas o ritmo líquido ainda não sustenta uma previsão.',
      description: `Contribuições e retiradas são consideradas juntas. O líquido deste mês está em ${brl(highlightedMetrics.netThisMonth)}.`,
    }
  }, [highlightedGoal, highlightedMetrics])

  const resetCreate = () => {
    setTitle('')
    setTargetAmount('')
    setDeadline('')
    setGoalType('standard')
    setFormError(null)
  }

  const closeAction = () => {
    if (isSaving) return
    setSelectedGoal(null)
    setAction(null)
    setAdjustAmount('')
    setFormError(null)
  }

  const openAction = (goal: Goal, nextAction: GoalAction) => {
    setSelectedGoal(goal)
    setAction(nextAction)
    setFormError(null)
    setAdjustAmount('')
    if (nextAction === 'edit') {
      setTitle(goal.title)
      setTargetAmount(String(goal.target_amount))
      setDeadline(goal.deadline?.slice(0, 10) ?? '')
      setGoalType(typeOfGoal(goal))
    }
  }

  const handleCreateGoal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const amount = parseAmount(targetAmount)
    if (!title.trim()) return setFormError('Informe um nome para a meta.')
    if (amount <= 0) return setFormError('Informe um valor de meta maior que zero.')
    if (!deadline) return setFormError('Escolha um prazo para a meta.')

    setIsSaving(true)
    setFormError(null)
    try {
      const input = {
        title: title.trim(),
        target_amount: amount,
        deadline,
        color: '#7C3AED',
        goal_type: goalType,
      } as NewGoal & { goal_type: GoalType }
      await onAddGoal(input)
      resetCreate()
      setIsCreateOpen(false)
      toast.success('Meta criada.')
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      setFormError(message.includes('FREE_RESOURCE_LIMIT_REACHED') ? 'O plano Free permite até 3 metas.' : message || 'Não foi possível criar a meta agora. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleGoalAction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedGoal || !action) return
    setIsSaving(true)
    setFormError(null)
    try {
      if (action === 'contribute' || action === 'withdraw') {
        const amount = parseAmount(adjustAmount)
        if (amount <= 0) throw new Error('Informe um valor maior que zero.')
        await onAdjustGoal(selectedGoal.id, action === 'contribute' ? amount : -amount)
        await loadMovements()
        toast.success(action === 'contribute' ? 'Valor adicionado à meta.' : 'Valor retirado da meta.')
      } else if (action === 'edit') {
        const target = parseAmount(targetAmount)
        if (!title.trim()) throw new Error('Informe um nome para a meta.')
        if (target <= 0) throw new Error('Informe um valor-alvo maior que zero.')
        if (!deadline) throw new Error('Escolha um prazo para a meta.')
        const updates = { title: title.trim(), target_amount: target, deadline, goal_type: goalType } as GoalUpdateWithType
        await onUpdateGoal(selectedGoal.id, updates)
        toast.success('Meta atualizada.')
      } else {
        await onDeleteGoal(selectedGoal.id)
        await loadMovements()
        toast.success('Meta excluída.')
      }
      closeAction()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Não foi possível atualizar a meta.')
    } finally {
      setIsSaving(false)
    }
  }

  const actionTitle = action === 'contribute'
    ? 'Adicionar valor'
    : action === 'withdraw'
      ? 'Retirar valor'
      : action === 'edit'
        ? 'Editar meta'
        : 'Excluir meta'

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5 p-4 md:p-6 xl:p-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-action-primary)]">Metas</p>
          <h1 className="mt-2 text-[30px] font-bold leading-9 tracking-[-0.04em] text-[var(--color-text-primary)]">Transforme planos em progresso visível.</h1>
          <p className="mt-1 text-[13px] leading-5 text-[var(--color-text-secondary)]">Acompanhe seus objetivos, mantenha o ritmo e saiba o que fazer a seguir.</p>
        </div>
        <Button className="gap-2 sm:shrink-0" onClick={() => setIsCreateOpen(true)}>
          <Plus aria-hidden="true" className="h-4 w-4" />Nova meta
        </Button>
      </header>

      {historyError ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-status-warning)]/30 bg-[var(--color-card-fill)] px-4 py-3 text-xs text-[var(--color-text-secondary)]">
          O saldo das metas continua disponível, mas o histórico de movimentos não pôde ser carregado agora. Métricas de ritmo foram ocultadas.
          <Button variant="link" size="sm" onClick={() => void loadMovements()}>Tentar novamente</Button>
        </div>
      ) : null}

      {highlightedGoal && highlightedMetrics ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
          <section className="relative overflow-hidden rounded-[22px] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-6 md:p-7" aria-labelledby="featured-goal-title">
            <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[var(--color-card-accent-fill)]" />
            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-card-accent-fill)] text-[var(--color-action-primary)]">
                      {typeOfGoal(highlightedGoal) === 'emergency_fund' ? <PiggyBank aria-hidden="true" className="h-4 w-4" /> : <Flag aria-hidden="true" className="h-4 w-4" />}
                    </span>
                    <span className="rounded-full bg-[var(--color-card-accent-fill)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--color-action-primary)]">Em destaque</span>
                  </div>
                  <h2 id="featured-goal-title" className="mt-4 text-[24px] font-semibold tracking-[-0.03em] text-[var(--color-text-primary)]">{highlightedGoal.title}</h2>
                  <p className="mt-1 text-xs text-[var(--color-text-helper)]">{deadlineLabel(highlightedGoal.deadline)}</p>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label={`Mais ações para ${highlightedGoal.title}`} onClick={() => openAction(highlightedGoal, 'edit')}>
                  <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[13px] text-[var(--color-text-helper)]">Reservado</p>
                  <p className="mt-1 text-[28px] font-bold tracking-[-0.035em] text-[var(--color-text-primary)]">{brl(Number(highlightedGoal.current_amount || 0))} <span className="text-sm font-normal text-[var(--color-text-helper)]">de {brl(Number(highlightedGoal.target_amount || 0))}</span></p>
                </div>
                <p className="text-lg font-semibold text-[var(--color-action-primary)]">{Math.round(highlightedMetrics.progressPercent)}% concluído</p>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--color-progress-track)]">
                <div className="h-full rounded-full bg-[var(--color-action-primary)]" style={{ width: `${highlightedMetrics.progressPercent}%` }} />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[14px] bg-[var(--color-action-ghost-hover)] p-3">
                  <p className="text-[10px] text-[var(--color-text-helper)]">Falta</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">{brl(highlightedMetrics.remaining)}</p>
                </div>
                <div className="rounded-[14px] bg-[var(--color-action-ghost-hover)] p-3">
                  <p className="text-[10px] text-[var(--color-text-helper)]">{typeOfGoal(highlightedGoal) === 'emergency_fund' ? 'Cobertura' : 'Adicionado no mês'}</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">
                    {typeOfGoal(highlightedGoal) === 'emergency_fund'
                      ? highlightedMetrics.emergencyCoverageMonths == null ? 'Dados insuficientes' : `${highlightedMetrics.emergencyCoverageMonths.toFixed(1)} meses`
                      : brl(highlightedMetrics.addedThisMonth)}
                  </p>
                </div>
                <div className="rounded-[14px] bg-[var(--color-action-ghost-hover)] p-3">
                  <p className="text-[10px] text-[var(--color-text-helper)]">Ritmo recente</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">{highlightedMetrics.monthlyPace == null ? 'Sem histórico suficiente' : `${brl(highlightedMetrics.monthlyPace)}/mês`}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" disabled={Number(highlightedGoal.current_amount || 0) <= 0} onClick={() => openAction(highlightedGoal, 'withdraw')}>Retirar</Button>
                <Button size="sm" disabled={goalState(highlightedGoal) === 'completed'} onClick={() => {
                  if (highlightedMetrics.nextContribution) setAdjustAmount(String(highlightedMetrics.nextContribution))
                  openAction(highlightedGoal, 'contribute')
                  if (highlightedMetrics.nextContribution) setAdjustAmount(String(highlightedMetrics.nextContribution))
                }}>
                  {highlightedMetrics.nextContribution ? `Adicionar ${brl(highlightedMetrics.nextContribution)}` : 'Adicionar valor'}
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-[22px] border border-[var(--color-card-accent-border)] bg-[var(--color-card-accent-fill)] p-6" aria-labelledby="goals-insight-title">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-primary)]">
              <Sparkles aria-hidden="true" className="h-4 w-4 text-[var(--color-action-ai)]" />Insight do Cérebro
            </div>
            <h2 id="goals-insight-title" className="mt-6 text-[23px] font-semibold leading-[30px] tracking-[-0.02em] text-[var(--color-text-primary)]">{insight.title}</h2>
            <p className="mt-3 text-xs leading-5 text-[var(--color-text-secondary)]">{historyLoading ? 'Carregando histórico real da meta…' : insight.description}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              <Button variant="ai" size="sm" disabled={!highlightedGoal || goalState(highlightedGoal) === 'completed'} onClick={() => highlightedGoal && openAction(highlightedGoal, 'contribute')}>Ajustar aporte</Button>
              <Button variant="link" size="sm" onClick={() => handleRedirect('transações')}>Ver movimentações <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" /></Button>
            </div>
          </section>
        </div>
      ) : null}

      <section aria-labelledby="goals-list-title">
        <div className="mb-4">
          <h2 id="goals-list-title" className="text-xl font-semibold text-[var(--color-text-primary)]">Suas metas</h2>
          <p className="mt-1 text-xs text-[var(--color-text-helper)]">Progresso, aportes e ritmo calculados a partir do histórico persistido.</p>
        </div>

        {goals.length ? (
          <div className="grid gap-3">
            {goals.map((goal) => {
              const goalMetrics = metricFor(goal, metrics)
              const completed = goalState(goal) === 'completed'
              const state = goalState(goal)
              return (
                <article key={goal.id} className="rounded-[18px] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-4 md:p-5">
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(180px,0.6fr)_minmax(155px,0.55fr)_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${completed ? 'bg-[color-mix(in_srgb,var(--color-status-success)_14%,transparent)] text-[var(--color-status-success)]' : 'bg-[var(--color-card-accent-fill)] text-[var(--color-action-primary)]'}`}>
                          {completed ? <Check aria-hidden="true" className="h-4 w-4" /> : typeOfGoal(goal) === 'emergency_fund' ? <PiggyBank aria-hidden="true" className="h-4 w-4" /> : <Target aria-hidden="true" className="h-4 w-4" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{goal.title}</h3>
                          <p className="mt-1 text-[10px] text-[var(--color-text-helper)]">{completed ? 'Meta concluída' : `Prazo: ${deadlineLabel(goal.deadline)}`}</p>
                        </div>
                      </div>
                      <div className="mt-4 h-[7px] overflow-hidden rounded-full bg-[var(--color-progress-track)]">
                        <div className={`h-full rounded-full ${completed ? 'bg-[var(--color-status-success)]' : state === 'at-risk' ? 'bg-[var(--color-status-warning)]' : 'bg-[var(--color-action-primary)]'}`} style={{ width: `${goalMetrics.progressPercent}%` }} />
                      </div>
                      <div className="mt-2 flex justify-between gap-3 text-[10px] text-[var(--color-text-helper)]">
                        <span>{brl(Number(goal.current_amount || 0))} / {brl(Number(goal.target_amount || 0))}</span>
                        <span>{Math.round(goalMetrics.progressPercent)}%</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-[var(--color-text-helper)]">Adicionado este mês</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">{brl(goalMetrics.addedThisMonth)}</p>
                      <p className="mt-1 text-[10px] text-[var(--color-text-helper)]">Líquido: {brl(goalMetrics.netThisMonth)}</p>
                    </div>

                    <div>
                      <p className="text-[10px] text-[var(--color-text-helper)]">Ritmo</p>
                      <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">{goalMetrics.monthlyPace == null ? 'Sem histórico suficiente' : `${brl(goalMetrics.monthlyPace)}/mês`}</p>
                      <p className="mt-1 text-[10px] text-[var(--color-text-helper)]">{goalMetrics.consistencyWeeks} de 4 semanas positivas</p>
                    </div>

                    <div className="flex flex-wrap gap-1 md:justify-end">
                      <Button size="sm" variant="secondary" disabled={completed} onClick={() => openAction(goal, 'contribute')}>Adicionar</Button>
                      <Button size="icon-sm" variant="ghost" aria-label={`Editar ${goal.title}`} onClick={() => openAction(goal, 'edit')}><Pencil aria-hidden="true" className="h-3.5 w-3.5" /></Button>
                      <Button size="icon-sm" variant="ghost" aria-label={`Excluir ${goal.title}`} className="text-[var(--color-text-error)]" onClick={() => openAction(goal, 'delete')}><Trash2 aria-hidden="true" className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-[20px] border border-dashed border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-card-accent-fill)] text-[var(--color-action-primary)]"><Target aria-hidden="true" className="h-6 w-6" /></span>
            <h3 className="mt-4 text-base font-semibold">Você ainda não criou uma meta</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">Crie um objetivo real para começar a acompanhar valor reservado, prazo e histórico de aportes.</p>
            <Button className="mt-5" onClick={() => setIsCreateOpen(true)}>Criar primeira meta</Button>
          </div>
        )}
      </section>

      <Modal isOpen={isCreateOpen} onClose={() => { if (!isSaving) { setIsCreateOpen(false); resetCreate() } }} title="Criar meta">
        <form className="space-y-4" onSubmit={handleCreateGoal}>
          <Field label="Nome da meta" htmlFor="goal-title" required><Input id="goal-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Reserva de emergência" autoFocus /></Field>
          <Field label="Valor da meta" htmlFor="goal-target" required helperText="Informe o valor total que deseja alcançar."><Input id="goal-target" inputMode="decimal" value={targetAmount} onChange={(event) => setTargetAmount(event.target.value)} placeholder="Ex.: 20000" /></Field>
          <Field label="Prazo" htmlFor="goal-deadline" required><Input id="goal-deadline" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></Field>
          <label className="block space-y-2 text-sm font-medium text-[var(--color-text-primary)]">
            <span>Tipo da meta</span>
            <select aria-label="Tipo da meta" value={goalType} onChange={(event) => setGoalType(event.target.value as GoalType)} className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]">
              <option value="standard">Meta comum</option>
              <option value="emergency_fund">Reserva de emergência</option>
            </select>
            <span className="block text-xs font-normal text-[var(--color-text-helper)]">A cobertura em meses só é calculada para metas marcadas explicitamente como reserva de emergência.</span>
          </label>
          {formError ? <p role="alert" className="text-sm text-[var(--color-text-error)]">{formError}</p> : null}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" disabled={isSaving} onClick={() => { setIsCreateOpen(false); resetCreate() }}>Cancelar</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Criando…' : 'Criar meta'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(selectedGoal && action)} onClose={closeAction} title={actionTitle}>
        <form className="space-y-4" onSubmit={handleGoalAction}>
          {action === 'contribute' || action === 'withdraw' ? (
            <>
              <p className="text-sm text-[var(--color-text-secondary)]">{selectedGoal?.title} · reservado atualmente {brl(Number(selectedGoal?.current_amount || 0))}</p>
              <Field label={action === 'contribute' ? 'Valor a adicionar' : 'Valor a retirar'} htmlFor="goal-adjust" required>
                <Input id="goal-adjust" inputMode="decimal" value={adjustAmount} onChange={(event) => setAdjustAmount(event.target.value)} placeholder="0,00" autoFocus />
              </Field>
            </>
          ) : null}
          {action === 'edit' ? (
            <>
              <Field label="Nome da meta" htmlFor="goal-edit-title" required><Input id="goal-edit-title" value={title} onChange={(event) => setTitle(event.target.value)} autoFocus /></Field>
              <Field label="Valor da meta" htmlFor="goal-edit-target" required helperText={`Já reservado: ${brl(Number(selectedGoal?.current_amount || 0))}`}><Input id="goal-edit-target" inputMode="decimal" value={targetAmount} onChange={(event) => setTargetAmount(event.target.value)} /></Field>
              <Field label="Prazo" htmlFor="goal-edit-deadline" required><Input id="goal-edit-deadline" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></Field>
              <label className="block space-y-2 text-sm font-medium text-[var(--color-text-primary)]">
                <span>Tipo da meta</span>
                <select aria-label="Tipo da meta" value={goalType} onChange={(event) => setGoalType(event.target.value as GoalType)} className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]">
                  <option value="standard">Meta comum</option>
                  <option value="emergency_fund">Reserva de emergência</option>
                </select>
              </label>
            </>
          ) : null}
          {action === 'delete' ? <p className="text-sm leading-6 text-[var(--color-text-secondary)]">Excluir “{selectedGoal?.title}”? O progresso e o histórico de movimentos desta meta serão removidos.</p> : null}
          {formError ? <p role="alert" className="text-sm text-[var(--color-text-error)]">{formError}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" disabled={isSaving} onClick={closeAction}>Cancelar</Button>
            <Button type="submit" disabled={isSaving} variant={action === 'delete' ? 'destructive' : 'default'}>
              {isSaving ? 'Salvando…' : action === 'delete' ? 'Excluir' : action === 'withdraw' ? 'Retirar' : action === 'edit' ? 'Salvar alterações' : 'Adicionar valor'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
