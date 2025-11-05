// components/dashboard/ChartsComponent.tsx
'use client'

import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart, 
  Line,      
  XAxis,
  YAxis,
  Tooltip, 
  Legend,
  CartesianGrid,
} from 'recharts'
// Usamos as cores e utilitários já definidos no projeto
import { PIE_CHART_COLORS } from '../../lib/constants' 
import { formatCurrency } from '@/lib/utils'

type ChartsProps = {
  categoryData: { name: string; value: number }[]
  balanceData: { name: string; Receitas: number; Despesas: number }[]
}

// NOVO: Tooltip Customizado (Para resolver o problema de ficar embaixo)
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    // O Valor Total do PieChart é a soma dos valores
    const totalValue = payload.reduce((acc: number, entry: any) => acc + entry.value, 0);
    const percent = (data.value / totalValue * 100).toFixed(1);

    return (
      <div className="rounded-md border border-gray-500 bg-card-dark p-3 shadow-lg text-sm text-white z-50">
        <p className="font-semibold">{data.name}</p>
        <p className="text-sm text-gray-400">
          Valor: {formatCurrency(data.value)} ({isNaN(percent) ? 0 : percent}%)
        </p>
      </div>
    );
  }
  return null;
};

// NOVO: Legenda Customizada (Adiciona o percentual)
const CustomPieLegend = (props: any) => {
  const { payload } = props;
  return (
    <ul className="flex flex-col gap-3">
      {payload.map((entry: any, index: number) => {
        const data = entry.payload;
        // Pega o percentual que já deve vir no dado (ou recalcula, mas usaremos o valor da Rosca)
        const percent = data.value > 0 ? (data.value / props.totalValue * 100).toFixed(1) : 0;
        
        return (
          <li key={`item-${index}`} className="flex items-center gap-3 text-sm">
            <span className="h-4 w-4 rounded" style={{ backgroundColor: entry.color }}></span>
            <span className="text-text-secondary-dark">{entry.value}</span>
            <span className="font-semibold text-text-light-dark">
              ({percent}%)
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export default function ChartsComponent({
  categoryData,
  balanceData,
}: ChartsProps) {
    
    // Calcula o valor total (necessário para a legenda customizada)
    const totalSpent = categoryData.reduce((acc, entry) => acc + entry.value, 0);

    const evolutionData = [
        { name: 'Jan', Saldo: 2000 },
        { name: 'Fev', Saldo: 1800 },
        { name: 'Mar', Saldo: 3000 },
        { name: 'Abr', Saldo: 2500 },
        { name: 'Mai', Saldo: 3500 },
        { name: 'Jun', Saldo: 4000 },
    ];
    
    const hasCategoryData = categoryData && categoryData.some(d => d.value > 0);
    const finalCategoryData = hasCategoryData ? categoryData : [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      
      {/* 1. Gráfico de Evolução (Linhas) - Ocupa 2 colunas */}
      <div className="rounded-2xl border border-gray-700 bg-card-dark p-6 shadow-sm lg:col-span-2">
        <h3 className="mb-4 text-xl font-semibold text-text-light-dark">
          Evolução Mensal
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer>
            {/* ... (LineChart omitido) ... */}
            <LineChart data={evolutionData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#4A5568" />
              <XAxis dataKey="name" fontSize={12} stroke="#CBD5E0" tickLine={false} axisLine={false} />
              <YAxis fontSize={12} stroke="#CBD5E0" tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value / 1000}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: '#2D3748', border: 'none' }}/>
              <Line type="monotone" dataKey="Saldo" stroke="#7C3AED" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Gráfico de Gastos (Pizza) - Ocupa 3 colunas */}
      <div className="rounded-2xl border border-gray-700 bg-card-dark p-6 shadow-sm lg:col-span-3">
        <h3 className="mb-4 text-xl font-semibold text-text-light-dark">
          Gastos por Categoria
        </h3>
        <div className="h-80 w-full">
          {finalCategoryData.length > 0 ? (
            <ResponsiveContainer>
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Pie
                  data={finalCategoryData}
                  // CORREÇÃO: Centralizamos o gráfico para dar espaço à legenda na direita.
                  cx="40%" 
                  cy="50%"
                  innerRadius={70} 
                  outerRadius={100} 
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {finalCategoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                {/* CORREÇÃO: Usamos o Tooltip Customizado com z-index alto */}
                <Tooltip content={<CustomPieTooltip totalValue={totalSpent} />} wrapperStyle={{ zIndex: 1000 }}/> 
                <Legend
                  content={<CustomPieLegend totalValue={totalSpent} />}
                  layout="vertical"
                  verticalAlign="middle"
                  align="right" 
                  // Mantenha o padding para afastar a legenda (30% do container)
                  wrapperStyle={{ paddingLeft: '10%' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-text-secondary-dark">
              Sem dados de despesa para exibir no gráfico.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}