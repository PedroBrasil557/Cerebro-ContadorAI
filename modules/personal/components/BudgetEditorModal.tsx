'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { budgetService, type BudgetLimitInput, type PersonalBudget } from '@/services/budgetService'
import { Button } from '@/core/ui/button'
import { Input } from '@/core/ui/input'
import { Modal } from '@/core/ui/Modal'

interface BudgetEditorModalProps {
  isOpen: boolean
  onClose: () => void
  monthStart: string
  budget: PersonalBudget | null
  suggestedCategories: string[]
  onSaved: () => Promise<void>
}

const DEFAULT_CATEGORIES = ['Alimentação', 'Moradia', 'Transporte', 'Lazer']

function moneyInput(value: number) {
  return Number.isFinite(value) && value > 0 ? value.toFixed(2) : ''
}

export default function BudgetEditorModal({
  isOpen,
  onClose,
  monthStart,
  budget,
  suggestedCategories,
  onSaved,
}: BudgetEditorModalProps) {
  const [plannedTotal, setPlannedTotal] = useState('')
  const [limits, setLimits] = useState<Array<{ category: string; value: string }>>([])
  const [saving, setSaving] = useState(false)

  const categoryOptions = useMemo(
    () => [...new Set([...DEFAULT_CATEGORIES, ...suggestedCategories])].filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [suggestedCategories],
  )

  useEffect(() => {
    if (!isOpen) return
    setPlannedTotal(budget ? moneyInput(budget.planned_total) : '')
    setLimits(
      budget?.limits.length
        ? budget.limits.map((limit) => ({ category: limit.category, value: moneyInput(limit.limit_amount) }))
        : DEFAULT_CATEGORIES.map((category) => ({ category, value: '' })),
    )
  }, [budget, isOpen])

  const parsedTotal = Number(plannedTotal || 0)
  const parsedLimits: BudgetLimitInput[] = limits
    .map((limit) => ({ category: limit.category.trim(), limit_amount: Number(limit.value || 0) }))
    .filter((limit) => limit.category && limit.limit_amount > 0)
  const assigned = parsedLimits.reduce((sum, limit) => sum + limit.limit_amount, 0)
  const unassigned = parsedTotal - assigned
  const invalid = !Number.isFinite(parsedTotal)
    || parsedTotal < 0
    || parsedLimits.some((limit) => !Number.isFinite(limit.limit_amount) || limit.limit_amount < 0)
    || assigned > parsedTotal + 0.001

  const addCategory = () => {
    const unused = categoryOptions.find((option) => !limits.some((limit) => limit.category === option))
    setLimits((current) => [...current, { category: unused || '', value: '' }])
  }

  const handleSave = async () => {
    if (invalid) {
      toast.error('Revise o total e os limites antes de salvar.')
      return
    }
    setSaving(true)
    try {
      await budgetService.saveBudget(monthStart, parsedTotal, parsedLimits)
      await onSaved()
      toast.success('Orçamento atualizado.')
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o orçamento.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={budget ? 'Ajustar orçamento' : 'Definir orçamento'}>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Defina quanto pretende gastar no mês e, se quiser, distribua parte desse valor entre categorias.
          </p>
        </div>

        <label className="block space-y-2 text-sm font-medium text-[var(--color-text-primary)]">
          <span>Orçamento planejado</span>
          <Input
            aria-label="Orçamento planejado"
            inputMode="decimal"
            type="number"
            min="0"
            step="0.01"
            value={plannedTotal}
            onChange={(event) => setPlannedTotal(event.target.value)}
            placeholder="0,00"
          />
        </label>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Limites por categoria</p>
              <p className="text-xs text-[var(--color-text-helper)]">A soma dos limites não pode ultrapassar o total planejado.</p>
            </div>
            <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={addCategory}>
              <Plus aria-hidden="true" className="h-4 w-4" />Adicionar
            </Button>
          </div>

          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {limits.map((limit, index) => (
              <div key={`${limit.category}-${index}`} className="grid grid-cols-[minmax(0,1fr)_150px_40px] gap-2">
                <select
                  aria-label={`Categoria ${index + 1}`}
                  value={limit.category}
                  onChange={(event) => setLimits((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, category: event.target.value } : item))}
                  className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
                >
                  <option value="">Escolha a categoria</option>
                  {categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                <Input
                  aria-label={`Limite de ${limit.category || `categoria ${index + 1}`}`}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={limit.value}
                  onChange={(event) => setLimits((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover categoria ${limit.category || index + 1}`}
                  onClick={() => setLimits((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-md)] bg-[var(--color-action-ghost-hover)] p-4 text-sm">
          <div>
            <p className="text-xs text-[var(--color-text-helper)]">Distribuído em categorias</p>
            <p className="mt-1 font-semibold tabular-nums text-[var(--color-text-primary)]">R$ {assigned.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-helper)]">Ainda sem limite específico</p>
            <p className={`mt-1 font-semibold tabular-nums ${unassigned < 0 ? 'text-[var(--color-status-danger)]' : 'text-[var(--color-text-primary)]'}`}>
              R$ {unassigned.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--color-border-default)] pt-5">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="button" onClick={handleSave} disabled={saving || invalid}>
            {saving ? 'Salvando...' : 'Salvar orçamento'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
