'use client'

import React, { useState } from 'react'
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday 
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import { Transaction } from '@/types_db'
import { formatCurrency } from '@/lib/utils'

interface CalendarViewProps {
  transactions: Transaction[]
}

export default function CalendarView({ transactions = [] }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

  // Navegação
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  // Geração dos dias do calendário
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

  // Agrupar transações por dia
  const transactionsByDay = transactions.reduce((acc, transaction) => {
    // Garante que a data seja tratada corretamente (se vier ISO string)
    const dateKey = format(new Date(transaction.date), 'yyyy-MM-dd')
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(transaction)
    return acc
  }, {} as Record<string, Transaction[]>)

  // Transações do dia selecionado
  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''
  const selectedDayTransactions = transactionsByDay[selectedDateKey] || []

  return (
    <div className="flex flex-col h-full p-6 animate-in fade-in">
      
      {/* Cabeçalho do Calendário */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg text-white transition">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg text-white transition">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        
        {/* GRID DO CALENDÁRIO */}
        <div className="lg:col-span-2 bg-[#111] border border-white/10 rounded-2xl p-6 h-fit">
          {/* Dias da Semana */}
          <div className="grid grid-cols-7 mb-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-gray-500 uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Dias */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const dayTrans = transactionsByDay[dateKey] || []
              
              // --- CORREÇÃO AQUI ---
              const hasIncome = dayTrans.some(t => t.type === 'receita')
              const hasExpense = dayTrans.some(t => t.type === 'despesa_fixa' || t.type === 'despesa_variavel')
              // ---------------------

              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const isCurrentMonth = isSameMonth(day, monthStart)

              return (
                <button
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    relative h-14 rounded-xl flex flex-col items-center justify-center transition
                    ${!isCurrentMonth ? 'opacity-20' : 'opacity-100'}
                    ${isSelected ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/50' : 'hover:bg-white/5 text-gray-300'}
                    ${isToday(day) && !isSelected ? 'border border-violet-500 text-violet-400' : ''}
                  `}
                >
                  <span className="text-sm font-bold">{format(day, 'd')}</span>
                  
                  {/* Indicadores (Dots) */}
                  <div className="flex gap-1 mt-1">
                    {hasIncome && (
                      <div className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-emerald-500'}`} />
                    )}
                    {hasExpense && (
                      <div className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-red-300' : 'bg-red-500'}`} />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* LISTA DE TRANSAÇÕES DO DIA */}
        <div className="lg:col-span-1 bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-4">
            {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: ptBR }) : 'Selecione um dia'}
          </h3>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {selectedDayTransactions.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p>Nenhuma transação neste dia.</p>
              </div>
            ) : (
              selectedDayTransactions.map(tx => (
                <div key={tx.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${tx.type === 'receita' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {tx.type === 'receita' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{tx.description}</p>
                      <p className="text-xs text-gray-400">{tx.category}</p>
                    </div>
                  </div>
                  <span className={`font-bold text-sm ${tx.type === 'receita' ? 'text-emerald-500' : 'text-white'}`}>
                    {tx.type === 'receita' ? '+' : '-'} {formatCurrency(Math.abs(tx.amount))}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}