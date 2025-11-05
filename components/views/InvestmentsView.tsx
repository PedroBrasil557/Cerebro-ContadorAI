// components/views/InvestmentsView.tsx
'use client'

import React from 'react'
import { Goal, EmergencyFund, NewGoal } from '@/types_db'
import AddGoalForm from '../investments/AddGoalForm'
import GoalsList from '../investments/GoalsList'
import InvestmentAdvisor from '../investments/InvestmentAdvisor'

type InvestmentsProps = {
  goals: Goal[]
  cdiRate: number
  emergencyFund: EmergencyFund | null
  onAddGoal: (goal: NewGoal) => Promise<void>
}

export default function InvestmentsView({
  goals,
  cdiRate,
  emergencyFund,
  onAddGoal,
}: InvestmentsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <AddGoalForm onAddGoal={onAddGoal} />
        <GoalsList goals={goals} cdiRate={cdiRate} />
      </div>
      <div>
        <InvestmentAdvisor
          goals={goals}
          emergencyFund={emergencyFund}
          cdiRate={cdiRate}
        />
      </div>
    </div>
  )
}