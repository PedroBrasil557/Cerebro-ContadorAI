'use client'

import React from 'react'
import { motion } from 'framer-motion' // Instalar: npm install framer-motion
import { ShieldCheck, AlertTriangle, TrendingUp } from 'lucide-react'

type HealthProps = {
  score: number // 0 a 1000
}

export default function FinancialHealthGauge({ score }: HealthProps) {
  // Cálculo da cor baseado no score
  const getColor = (s: number) => {
    if (s >= 800) return '#10B981' // Emerald
    if (s >= 600) return '#3B82F6' // Blue
    if (s >= 400) return '#F59E0B' // Amber
    return '#EF4444' // Red
  }

  const color = getColor(score)
  const percentage = score / 10; // Converter 1000 para 100%

  // Lógica de mensagem
  const getMessage = () => {
    if (score >= 800) return { text: "Excelente", icon: ShieldCheck }
    if (score >= 600) return { text: "Estável", icon: TrendingUp }
    return { text: "Atenção", icon: AlertTriangle }
  }

  const info = getMessage()

  return (
    <div className="glass-panel glass-panel-hover relative flex flex-col items-center justify-center rounded-2xl p-6">
      <h3 className="mb-4 text-sm font-medium text-gray-400">Saúde Financeira</h3>
      
      {/* SVG Gauge Customizado */}
      <div className="relative h-32 w-48 overflow-hidden">
        <svg viewBox="0 0 100 50" className="h-full w-full">
          {/* Fundo do arco */}
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#374151" strokeWidth="8" strokeLinecap="round" />
          
          {/* Arco de progresso animado */}
          <motion.path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="126" // Comprimento total do arco
            strokeDashoffset={126 - (126 * percentage) / 100}
            initial={{ strokeDashoffset: 126 }}
            animate={{ strokeDashoffset: 126 - (126 * percentage) / 100 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        
        {/* Score Central */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
          <motion.span 
            className="text-4xl font-bold text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-sm font-medium" style={{ color: color }}>
        <info.icon className="h-4 w-4" />
        {info.text}
      </div>
      
      <p className="mt-2 text-center text-xs text-gray-500">
        Baseado em dívidas, reserva e gastos.
      </p>
    </div>
  )
}