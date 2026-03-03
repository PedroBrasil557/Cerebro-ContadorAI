'use client'

import React, { useMemo } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts'
import { Transaction } from '@/types_db'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, PieChart as PieIcon } from 'lucide-react'

// Cores do tema (Dark Mode)
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1']

export default function FinancialCharts({ transactions }: { transactions: Transaction[] }) {
  
  // 1. Processar dados para o Gráfico de Categorias (Pizza)
  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type !== 'receita')
    const grouped = expenses.reduce((acc, curr) => {
      const cat = curr.category || 'Outros'
      acc[cat] = (acc[cat] || 0) + Number(curr.amount)
      return acc
    }, {} as Record<string, number>)

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: Math.abs(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6) // Pega apenas as top 6 categorias
  }, [transactions])

  // 2. Processar dados para o Gráfico de Evolução (Barras)
  // Agrupa por mês (Ex: "Fev")
  const monthlyData = useMemo(() => {
    const last6Months = new Array(6).fill(0).map((_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      return d
    }).reverse()

    return last6Months.map(date => {
      const monthKey = date.toISOString().slice(0, 7) // 2024-02
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()
      
      const monthTrans = transactions.filter(t => t.date.startsWith(monthKey))
      
      const receita = monthTrans
        .filter(t => t.type === 'receita')
        .reduce((acc, t) => acc + Number(t.amount), 0)
        
      const despesa = monthTrans
        .filter(t => t.type !== 'receita')
        .reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0)

      return { name: monthLabel, Receita: receita, Despesa: despesa }
    })
  }, [transactions])

  // Custom Tooltip para ficar bonito
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a1a] border border-white/10 p-3 rounded-xl shadow-xl">
          <p className="font-bold text-gray-200 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (transactions.length === 0) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      
      {/* GRÁFICO 1: FLUXO DE CAIXA */}
      <div className="bg-[#09090b] border border-white/10 p-6 rounded-3xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <TrendingUp size={18} className="text-blue-500" /> Fluxo Mensal (6 Meses)
        </h3>
        <div className="h-[300px] w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="#666" tickLine={false} axisLine={false} dy={10} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{fill: '#ffffff10'}} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar dataKey="Receita" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} stackId="b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRÁFICO 2: GASTOS POR CATEGORIA */}
      <div className="bg-[#09090b] border border-white/10 p-6 rounded-3xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <PieIcon size={18} className="text-purple-500" /> Onde você gasta mais?
        </h3>
        <div className="h-[300px] w-full flex items-center justify-center text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{fontSize: '11px'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}