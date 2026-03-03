'use client'

import React from 'react'

export interface CdiCardProps {
  cdiRate: number
  change?: number // variação CDI
  className?: string
}

export default function CdiCard({ cdiRate, change = 0, className = '' }: CdiCardProps) {
  const isUp = change >= 0
  return (
    <div className={`p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg ${className}`}>
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">CDI Atual</h2>
      <div className="flex items-center justify-center gap-4">
        <span className="text-3xl font-bold text-violet-600 dark:text-violet-400">
          {(cdiRate * 100).toFixed(2)}%
        </span>
        {change !== 0 && (
          <span className={`text-sm font-semibold ${isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 text-center">
        Rentabilidade anual aproximada
      </p>
    </div>
  )
}
