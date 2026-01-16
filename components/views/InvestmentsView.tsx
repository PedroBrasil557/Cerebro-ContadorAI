'use client'

import React, { useState, useEffect, useRef } from 'react'
import { TrendingUp, Plus, Target, DollarSign, Bitcoin, Search, Globe, BarChart3, ArrowUpRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

// --- WIDGET TRADINGVIEW (Componente Interno) ---
const TradingViewWidget = ({ symbol }: { symbol: string }) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    
    // Limpa o container antes de criar um novo script para evitar duplicação
    container.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": symbol,
      "interval": "D",
      "timezone": "America/Sao_Paulo",
      "theme": "dark",
      "style": "1",
      "locale": "br",
      "enable_publishing": false,
      "backgroundColor": "rgba(10, 10, 10, 1)",
      "gridColor": "rgba(255, 255, 255, 0.05)",
      "hide_top_toolbar": false,
      "hide_legend": false,
      "save_image": false,
      "calendar": false,
      "hide_volume": true,
      "support_host": "https://www.tradingview.com"
    });
    container.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="h-[500px] w-full border border-white/10 rounded-xl overflow-hidden shadow-2xl relative bg-[#0a0a0a]">
      <div className="tradingview-widget-container h-full w-full" ref={container}>
        <div className="tradingview-widget-container__widget h-full w-full"></div>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function InvestmentsView({ goals, cdiRate, marketRates, onAddGoal }: any) {
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [newGoal, setNewGoal] = useState({ title: '', target_amount: '' })
  
  // Estado do Terminal
  const [activeSymbol, setActiveSymbol] = useState("BMFBOVESPA:IBOV") // Começa com IBOVESPA
  const [searchInput, setSearchInput] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
        setActiveSymbol(searchInput.toUpperCase())
        setSearchInput("")
    }
  }

  const quickSelect = (symbol: string) => setActiveSymbol(symbol)

  const handleSubmitGoal = (e: React.FormEvent) => {
    e.preventDefault()
    onAddGoal({
        title: newGoal.title,
        target_amount: Number(newGoal.target_amount)
    })
    setShowGoalForm(false)
    setNewGoal({ title: '', target_amount: '' })
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in pb-20">
      
      {/* HEADER E AÇÕES */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                <Globe className="h-8 w-8 text-indigo-500" /> 
                Terminal Global
            </h2>
            <p className="text-gray-400 text-sm">Monitoramento de mercado e gestão de patrimônio.</p>
         </div>
         <button onClick={() => setShowGoalForm(!showGoalForm)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition shadow-lg shadow-indigo-500/20">
            <Plus className="h-5 w-5" /> Nova Meta Pessoal
         </button>
      </div>

      {/* DASHBOARD RÁPIDO (CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#111] border border-white/10 p-5 rounded-xl flex items-center justify-between group hover:border-indigo-500/30 transition">
              <div>
                  <p className="text-gray-400 text-xs font-bold uppercase mb-1">Taxa CDI (Brasil)</p>
                  <p className="text-2xl font-bold text-white tracking-tight">{(cdiRate * 100).toFixed(2)}%</p>
                  <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1"><TrendingUp className="h-3 w-3" /> Rendimento fixo</p>
              </div>
              <div className="h-10 w-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500 group-hover:text-white group-hover:bg-indigo-500 transition">
                  <BarChart3 className="h-6 w-6" />
              </div>
          </div>
          
          <div className="bg-[#111] border border-white/10 p-5 rounded-xl flex items-center justify-between group hover:border-blue-500/30 transition">
              <div>
                  <p className="text-gray-400 text-xs font-bold uppercase mb-1">Dólar PTAX</p>
                  <p className="text-2xl font-bold text-white tracking-tight">R$ {marketRates?.usd?.toFixed(3) || '---'}</p>
                  <p className="text-xs text-blue-400 flex items-center gap-1 mt-1">USD / BRL</p>
              </div>
              <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 group-hover:text-white group-hover:bg-blue-500 transition">
                  <DollarSign className="h-6 w-6" />
              </div>
          </div>

          <div className="bg-[#111] border border-white/10 p-5 rounded-xl flex items-center justify-between group hover:border-orange-500/30 transition">
              <div>
                  <p className="text-gray-400 text-xs font-bold uppercase mb-1">Bitcoin</p>
                  <p className="text-2xl font-bold text-white tracking-tight">{marketRates?.btc ? formatCurrency(marketRates.btc) : '---'}</p>
                  <p className="text-xs text-orange-400 flex items-center gap-1 mt-1">BTC / BRL</p>
              </div>
              <div className="h-10 w-10 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500 group-hover:text-white group-hover:bg-orange-500 transition">
                  <Bitcoin className="h-6 w-6" />
              </div>
          </div>
      </div>

      {/* ÁREA WALL STREET (BUSCA E GRÁFICO) */}
      <div className="space-y-4">
          {/* Barra de Comando */}
          <div className="bg-[#151515] border border-white/10 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
              <form onSubmit={handleSearch} className="relative w-full md:w-96 group">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500 group-focus-within:text-indigo-500 transition" />
                  <input 
                    type="text" 
                    placeholder="Buscar Ativo (Ex: PETR4, AAPL, EURUSD)" 
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 text-white rounded-lg py-2.5 pl-10 pr-4 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition uppercase placeholder:normal-case"
                  />
              </form>

              <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                  <button onClick={() => quickSelect("BMFBOVESPA:IBOV")} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs font-mono text-gray-300 transition whitespace-nowrap">🇧🇷 IBOV</button>
                  <button onClick={() => quickSelect("BMFBOVESPA:PETR4")} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs font-mono text-gray-300 transition whitespace-nowrap">🛢 PETR4</button>
                  <button onClick={() => quickSelect("BMFBOVESPA:VALE3")} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs font-mono text-gray-300 transition whitespace-nowrap">⛏ VALE3</button>
                  <div className="w-px bg-white/10 mx-1"></div>
                  <button onClick={() => quickSelect("NASDAQ:AAPL")} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs font-mono text-gray-300 transition whitespace-nowrap">🍎 AAPL</button>
                  <button onClick={() => quickSelect("NASDAQ:NVDA")} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs font-mono text-gray-300 transition whitespace-nowrap">🤖 NVDA</button>
                  <button onClick={() => quickSelect("BINANCE:BTCUSD")} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs font-mono text-gray-300 transition whitespace-nowrap">₿ BTC</button>
              </div>
          </div>

          {/* O GRÁFICO (WIDGET) */}
          <TradingViewWidget symbol={activeSymbol} />
      </div>

      {/* METAS PESSOAIS */}
      <div className="pt-8 border-t border-white/10">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Target className="h-6 w-6 text-emerald-500" />
              Minhas Metas
          </h3>

          {showGoalForm && (
              <form onSubmit={handleSubmitGoal} className="bg-[#111] border border-white/10 p-6 rounded-xl space-y-4 mb-6 animate-in slide-in-from-top-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input placeholder="Nome da Meta (Ex: Reserva de Emergência)" value={newGoal.title} onChange={e => setNewGoal({...newGoal, title: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white focus:border-emerald-500 outline-none" required />
                    <input placeholder="Valor Alvo (R$)" type="number" value={newGoal.target_amount} onChange={e => setNewGoal({...newGoal, target_amount: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white focus:border-emerald-500 outline-none" required />
                  </div>
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold transition">Criar Meta</button>
              </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {goals.map((goal: any) => {
                 const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
                 return (
                     <div key={goal.id} className="bg-[#111] border border-white/10 p-6 rounded-2xl space-y-4 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                             <Target className="h-20 w-20 text-emerald-500" />
                         </div>
                         
                         <div className="flex justify-between items-start relative z-10">
                             <div>
                                <h3 className="font-bold text-white text-lg">{goal.title}</h3>
                                <p className="text-gray-500 text-xs mt-1">Objetivo Patrimonial</p>
                             </div>
                             <div className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded text-xs font-bold">
                                 {progress.toFixed(0)}%
                             </div>
                         </div>
                         
                         <div className="relative z-10">
                             <div className="flex justify-between text-sm mb-2">
                                 <span className="text-gray-400">Progresso</span>
                                 <span className="text-white font-bold">{formatCurrency(goal.current_amount)}</span>
                             </div>
                             <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                 <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
                             </div>
                             <div className="flex justify-between text-xs mt-2 text-gray-500">
                                 <span>Início</span>
                                 <span>Alvo: {formatCurrency(goal.target_amount)}</span>
                             </div>
                         </div>
                     </div>
                 )
             })}
             
             {goals.length === 0 && !showGoalForm && (
                 <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-xl text-gray-500">
                     Você ainda não tem metas definidas. Comece a planejar seu futuro.
                 </div>
             )}
          </div>
      </div>
    </div>
  )
}