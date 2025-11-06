'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Goal, EmergencyFund, NewGoal } from '@/types_db'
import { ActiveTab } from '@/types'
import AddGoalForm from '../investments/AddGoalForm'
import GoalsList from '../investments/GoalsList'
import InvestmentAdvisor from '../investments/InvestmentAdvisor'
import MarketDataCard, { MarketDataItem } from './MarketDataCard'
import CdiCard from './CdiCard'
import { MOCK_MARKET_DATA } from '@/lib/mockData'

// Função padrão caso handleRedirect não seja fornecido
const NO_OP = () => {}

// Valida número
const isValidNumber = (value: any): value is number =>
  typeof value === 'number' && !isNaN(value)

// Converte para number seguro
const toNumber = (value: number | undefined | null): number =>
  isValidNumber(value) ? value : 0

// Normaliza Goal ou NewGoal
const normalizeGoal = (goal: Goal | NewGoal): Goal => ({
  ...goal,
  current_amount: toNumber(goal.current_amount),
  target_amount: toNumber(goal.target_amount),
  id: 'id' in goal && goal.id ? goal.id : String(Date.now()),
  user_id: 'user_id' in goal && goal.user_id ? goal.user_id : 'local',
  created_at:
    'created_at' in goal && goal.created_at
      ? goal.created_at
      : new Date().toISOString(),
})

type InvestmentsProps = {
  goals: Goal[]
  cdiRate: number
  emergencyFund: EmergencyFund | null
  onAddGoal: (goal: NewGoal) => Promise<void>
  handleRedirect?: (tab: ActiveTab) => void
}

export default function InvestmentsView({
  goals,
  cdiRate,
  emergencyFund,
  onAddGoal,
  handleRedirect = NO_OP as (tab: ActiveTab) => void,
}: InvestmentsProps) {
  const [goalsState, setGoalsState] = useState<Goal[]>(() =>
    goals.map(normalizeGoal)
  )

  useEffect(() => {
    setGoalsState(goals.map(normalizeGoal))
  }, [goals])

  const handleAddValueToGoal = useCallback((goalId: string, amount: number) => {
    const value = toNumber(amount)
    if (value <= 0) return

    setGoalsState((prevGoals) =>
      prevGoals.map((goal) =>
        goal.id === goalId
          ? { ...goal, current_amount: goal.current_amount + value }
          : goal
      )
    )
  }, [])

  const convertNewGoalToGoal = (newGoal: NewGoal): Goal => ({
    id: String(Date.now()),
    user_id: 'local',
    created_at: new Date().toISOString(),
    title: newGoal.title,
    current_amount: toNumber(newGoal.current_amount),
    target_amount: toNumber(newGoal.target_amount),
  })

  const handleAddNewGoal = useCallback(
    async (goal: NewGoal) => {
      const normalizedNewGoal: NewGoal = {
        title: String(goal.title),
        current_amount: toNumber(goal.current_amount),
        target_amount: toNumber(goal.target_amount),
      }

      try {
        await onAddGoal(normalizedNewGoal)
      } catch (err) {
        console.error('Erro ao persistir nova meta:', err)
        return
      }

      const newGoal: Goal = convertNewGoalToGoal(normalizedNewGoal)
      setGoalsState((prev) => [...prev, newGoal])
    },
    [onAddGoal]
  )

  const handleGoalClickInView = useCallback((goal?: Goal) => {
    console.log('Meta clicada na aba Investimentos.', goal?.id ?? '')
  }, [])

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 p-6 md:p-10 bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* COLUNA PRINCIPAL */}
      <div className="space-y-8 lg:col-span-2">
        {/* Market + CDI */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
          <div className="md:col-span-3">
            <MarketDataCard
              marketData={MOCK_MARKET_DATA as MarketDataItem[]}
              className="shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all"
            />
          </div>
          <div className="md:col-span-2">
            <CdiCard
              cdiRate={cdiRate}
              className="shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all"
            />
          </div>
        </div>

        {/* Formulário de Nova Meta */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-2xl">
          <AddGoalForm onAddGoal={handleAddNewGoal} />
        </div>

        {/* Lista de Metas */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-2xl">
          <GoalsList
            goals={goalsState}
            cdiRate={cdiRate}
            onGoalClick={() => handleGoalClickInView()}
            onAddValue={handleAddValueToGoal}
          />
        </div>
      </div>

      {/* COLUNA LATERAL: Consultor IA */}
      <div className="lg:col-span-1 space-y-6">
        <InvestmentAdvisor
          goals={goalsState}
          emergencyFund={emergencyFund}
          cdiRate={cdiRate}
          handleRedirect={handleRedirect}
        />
      </div>
    </div>
  )
}
