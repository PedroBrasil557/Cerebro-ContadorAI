'use client'

import React, { useState } from 'react'
import { Wallet, TrendingUp, TrendingDown, Edit2, Check, PiggyBank } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { ResponsiveContainer, AreaChart, Area } from 'recharts'

const CHART_COLORS = {
  brand: '#8B5CF6',
  success: '#10B981',
  danger: '#EF4444',
}

const generateSparkData = (trend: 'up' | 'down' | 'brand') => {
  const baseValue = trend === 'down' ? 100 : 50;
  const multiplier = trend === 'down' ? -5 : 5;
  return Array.from({ length: 20 }, (_, i) => {
    const randomVariance = Math.random() * 30 - 15;
    let value = baseValue + (i * multiplier) + randomVariance;
    if (trend === 'brand') value = 50 + (i * 2) + (Math.random() * 20 - 10);
    return { value: Math.max(10, value) }
  })
}

const EditableCard = ({ title, value, onChange, icon: Icon, trend, subtitle }: any) => {
  const [isEditing, setIsEditing] = useState(false)
  const [tempVal, setTempVal] = useState(value)
  const data = generateSparkData(trend)
  
  let chartColor = trend === 'brand' ? CHART_COLORS.brand : trend === 'up' ? CHART_COLORS.success : CHART_COLORS.danger;
  const iconClass = trend === 'brand' ? 'text-violet-400 bg-violet-500/10' : trend === 'up' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10';
  const textClass = trend === 'brand' ? 'text-violet-400' : trend === 'up' ? 'text-emerald-400' : 'text-red-400';

  const save = () => { onChange(Number(tempVal)); setIsEditing(false); }
  const gradientId = `grad-${title.replace(/\s+/g, '-')}`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#111] p-6 shadow-xl h-full group min-h-[160px]">
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium text-gray-400">{title}</span>
        </div>
        <button onClick={() => isEditing ? save() : setIsEditing(true)} className="rounded-full p-2 text-gray-600 opacity-0 group-hover:opacity-100 hover:text-white transition">
          {isEditing ? <Check className="h-4 w-4 text-green-500"/> : <Edit2 className="h-3 w-3"/>}
        </button>
      </div>

      <div className="relative z-10 mt-4">
        {isEditing ? (
          <input type="number" value={tempVal} onChange={e => setTempVal(e.target.value)} onBlur={save} autoFocus
            className="w-full bg-transparent text-3xl font-bold text-white outline-none border-b-2 border-violet-500" />
        ) : (
          <h3 onClick={() => setIsEditing(true)} className="text-3xl font-bold text-white tracking-tight cursor-pointer">{formatCurrency(value)}</h3>
        )}
        <p className={`mt-2 text-xs font-bold uppercase tracking-wider ${textClass}`}>{subtitle}</p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 opacity-30 group-hover:opacity-50 transition-opacity pointer-events-none mix-blend-screen" style={{ height: 112 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.8}/>
                <stop offset="100%" stopColor={chartColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke={chartColor} strokeWidth={3} fill={`url(#${gradientId})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function SummaryCards(props: any) {
  return (
    <>
      <EditableCard title="Saldo Total" value={props.currentBalance} onChange={props.setBalance} icon={Wallet} trend="brand" subtitle="Disponível" />
      <EditableCard title="Receitas" value={props.monthlyIncome} onChange={props.setIncome} icon={TrendingUp} trend="up" subtitle="+12% este mês" />
      <EditableCard title="Despesas" value={props.monthlyExpense} onChange={props.setExpense} icon={TrendingDown} trend="down" subtitle="Dentro da meta" />
      <EditableCard title="Reserva" value={props.emergencyTotal} onChange={props.setEmergency} icon={PiggyBank} trend="brand" subtitle="Proteção" />
    </>
  )
}