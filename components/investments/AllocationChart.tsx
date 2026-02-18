'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Investment } from '@/types_db'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#6366f1'];

interface Props {
  investments: Investment[]
}

export default function AllocationChart({ investments }: Props) {
  // 1. Agrupar investimentos por tipo e somar os valores
  const data = investments.reduce((acc: any[], curr) => {
    const existing = acc.find(i => i.name === curr.type)
    // Calcula o valor total deste ativo (Quantidade * Preço Atual)
    const value = curr.quantity * curr.current_price
    
    if (existing) {
      existing.value += value
    } else {
      acc.push({ name: curr.type, value })
    }
    return acc
  }, []).map(item => ({
     ...item,
     // Formata o nome (ex: 'renda_fixa' -> 'RENDA FIXA')
     name: item.name.replace('_', ' ').toUpperCase()
  }))

  // Se não houver dados, mostra mensagem vazia
  if (data.length === 0) {
     return (
        <div className="h-[350px] flex items-center justify-center text-gray-500 text-xs bg-[#09090b] rounded-3xl border border-white/5">
           Sem dados de alocação
        </div>
     )
  }

  return (
    <div className="bg-[#09090b] border border-white/5 rounded-3xl p-6 h-[400px] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
         <div className="w-1 h-4 bg-blue-500 rounded-full"/>
         <h3 className="text-white font-bold text-sm">Alocação de Ativos</h3>
      </div>
      
      <div className="flex-1 w-full min-h-0">
         <ResponsiveContainer width="100%" height="100%">
            <PieChart>
               <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={80} // Aumentei um pouco para ficar mais moderno (Donut Chart)
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
               >
                  {data.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
               </Pie>
               
               <Tooltip 
                  // CORREÇÃO DO ERRO AQUI:
                  // Aceitamos 'any' ou 'number | string' para evitar conflito com a tipagem do Recharts
                  formatter={(value: any) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  contentStyle={{ 
                     backgroundColor: '#18181b', 
                     border: '1px solid #27272a', 
                     borderRadius: '12px', 
                     color: '#fff',
                     boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                  }}
                  itemStyle={{ color: '#e4e4e7', fontSize: '12px', fontWeight: 500 }}
                  separator=": "
               />
               
               <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }}
               />
            </PieChart>
         </ResponsiveContainer>
      </div>
    </div>
  )
}