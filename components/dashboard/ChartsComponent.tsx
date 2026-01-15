'use client'

import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

// Cor Violeta Vibrante da Marca
const BRAND_COLOR = '#8B5CF6'

// Tooltip personalizado para o gráfico
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#151515]/90 p-3 shadow-xl backdrop-blur-sm">
        <p className="mb-1 text-xs font-medium text-gray-400">{label}</p>
        <p className="text-sm font-bold text-white">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    )
  }
  return null
}

type ChartsProps = {
  // Dados dinâmicos esperados: [{ name: 'Jan', value: 2000 }, { name: 'Fev', value: 2500 }, ...]
  balanceData: { name: string; value: number }[]
  // Ignoramos categoryData pois não vamos usar pizza aqui
  categoryData?: any 
}

export default function ChartsComponent({ balanceData }: ChartsProps) {
  // Se não vier dados, usa um mock para não quebrar o layout
  const data =
    balanceData && balanceData.length > 0
      ? balanceData
      : [
          { name: 'Jan', value: 15000 },
          { name: 'Fev', value: 18200 },
          { name: 'Mar', value: 17500 },
          { name: 'Abr', value: 21000 },
          { name: 'Mai', value: 19800 },
          { name: 'Jun', value: 24500 },
        ]

  const latestValue = data[data.length - 1].value
  const previousValue = data[data.length - 2]?.value || latestValue
  const isTrendingUp = latestValue >= previousValue

  return (
    <div className="glass-panel flex h-full flex-col rounded-2xl border border-white/5 bg-[#111] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-bold text-white">
            <TrendingUp className="h-5 w-5 text-violet-400" />
            Evolução Patrimonial
          </h3>
          <p className="text-sm text-gray-400">Histórico dos últimos 6 meses</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">
            {formatCurrency(latestValue)}
          </p>
          <p
            className={`flex items-center justify-end gap-1 text-xs font-bold ${
              isTrendingUp ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {isTrendingUp ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingUp className="h-3 w-3 rotate-180" />
            )}
            Tendência {isTrendingUp ? 'Positiva' : 'Negativa'}
          </p>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 0, left: -15, bottom: 0 }}
          >
            <defs>
              {/* Gradiente Violeta Vibrante */}
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={BRAND_COLOR} stopOpacity={0.6} />
                <stop offset="95%" stopColor={BRAND_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              dx={-10}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={BRAND_COLOR}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorBalance)"
              activeDot={{
                r: 6,
                stroke: '#fff',
                strokeWidth: 2,
                fill: BRAND_COLOR,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}