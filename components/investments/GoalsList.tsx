// components/investments/GoalsList.tsx
'use client'

import React from 'react'
import { Goal } from '@/types_db'
import GoalCard from './GoalCard'
import { ArrowRight, Star } from 'lucide-react'

type GoalsListProps = {
  goals: Goal[]
  cdiRate: number
  onGoalClick: () => void // Novo prop para o redirecionamento
}

export default function GoalsList({ goals, cdiRate, onGoalClick }: GoalsListProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-xl font-semibold text-text-dark dark:text-white">
        Minhas Metas
      </h3>
      <div className="space-y-4">
        {goals.length > 0 ? (
          goals.map((goal) => (
            // Envolvendo o GoalCard em um elemento clicável
            <div
              key={goal.id}
              onClick={onGoalClick} // Torna a meta clicável
              className="cursor-pointer transition-transform duration-150 hover:scale-[1.01]"
            >
              <GoalCard goal={goal} cdiRate={cdiRate} isDashboard={true} />
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-text-light">
            <Star className="h-8 w-8 text-brand-violet mb-2" />
            <p className="text-sm">Nenhuma meta definida. Comece a investir!</p>
          </div>
        )}
      </div>
      {goals.length > 0 && (
        <button 
          onClick={onGoalClick}
          className="mt-4 w-full text-brand-violet font-semibold text-sm flex items-center justify-center gap-1 hover:text-brand-violet-dark transition-colors"
        >
            Ver e Gerenciar Metas <ArrowRight className='h-4 w-4' />
        </button>
      )}
    </div>
  )
}