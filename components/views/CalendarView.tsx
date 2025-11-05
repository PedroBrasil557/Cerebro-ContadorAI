// components/views/CalendarView.tsx
'use client'

import React, { useState, useMemo } from 'react'
import { Transaction } from '@/types_db'
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function CalendarView({
  transactions,
}: {
  transactions: Transaction[]
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const start = startOfMonth(currentMonth)
  const end = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start, end })
  const startingDayIndex = getDay(start)

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const transactionsByDay = useMemo(() => {
    return transactions.reduce(
      (acc: { [key: string]: Transaction[] }, tx) => {
        const dateKey = format(parseISO(tx.date), 'yyyy-MM-dd')
        if (!acc[dateKey]) {
          acc[dateKey] = []
        }
        acc[dateKey].push(tx)
        return acc
      },
      {}
    )
  }, [transactions])

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <button
          onClick={nextMonth}
          className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
          <div
            key={day}
            className="pb-2 text-center text-xs font-bold text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}

        {Array.from({ length: startingDayIndex }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="h-20 rounded border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
          />
        ))}

        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayTransactions = transactionsByDay[dateKey] || []
          const hasIncome = dayTransactions.some((tx) => tx.type === 'income')
          const hasExpense = dayTransactions.some((tx) => tx.type === 'expense')

          return (
            <div
              key={day.toString()}
              className="relative h-20 min-h-[80px] rounded border border-gray-200 bg-white p-1 text-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <span>{format(day, 'd')}</span>
              <div className="absolute bottom-1 left-1 flex gap-1">
                {hasIncome && (
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                )}
                {hasExpense && (
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}