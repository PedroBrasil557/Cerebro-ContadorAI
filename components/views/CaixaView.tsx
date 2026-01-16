'use client'

import React, { useState } from 'react'
import { CaixaData } from '@/types_db'
import { formatCurrency } from '@/lib/utils'
import { 
  Landmark, TrendingUp, TrendingDown, ShieldCheck, 
  PieChart, Activity, AlertTriangle, ArrowRight, Calendar, DollarSign 
} from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from 'recharts'

// Dados Mockados para Projeção de Fluxo de Caixa (Premium Feature)
const CASH_FLOW_DATA = [
  { name: 'Sem 1', entrada: 5000, saida: 2000, saldo: 3000 },
  { name: 'Sem 2', entrada: 7500, saida: 3500, saldo: 7000 },
  { name: 'Sem 3', entrada: 4200, saida: 1200, saldo: 10000 },
  { name: 'Sem 4', entrada: 8900, saida: 4000, saldo: 14900 },
]

export default function CaixaView({ data }: { data: CaixaData }) {
  const [activeTab, setActiveTab] = useState<'geral' | 'provisao' | 'impostos'>('geral')

  // Cálculos Premium
  const burnRate = 1200 // Gasto médio mensal fixo (Exemplo)
  const runway = data.currentBalance / burnRate // Meses de vida
  const taxProvision = data.currentBalance * 0.15 // 15% para impostos
  const profitDistribution = data.currentBalance * 0.20 // 20% Lucro Sócios

  return (
    <div className="relative min-h-screen w-full animate-in fade-in duration-500 overflow-hidden">
      
      {/* BACKGROUND THEME OVERRIDE (Azul Caixa Premium) */}
      <div className="absolute inset-0 bg-[#002855] z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#F68B1F] opacity-10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#005CA9] opacity-20 blur-[100px] rounded-full pointer-events-none" />
      </div>

      <div className="relative z-10 p-6 md:p-8 space-y-8">
        
        {/* HEADER CORPORATIVO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6">
           <div>
              <div className="flex items-center gap-2 mb-2">
                 <div className="bg-[#F68B1F] p-1.5 rounded-md">
                    <Landmark className="h-5 w-5 text-white" />
                 </div>
                 <span className="text-[#F68B1F] font-bold tracking-widest text-xs uppercase">Corporate Treasury</span>
              </div>
              <h2 className="text-4xl font-black text-white tracking-tight">Caixa Empresarial</h2>
              <p className="text-blue-200">Gestão de alta performance e controle de liquidez.</p>
           </div>
           
           {/* KPI de Runway (Sobrevivência) */}
           <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-center gap-4">
              <div className={`p-3 rounded-full ${runway > 6 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                 <Activity className="h-6 w-6" />
              </div>
              <div>
                 <p className="text-xs text-blue-200 uppercase font-bold">Runway (Sobrevivência)</p>
                 <p className="text-xl font-bold text-white">{runway.toFixed(1)} Meses</p>
              </div>
           </div>
        </div>

        {/* CARDS DE LIQUIDEZ (Visual Bancário) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Card Principal - Saldo */}
           <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-[#005CA9] to-[#003566] p-8 rounded-2xl shadow-2xl border border-white/10 relative overflow-hidden group">
              <div className="absolute right-0 top-0 h-full w-1/2 bg-[url('/bg-grid.svg')] opacity-10" />
              <div className="relative z-10">
                 <p className="text-blue-200 font-medium mb-1">Saldo Disponível (Livre)</p>
                 <h3 className="text-5xl font-black text-white mb-6">{formatCurrency(data.currentBalance)}</h3>
                 
                 <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                       <TrendingUp className="h-4 w-4" />
                       <span className="text-sm font-bold">+12% vs. mês anterior</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-200 bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                       <ShieldCheck className="h-4 w-4" />
                       <span className="text-sm">Reserva Protegida</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Painel de Obrigações (Side Panel) */}
           <div className="bg-[#001D3D] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                 <h4 className="text-white font-bold flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-4 w-4 text-[#F68B1F]" /> Obrigações Futuras
                 </h4>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                       <span className="text-sm text-blue-200">Provisão Impostos (15%)</span>
                       <span className="text-white font-bold">{formatCurrency(taxProvision)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                       <span className="text-sm text-blue-200">Distribuição Lucros (20%)</span>
                       <span className="text-white font-bold">{formatCurrency(profitDistribution)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                       <span className="text-sm text-gray-400">Total Comprometido</span>
                       <span className="text-[#F68B1F] font-bold">{formatCurrency(taxProvision + profitDistribution)}</span>
                    </div>
                 </div>
              </div>
              <button className="w-full mt-4 bg-[#F68B1F] hover:bg-[#d47313] text-white font-bold py-3 rounded-lg transition shadow-lg shadow-orange-900/20">
                 Realizar Aportes
              </button>
           </div>
        </div>

        {/* ÁREA DE GESTÃO AVANÇADA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Gráfico de Fluxo de Caixa (Chart) */}
           <div className="lg:col-span-2 bg-[#001D3D] border border-white/10 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-400" /> Fluxo de Caixa Projetado
                 </h3>
                 <select className="bg-[#002855] border border-white/10 text-white text-sm rounded-lg p-2 outline-none">
                    <option>Próximos 30 dias</option>
                    <option>Este Trimestre</option>
                 </select>
              </div>
              
              <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={CASH_FLOW_DATA}>
                       <defs>
                          <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#F68B1F" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#F68B1F" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                       <Tooltip 
                          contentStyle={{ backgroundColor: '#002855', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          itemStyle={{ color: '#fff' }}
                       />
                       <Area type="monotone" dataKey="saldo" stroke="#F68B1F" strokeWidth={3} fillOpacity={1} fill="url(#colorSaldo)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Cofres Inteligentes (Vaults) */}
           <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#003566] to-[#001D3D] border border-white/10 rounded-2xl p-6">
                 <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-400" /> Distribuição Automática
                 </h3>
                 <p className="text-xs text-blue-200 mb-6">
                    Baseado na regra dos 20%, cada entrada é automaticamente segmentada.
                 </p>
                 
                 <div className="space-y-4">
                    {/* Cofre 1 */}
                    <div>
                       <div className="flex justify-between text-sm mb-1">
                          <span className="text-white">Reinvestimento</span>
                          <span className="text-emerald-400 font-bold">60%</span>
                       </div>
                       <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-[60%]" />
                       </div>
                    </div>
                    {/* Cofre 2 */}
                    <div>
                       <div className="flex justify-between text-sm mb-1">
                          <span className="text-white">Reserva de Risco</span>
                          <span className="text-[#F68B1F] font-bold">20%</span>
                       </div>
                       <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                          <div className="h-full bg-[#F68B1F] w-[20%]" />
                       </div>
                    </div>
                    {/* Cofre 3 */}
                    <div>
                       <div className="flex justify-between text-sm mb-1">
                          <span className="text-white">Lucro Líquido</span>
                          <span className="text-blue-400 font-bold">20%</span>
                       </div>
                       <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 w-[20%]" />
                       </div>
                    </div>
                 </div>
              </div>

              {/* Botão de Auditoria */}
              <button className="w-full group flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
                 <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                       <DollarSign className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                       <p className="text-sm font-bold text-white">Extrato Consolidado</p>
                       <p className="text-xs text-gray-400">Baixar relatório fiscal</p>
                    </div>
                 </div>
                 <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-white transition" />
              </button>
           </div>
        </div>

        {/* TABELA DE REGISTROS RECENTES (Estilo Enterprise) */}
        <div className="bg-[#001D3D] border border-white/10 rounded-2xl overflow-hidden">
           <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-bold text-white">Últimas Movimentações de Caixa</h3>
              <button className="text-xs text-blue-300 hover:text-white transition">Ver todas</button>
           </div>
           <div className="p-0">
              <table className="w-full text-sm text-left">
                 <thead className="bg-[#002855] text-blue-200 uppercase text-xs font-bold">
                    <tr>
                       <th className="px-6 py-4">Data</th>
                       <th className="px-6 py-4">Origem/Destino</th>
                       <th className="px-6 py-4">Categoria</th>
                       <th className="px-6 py-4 text-right">Valor</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5 text-gray-300">
                    {data.entries.length > 0 ? data.entries.map((entry, i) => (
                       <tr key={i} className="hover:bg-white/5 transition">
                          <td className="px-6 py-4 flex items-center gap-2">
                             <Calendar className="h-3 w-3 text-gray-500" />
                             {new Date(entry.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 font-medium text-white">{entry.source}</td>
                          <td className="px-6 py-4">
                             <span className="px-2 py-1 rounded-full text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                Entrada
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-emerald-400">
                             +{formatCurrency(entry.amount)}
                          </td>
                       </tr>
                    )) : (
                       <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                             Nenhum registro encontrado no período.
                          </td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>

      </div>
    </div>
  )
}