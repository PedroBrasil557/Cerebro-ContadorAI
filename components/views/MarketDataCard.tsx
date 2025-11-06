'use client'

import React from 'react'

export type MarketDataItem = {
  name: string
  value: number
  change?: number // % de variação
}

export interface MarketDataCardProps {
  marketData: MarketDataItem[]
  className?: string
}

export default function MarketDataCard({ marketData, className = '' }: MarketDataCardProps) {
  return (
    <div className={`p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg ${className}`}>
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
        Mercado Global
      </h2>
      <ul className="space-y-3">
        {marketData.map((item, idx) => {
          const isUp = item.change && item.change >= 0
          return (
            <li
              key={idx}
              className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="font-medium text-gray-700 dark:text-gray-200">{item.name}</span>
              <div className="flex items-center gap-2">
                {item.change !== undefined && (
                  <span
                    className={`text-sm font-semibold ${
                      isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {isUp ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}%
                  </span>
                )}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
