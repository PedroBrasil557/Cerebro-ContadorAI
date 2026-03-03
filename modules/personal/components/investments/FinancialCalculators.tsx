'use client'

import React, { useState, useEffect } from 'react'
import { Calculator, TrendingUp, DollarSign, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'

export default function FinancialCalculators() {
  const [activeCalc, setActiveCalc] = useState<'cdi' | 'juros'>('cdi')
  
  // Taxa Selic Real e Estados da Calculadora CDI
  const [selicRate, setSelicRate] = useState<number>(0)
  const [cdiRate, setCdiRate] = useState<number>(0)
  const [loadingRates, setLoadingRates] = useState(true)
  
  const [cdiAmount, setCdiAmount] = useState(1000)
  const [cdiPercent, setCdiPercent] = useState(100)
  const [cdiMonths, setCdiMonths] = useState(12)

  // Estados da Calculadora Juros Compostos
  const [jcInitial, setJcInitial] = useState(1000)
  const [jcMonthly, setJcMonthly] = useState(500)
  const [jcRate, setJcRate] = useState(1)
  const [jcYears, setJcYears] = useState(10)

  // BUSCA A TAXA SELIC REAL DO BANCO CENTRAL DO BRASIL
  useEffect(() => {
    async function fetchSelic() {
        try {
            // API do Sistema Gerenciador de Séries Temporais (SGS) do BCB - Código 432 (Taxa Selic Meta)
            const response = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json')
            const data = await response.json()
            if (data && data.length > 0) {
                const currentSelic = Number(data[0].valor)
                setSelicRate(currentSelic)
                setCdiRate(currentSelic - 0.10) // CDI costuma ser a Selic - 0.10%
            } else {
                throw new Error("Dados da Selic não encontrados")
            }
        } catch (error) {
            console.error("Falha ao buscar Selic do BCB, usando fallback.", error)
            // Fallback para taxa aproximada de Fevereiro de 2026
            setSelicRate(11.25) 
            setCdiRate(11.15)
        } finally {
            setLoadingRates(false)
        }
    }
    fetchSelic()
  }, [])

  // --- LÓGICA DE CÁLCULO ---
  
  // Cálculo CDI (Simples para demonstração - Não considera IR)
  const calcCdi = () => {
    const annualRate = (cdiPercent / 100) * (cdiRate / 100)
    const monthlyRate = Math.pow(1 + annualRate, 1/12) - 1
    const finalAmount = cdiAmount * Math.pow(1 + monthlyRate, cdiMonths)
    const profit = finalAmount - cdiAmount
    return { final: finalAmount, profit }
  }

  // Cálculo Juros Compostos
  const calcJuros = () => {
    const months = jcYears * 12
    const rate = jcRate / 100
    let total = jcInitial
    let totalInvested = jcInitial

    for (let i = 0; i < months; i++) {
        total = total * (1 + rate) + jcMonthly
        totalInvested += jcMonthly
    }
    return { final: total, invested: totalInvested, profit: total - totalInvested }
  }

  const cdiResult = calcCdi()
  const jcResult = calcJuros()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-[#09090b]/80 border border-white/5 p-6 rounded-3xl backdrop-blur-xl">
        
        {/* MENU DE SELEÇÃO */}
        <div className="lg:col-span-2 flex gap-4 border-b border-white/10 pb-4">
            <button onClick={() => setActiveCalc('cdi')} className={`flex items-center gap-2 font-bold px-4 py-2 rounded-xl transition ${activeCalc === 'cdi' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <TrendingUp size={18} /> Simulador CDI
            </button>
            <button onClick={() => setActiveCalc('juros')} className={`flex items-center gap-2 font-bold px-4 py-2 rounded-xl transition ${activeCalc === 'juros' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <Calculator size={18} /> Juros Compostos
            </button>
        </div>

        {/* INPUTS DA CALCULADORA ATIVA */}
        <div className="space-y-5">
            {activeCalc === 'cdi' ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="flex justify-between items-center bg-blue-900/20 border border-blue-500/20 p-4 rounded-xl mb-6">
                        <span className="text-sm font-bold text-blue-400">Taxa Selic Hoje (BCB)</span>
                        {loadingRates ? <Loader2 size={16} className="animate-spin text-blue-500"/> : <span className="text-xl font-black text-white">{selicRate.toFixed(2)}% a.a.</span>}
                    </div>

                    <div><label className="text-xs font-bold text-gray-500 uppercase">Valor Inicial (R$)</label><input type="number" value={cdiAmount} onChange={e => setCdiAmount(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-gray-500 uppercase">% do CDI</label><input type="number" value={cdiPercent} onChange={e => setCdiPercent(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500" /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Prazo (Meses)</label><input type="number" value={cdiMonths} onChange={e => setCdiMonths(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500" /></div>
                    </div>
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Valor Inicial (R$)</label><input type="number" value={jcInitial} onChange={e => setJcInitial(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-purple-500" /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Aporte Mensal (R$)</label><input type="number" value={jcMonthly} onChange={e => setJcMonthly(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-purple-500" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Taxa Mensal (%)</label><input type="number" step="0.1" value={jcRate} onChange={e => setJcRate(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-purple-500" /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Período (Anos)</label><input type="number" value={jcYears} onChange={e => setJcYears(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-purple-500" /></div>
                    </div>
                </motion.div>
            )}
        </div>

        {/* DISPLAY DE RESULTADOS */}
        <div className="bg-[#121214] border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col justify-center relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-24 rounded-full blur-3xl pointer-events-none transition-colors ${activeCalc === 'cdi' ? 'bg-blue-600/10' : 'bg-purple-600/10'}`} />
            
            <div className="relative z-10 text-center mb-6">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Valor Bruto Final</p>
                <h3 className="text-4xl md:text-5xl font-black text-white truncate">
                    {formatCurrency(activeCalc === 'cdi' ? cdiResult.final : jcResult.final)}
                </h3>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                <div className="text-center">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Total Investido</p>
                    <p className="text-lg font-bold text-gray-300">{formatCurrency(activeCalc === 'cdi' ? cdiAmount : jcResult.invested)}</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] text-emerald-500 font-bold uppercase mb-1">Rendimento (Juros)</p>
                    <p className="text-lg font-bold text-emerald-400">+{formatCurrency(activeCalc === 'cdi' ? cdiResult.profit : jcResult.profit)}</p>
                </div>
            </div>
            <p className="text-[9px] text-gray-600 text-center mt-6">Simulação aproximada. Não considera inflação nem impostos (IR/IOF).</p>
        </div>
    </div>
  )
}