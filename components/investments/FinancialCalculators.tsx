'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, TrendingUp, Target, DollarSign } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function FinancialCalculators() {
  const [activeTab, setActiveTab] = useState<'juros' | 'selic' | 'fire'>('juros')

  return (
    <div className="bg-[#09090b] border border-white/5 rounded-3xl p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
           <h2 className="text-lg font-bold text-white flex items-center gap-2">
             <Calculator className="text-blue-500" size={20} />
             Simuladores Premium
           </h2>
           <p className="text-gray-400 text-xs">Planeje seu futuro com precisão matemática.</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl">
           {['juros', 'selic', 'fire'].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                 activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
               }`}
             >
               {tab === 'juros' ? 'Juros Compostos' : tab === 'selic' ? 'Selic' : 'FIRE'}
             </button>
           ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'juros' && <CompoundCalculator key="juros" />}
        {activeTab === 'selic' && <SelicSimulator key="selic" />}
        {activeTab === 'fire' && <FireCalculator key="fire" />}
      </AnimatePresence>
    </div>
  )
}

function CompoundCalculator() {
  const [initial, setInitial] = useState(1000)
  const [monthly, setMonthly] = useState(500)
  const [rate, setRate] = useState(10)
  const [years, setYears] = useState(10)

  const data = Array.from({ length: years + 1 }, (_, i) => {
    const totalMonths = i * 12
    const rateMonthly = rate / 100 / 12
    const value = initial * Math.pow(1 + rateMonthly, totalMonths) + 
                  monthly * ((Math.pow(1 + rateMonthly, totalMonths) - 1) / rateMonthly)
    return { year: i, value: Math.round(value) }
  })

  const finalValue = data[data.length - 1].value
  const invested = initial + (monthly * years * 12)
  const interest = finalValue - invested

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <InputGroup label="Aporte Inicial (R$)" value={initial} onChange={setInitial} />
        <InputGroup label="Aporte Mensal (R$)" value={monthly} onChange={setMonthly} />
        <InputGroup label="Taxa Anual (%)" value={rate} onChange={setRate} />
        <div className="space-y-2">
           <label className="text-xs text-gray-400 font-bold uppercase">Tempo: {years} anos</label>
           <input type="range" min="1" max="50" value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full accent-blue-600 bg-white/10 h-2 rounded-lg appearance-none cursor-pointer" />
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl p-6 flex flex-col justify-between border border-white/5">
         <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
               <p className="text-xs text-gray-400">Total Investido</p>
               <p className="text-white font-bold">R$ {invested.toLocaleString('pt-BR')}</p>
            </div>
            <div>
               <p className="text-xs text-emerald-400">Juros Ganhos</p>
               <p className="text-emerald-400 font-bold">+ R$ {interest.toLocaleString('pt-BR')}</p>
            </div>
         </div>
         <div className="mb-2">
            <p className="text-sm text-gray-400">Montante Final</p>
            <p className="text-3xl font-bold text-white tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
               R$ {finalValue.toLocaleString('pt-BR')}
            </p>
         </div>
         <div className="h-40 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={data}>
                  <defs>
                     <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                     </linearGradient>
                  </defs>
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>
    </motion.div>
  )
}

function SelicSimulator() {
   // Simulação simplificada de Selic
   const [value, setValue] = useState(10000)
   const dailyRate = Math.pow(1 + 0.1125, 1/252) - 1
   const monthValue = value * Math.pow(1 + dailyRate, 21)

   return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
         <div className="bg-emerald-900/20 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3">
            <TrendingUp className="text-emerald-400" />
            <div>
               <h4 className="text-emerald-400 font-bold text-sm">Rentabilidade Atual da Selic</h4>
               <p className="text-white text-xs">11.25% ao ano (Bruto)</p>
            </div>
         </div>
         <InputGroup label="Valor para Investir (R$)" value={value} onChange={setValue} />
         
         <div className="grid grid-cols-3 gap-4 mt-4">
            <ResultCard label="Em 1 Mês" value={monthValue} />
            <ResultCard label="Em 6 Meses" value={value * Math.pow(1 + dailyRate, 126)} />
            <ResultCard label="Em 1 Ano" value={value * 1.1125} />
         </div>
      </motion.div>
   )
}

function FireCalculator() {
   const [monthlySpend, setMonthlySpend] = useState(5000)
   const fireNumber = monthlySpend * 12 * 25 // Regra dos 4%

   return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center space-y-6 py-4">
         <div className="p-4 bg-orange-500/10 rounded-full mb-2">
            <Target className="text-orange-500 w-8 h-8" />
         </div>
         <h3 className="text-xl font-bold text-white">Independência Financeira (F.I.R.E.)</h3>
         <div className="w-full max-w-sm">
            <InputGroup label="Gasto Mensal Desejado (R$)" value={monthlySpend} onChange={setMonthlySpend} />
         </div>
         <div className="bg-[#1a1a1c] p-6 rounded-2xl border border-white/5 w-full max-w-md">
            <p className="text-gray-400 text-sm mb-2">Você precisa acumular:</p>
            <p className="text-4xl font-bold text-white">R$ {fireNumber.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-gray-500 mt-2">Baseado na regra segura de retirada de 4% ao ano.</p>
         </div>
      </motion.div>
   )
}

// Helpers
const InputGroup = ({ label, value, onChange }: any) => (
   <div className="space-y-1">
      <label className="text-xs text-gray-400 font-bold uppercase">{label}</label>
      <input 
         type="number" 
         value={value} 
         onChange={(e) => onChange(Number(e.target.value))} 
         className="w-full bg-[#1a1a1c] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors font-mono"
      />
   </div>
)

const ResultCard = ({ label, value }: any) => (
   <div className="bg-white/5 p-3 rounded-xl border border-white/5">
      <p className="text-[10px] text-gray-400 uppercase">{label}</p>
      <p className="text-white font-bold font-mono">R$ {Math.round(value).toLocaleString('pt-BR')}</p>
   </div>
)