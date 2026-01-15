'use client'

import React, { useState } from 'react'
import { Wallet, TrendingUp, TrendingDown, Edit2, Check, DollarSign, PiggyBank } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
// CORREÇÃO: Removemos LinearGradient e Stop da importação
import { ResponsiveContainer, AreaChart, Area } from 'recharts'
import { motion } from 'framer-motion'

const CHART_COLORS = {
  brand: '#8B5CF6', 
  success: '#34D399', 
  danger: '#F87171',  
}

const generateSparkData = (trend: 'up' | 'down' | 'brand') => {
  const baseValue = trend === 'down' ? 100 : 50;
  const multiplier = trend === 'down' ? -5 : 5;
  
  return Array.from({ length: 20 }, (_, i) => {
    const randomVariance = Math.random() * 30 - 15;
    let value = baseValue + (i * multiplier) + randomVariance;
    if (trend === 'brand') {
       value = 50 + (i * 2) + (Math.random() * 20 - 10);
    }
    return { value: Math.max(10, value) }
  })
}

interface EditableCardProps {
  title: string
  value: number
  onChange: (val: number) => void
  icon: any
  trend: 'up' | 'down' | 'brand' 
  subtitle: string
}

const EditableCard = ({ title, value, onChange, icon: Icon, trend, subtitle }: EditableCardProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [tempVal, setTempVal] = useState(value)
  const data = generateSparkData(trend)
  
  let chartColor: string;
  if (trend === 'brand') chartColor = CHART_COLORS.brand;
  else if (trend === 'up') chartColor = CHART_COLORS.success;
  else chartColor = CHART_COLORS.danger;

  const iconBgColor = trend === 'brand' ? 'bg-brand-primary/20 text-brand-primary' : 
                      trend === 'up' ? 'bg-emerald-500/20 text-emerald-400' : 
                      'bg-red-500/20 text-red-400';
                      
  const subtitleColor = trend === 'brand' ? 'text-brand-primary' : 
                        trend === 'up' ? 'text-emerald-400' : 
                        'text-red-400';

  const save = () => {
    onChange(Number(tempVal))
    setIsEditing(false)
  }

  const gradientId = `grad-${title.replace(/\s+/g, '-')}`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#111] p-6 shadow-xl transition-all hover:border-brand-primary/30 group h-full">
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${iconBgColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium text-gray-400">{title}</span>
        </div>
        <button 
          onClick={() => isEditing ? save() : setIsEditing(true)}
          className="rounded-full p-2 text-gray-600 opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100"
        >
          {isEditing ? <Check className="h-4 w-4 text-green-500" /> : <Edit2 className="h-3 w-3" />}
        </button>
      </div>

      <div className="relative z-10 mt-4">
        {isEditing ? (
          <input 
            type="number" 
            value={tempVal}
            onChange={e => setTempVal(Number(e.target.value))}
            className="w-full bg-transparent text-3xl font-bold text-white outline-none border-b-2 border-brand-primary py-1"
            autoFocus
            onBlur={save} 
            onKeyDown={(e) => e.key === 'Enter' && save()} 
          />
        ) : (
          <motion.h3 
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-white tracking-tight cursor-pointer"
            onClick={() => setIsEditing(true)}
          >
            {formatCurrency(value)}
          </motion.h3>
        )}
        <p className={`mt-2 text-xs font-bold uppercase tracking-wider ${subtitleColor}`}>
          {subtitle}
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-28 opacity-40 transition-opacity group-hover:opacity-60 pointer-events-none mix-blend-lighten">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
            <defs>
              {/* CORREÇÃO: Usando tags HTML padrão com camelCase */}
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.9}/>
                <stop offset="100%" stopColor={chartColor} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke={chartColor} strokeWidth={3} fill={`url(#${gradientId})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function SummaryCards({ 
  currentBalance, setBalance,
  monthlyIncome, setIncome,
  monthlyExpense, setExpense,
  emergencyTotal, setEmergency
}: any) {
  return (
    <>
      <EditableCard title="Saldo Total" value={currentBalance} onChange={setBalance} icon={Wallet} trend="brand" subtitle="Disponível geral" />
      <EditableCard title="Receitas" value={monthlyIncome} onChange={setIncome} icon={TrendingUp} trend="up" subtitle="+12.5% este mês" />
      <EditableCard title="Despesas" value={monthlyExpense} onChange={setExpense} icon={TrendingDown} trend="down" subtitle="Dentro do previsto" />
      <EditableCard title="Reserva" value={emergencyTotal} onChange={setEmergency} icon={PiggyBank} trend="brand" subtitle="Meta: R$ 50.000" />
    </>
  )
}