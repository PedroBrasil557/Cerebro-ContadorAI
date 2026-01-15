'use client'

import React from 'react'
import { Hourglass } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type SurvivalProps = {
  totalReserva: number
  custoVidaMensal: number // Média de gastos dos últimos 3 meses
}

export default function SurvivalTimeCard({ totalReserva, custoVidaMensal }: SurvivalProps) {
  // Evitar divisão por zero
  const safeCusto = custoVidaMensal > 0 ? custoVidaMensal : 1;
  
  const mesesSobrevivencia = totalReserva / safeCusto;
  const mesesInteiros = Math.floor(mesesSobrevivencia);
  const diasRestantes = Math.round((mesesSobrevivencia - mesesInteiros) * 30);

  // Define a cor de segurança
  const getStatusColor = () => {
    if (mesesSobrevivencia >= 6) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (mesesSobrevivencia >= 3) return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    return 'text-red-400 border-red-500/30 bg-red-500/10';
  }

  const statusStyle = getStatusColor();

  return (
    <div className={`rounded-2xl border p-6 backdrop-blur-md ${statusStyle} transition-all duration-500`}>
      <div className="flex items-start justify-between">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold opacity-80">
            <Hourglass className="h-4 w-4" />
            Tempo de Autonomia
          </h4>
          
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tighter">
                {mesesInteiros}
              </span>
              <span className="text-lg font-medium opacity-80">meses</span>
            </div>
            {diasRestantes > 0 && (
              <p className="text-sm opacity-70">
                e aproximadamente {diasRestantes} dias
              </p>
            )}
          </div>
        </div>

        {/* Mini barra lateral visual */}
        <div className="h-20 w-1.5 rounded-full bg-black/20 dark:bg-white/10">
          <div 
            className="w-full rounded-full bg-current transition-all duration-1000"
            style={{ height: `${Math.min(mesesSobrevivencia * 10, 100)}%` }} // Max 10 meses na barra visual
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-current/20 pt-4 text-xs">
        <span>Baseado no custo mensal:</span>
        <span className="font-bold">{formatCurrency(custoVidaMensal)}</span>
      </div>
    </div>
  )
}