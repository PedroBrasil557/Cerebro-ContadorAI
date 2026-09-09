import React from 'react'
import { CreditCard } from '@/types_db'
import { motion } from 'framer-motion'
import { CreditCard as CardIcon } from 'lucide-react'

interface CreditCardSummaryProps {
  cards: CreditCard[]
}

export default function CreditCardSummary({ cards }: CreditCardSummaryProps) {
  // Estado vazio
  if (!cards || cards.length === 0) {
    return (
      <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
        <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
            <CardIcon className="h-6 w-6 text-gray-500" />
        </div>
        <p className="text-sm font-bold text-white">Nenhum cartão</p>
        <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
           Adicione seus cartões para monitorar limites e faturas em tempo real.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
           <CardIcon className="h-4 w-4 text-blue-500" /> Cartões de Crédito
        </h3>
        <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-1 rounded-full">
           {cards.length} ATIVOS
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
        {cards.map((card) => {
            // --- CORREÇÃO: Usando os novos nomes das propriedades ---
            const limit = Number(card.limit_amount) // Antes era card.limit
            const current = Number(card.current_invoice)
            
            // Calcula porcentagem de uso
            const usagePercent = limit > 0 ? Math.min((current / limit) * 100, 100) : 0
            
            // CORREÇÃO: Usando due_day (número) em vez de due_date (string)
            const dueDayDisplay = card.due_day

            return (
                <div key={card.id} className="group relative">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                             {/* Ícone da marca estilizado */}
                             <div 
                                className="h-8 w-10 rounded bg-gradient-to-br flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300"
                                style={{ 
                                    backgroundImage: `linear-gradient(to bottom right, ${card.color_start || '#333'}, ${card.color_end || '#000'})` 
                                }}
                             >
                                 <span className="text-[8px] font-black text-white/90 uppercase tracking-tighter">
                                    {card.brand}
                                 </span>
                             </div>
                             <div>
                                 <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                                     {card.name}
                                 </p>
                                 <p className="text-[10px] text-gray-500">
                                     Vence dia <span className="text-gray-300">{dueDayDisplay}</span>
                                 </p>
                             </div>
                        </div>
                        <div className="text-right">
                             <p className="text-xs font-bold text-white">
                                 R$ {current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                             </p>
                             <p className="text-[10px] text-gray-500">
                                 de R$ {limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                             </p>
                        </div>
                    </div>
                    
                    {/* Barra de Progresso Visual */}
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                        {/* Background do track */}
                        <div className="absolute inset-0 bg-white/5" />
                        
                        <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${usagePercent}%` }}
                           transition={{ duration: 1.2, ease: "easeOut" }}
                           className={`h-full rounded-full relative z-10 ${
                               usagePercent > 90 ? 'bg-gradient-to-r from-red-600 to-red-500' : 
                               usagePercent > 70 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 
                               'bg-gradient-to-r from-blue-600 to-cyan-500'
                           }`}
                        />
                    </div>
                </div>
            )
        })}
      </div>
      
      {/* Footer com Totalizador */}
      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
         <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total em Faturas</span>
         <span className="text-sm font-bold text-white bg-white/5 px-3 py-1 rounded-lg">
            R$ {cards.reduce((acc, c) => acc + Number(c.current_invoice), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
         </span>
      </div>
    </div>
  )
}
