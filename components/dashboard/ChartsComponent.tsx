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
import { PIE_CHART_COLORS } from '../../lib/constants' 
import { formatCurrency } from '@/lib/utils'

type ChartsProps = {
  categoryData: { name: string; value: number }[]
  balanceData: { name: string; Receitas: number; Despesas: number }[]
}

// Componente customizado para a legenda do Gráfico de Pizza
const CustomPieLegend = ({ payload }: any) => {
  return (
    <ul className="flex flex-col gap-3">
      {payload.map((entry: any, index: number) => (
        <li key={`item-${index}`} className="flex items-center gap-3 text-sm">
          <span
            className="h-4 w-4 rounded"
            style={{ backgroundColor: entry.color }}
          ></span>
          <span className="text-text-light dark:text-gray-400">{entry.value}</span>
          <span className="font-semibold text-text-dark dark:text-white">
            ({(isNaN(entry.payload.percent) ? 0 : entry.payload.percent * 100).toFixed(0)}%)
          </span>
        </li>
      ))}
    </ul>
  )
}

// Componente customizado para o Tooltip da PieChart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      // Tooltip com Z-INDEX mais alto (shadow-lg ajuda)
      <div className="rounded-md border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800 text-sm">
        <p className="font-semibold text-text-dark dark:text-white">{data.name}</p>
        <p className="text-text-light dark:text-gray-400">
          Valor: {formatCurrency(data.value)} ({(data.percent * 100).toFixed(0)}%)
        </p>
      </div>
    );
  }
  return null;
};


export default function ChartsComponent({
  categoryData,
  balanceData,
}: ChartsProps) {
    // Dados de Evolução Mocados
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
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-2">
        <h3 className="mb-4 text-xl font-semibold text-text-dark dark:text-white">
          Evolução Mensal
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer>
            <LineChart data={evolutionData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
              <XAxis
                dataKey="name"
                fontSize={12}
                stroke="#6C757D"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={12}
                stroke="#6C757D"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$${value / 1000}k`}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ color: '#111827' }}
              />
              <Line
                type="monotone"
                dataKey="Saldo"
                stroke="#6C63FF"
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Gráfico de Gastos (Pizza) - Ocupa 3 colunas */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-3">
        <h3 className="mb-4 text-xl font-semibold text-text-dark dark:text-white">
          Gastos por Categoria
        </h3>
        <div className="h-80 w-full">
          {finalCategoryData.length > 0 ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={finalCategoryData}
                  // Ajuste de Posição: Move o centro X para a esquerda (35%)
                  cx="35%" 
                  cy="50%"
                  innerRadius={70} 
                  outerRadius={100} 
                  fill="#8884d8"
                  paddingAngle={5}
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
                {/* Tooltip customizado garante que ele apareça sobre a legenda */}
                <Tooltip content={<CustomPieTooltip />} /> 
                <Legend
                  content={<CustomPieLegend />}
                  layout="vertical"
                  verticalAlign="middle"
                  align="right" 
                  // Aumenta o padding para afastar a legenda do gráfico
                  wrapperStyle={{ paddingLeft: '30px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-text-light dark:text-gray-400">
              Sem dados de despesa para exibir no gráfico.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}