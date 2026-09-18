'use client'

import { useMemo, useState } from 'react'
import { Target } from 'lucide-react'
import type { ActiveTab, Goal, NewGoal } from '@/types_db'
import { Button } from '@/core/ui/button'
import { Field } from '@/core/ui/field'
import { Input } from '@/core/ui/input'
import { Modal } from '@/core/ui/Modal'
import { CerebroAICard } from '@/core/finance-ui/CerebroAICard'
import { FinancialMetricCard } from '@/core/finance-ui/FinancialMetricCard'
import { GoalProgress } from '@/core/finance-ui/GoalProgress'

type GoalsViewProps = {
  goals: Goal[]
  onAddGoal: (goal: NewGoal) => Promise<void> | void
  handleRedirect: (tab: ActiveTab) => void
}

function brl(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function parseAmount(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function goalState(goal: Goal): 'on-track' | 'at-risk' | 'completed' {
  if (goal.current_amount >= goal.target_amount) return 'completed'
  const deadline = new Date(goal.deadline)
  if (!Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now()) return 'at-risk'
  return 'on-track'
}

function deadlineLabel(deadline: string) {
  const date = new Date(deadline)
  if (Number.isNaN(date.getTime())) return 'Prazo não informado'
  return `Prazo: ${new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: 'numeric',
  }).format(date)}`
}

export default function GoalsView({ goals, onAddGoal, handleRedirect }: GoalsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const summary = useMemo(() => {
    const totalReserved = goals.reduce((sum, goal) => sum + Number(goal.current_amount || 0), 0)
    const active = goals.filter((goal) => goal.current_amount < goal.target_amount)
    const completed = goals.filter((goal) => goal.current_amount >= goal.target_amount)
    const atRisk = active.filter((goal) => goalState(goal) === 'at-risk')

    return { totalReserved, active, completed, atRisk }
  }, [goals])

  const highlightedGoal = useMemo(() => {
    const activeGoals = goals.filter((goal) => goal.current_amount < goal.target_amount)
    if (!activeGoals.length) return null

    return [...activeGoals].sort((a, b) => {
      const aProgress = a.target_amount > 0 ? a.current_amount / a.target_amount : 0
      const bProgress = b.target_amount > 0 ? b.current_amount / b.target_amount : 0
      return bProgress - aProgress
    })[0]
  }, [goals])

  const resetForm = () => {
    setTitle('')
    setTargetAmount('')
    setDeadline('')
    setFormError(null)
  }

  const handleCreateGoal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const amount = parseAmount(targetAmount)

    if (!title.trim()) {
      setFormError('Informe um nome para a meta.')
      return
    }
    if (amount <= 0) {
      setFormError('Informe um valor de meta maior que zero.')
      return
    }
    if (!deadline) {
      setFormError('Escolha um prazo para a meta.')
      return
    }

    setIsSaving(true)
    setFormError(null)
    try {
      await onAddGoal({
        title: title.trim(),
        target_amount: amount,
        deadline,
        color: '#7C3AED',
        icon: 'target',
      })
      resetForm()
      setIsModalOpen(false)
    } catch {
      setFormError('Não foi possível criar a meta agora. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-6 p-4 md:p-6 xl:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold leading-9 tracking-[-0.5px] text-[var(--color-text-primary)]">Metas</h1>
          <p className="mt-1 text-sm leading-5 text-[var(--color-text-secondary)]">
            Transforme planos em objetivos financeiros acompanháveis.
          </p>
        </div>
        <Button className="sm:shrink-0" onClick={() => setIsModalOpen(true)}>
          Criar meta
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 md:gap-[18px]">
        <FinancialMetricCard
          label="Total reservado"
          value={brl(summary.totalReserved)}
          helper="em todas as metas"
        />
        <FinancialMetricCard
          label="Metas ativas"
          value={summary.active.length}
          delta={summary.atRisk.length ? `${summary.atRisk.length} em atenção` : 'no ritmo'}
          tone={summary.atRisk.length ? 'warning' : 'positive'}
          helper={summary.atRisk.length ? 'prazo já vencido' : 'nenhuma atrasada'}
        />
        <FinancialMetricCard
          label="Concluídas"
          value={summary.completed.length}
          tone="positive"
          helper="histórico disponível"
        />
      </div>

      {highlightedGoal ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <GoalProgress
            title={highlightedGoal.title}
            current={Number(highlightedGoal.current_amount || 0)}
            target={Number(highlightedGoal.target_amount || 0)}
            state={goalState(highlightedGoal)}
            helper={deadlineLabel(highlightedGoal.deadline)}
          />
          <CerebroAICard
            title="Quer entender como encaixar esta meta no seu mês?"
            description={`A meta “${highlightedGoal.title}” está em ${Math.round((Number(highlightedGoal.current_amount || 0) / Math.max(Number(highlightedGoal.target_amount || 1), 1)) * 100)}%. O Cérebro pode analisar suas movimentações antes de sugerir qualquer ajuste.`}
            onAction={() => handleRedirect('cérebro')}
          />
        </div>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold leading-6 text-[var(--color-text-primary)]">Suas metas</h2>
          <p className="mt-1 text-xs leading-[18px] text-[var(--color-text-helper)]">
            Acompanhe o progresso e o prazo de cada objetivo salvo na sua conta.
          </p>
        </div>

        {goals.length ? (
          <div className="grid gap-[18px] lg:grid-cols-2">
            {goals.map((goal) => (
              <GoalProgress
                key={goal.id}
                title={goal.title}
                current={Number(goal.current_amount || 0)}
                target={Number(goal.target_amount || 0)}
                state={goalState(goal)}
                helper={deadlineLabel(goal.deadline)}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-card-accent-fill)] text-[var(--color-nav-active-text)]">
              <Target aria-hidden="true" className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">Você ainda não criou uma meta</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">
              Crie um objetivo real para começar a acompanhar valor reservado e prazo.
            </p>
            <Button className="mt-5" onClick={() => setIsModalOpen(true)}>Criar primeira meta</Button>
          </div>
        )}
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (isSaving) return
          setIsModalOpen(false)
          resetForm()
        }}
        title="Criar meta"
      >
        <form className="space-y-4" onSubmit={handleCreateGoal}>
          <Field label="Nome da meta" htmlFor="goal-title" required>
            <Input
              id="goal-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex.: Reserva de emergência"
              autoFocus
            />
          </Field>
          <Field label="Valor da meta" htmlFor="goal-target" required helperText="Informe o valor total que deseja alcançar.">
            <Input
              id="goal-target"
              inputMode="decimal"
              value={targetAmount}
              onChange={(event) => setTargetAmount(event.target.value)}
              placeholder="Ex.: 20000"
            />
          </Field>
          <Field label="Prazo" htmlFor="goal-deadline" required>
            <Input
              id="goal-deadline"
              type="date"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </Field>
          {formError ? <p role="alert" className="text-sm text-[var(--color-text-error)]">{formError}</p> : null}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={isSaving}
              onClick={() => {
                setIsModalOpen(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Criando…' : 'Criar meta'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
