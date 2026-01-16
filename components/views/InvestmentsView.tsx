'use client'

import React, { useState, useEffect, useRef } from 'react'
import { TrendingUp, Plus, Target, DollarSign, Bitcoin, Search, Globe, BarChart3, ArrowUpRight, Percent } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

// --- WIDGET 1: FITA DE COTAÇÕES (TICKER TAPE) ---
const TickerTapeWidget = () => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "symbols": [
        { "description": "Dólar", "proName": "FX_IDC:USDBRL" },
        { "description": "Bitcoin", "proName": "BINANCE:BTCBRL" },
        { "description": "Ibovespa", "proName": "BMFBOVESPA:IBOV" },
        { "description": "S&P 500", "proName": "FOREXCOM:SPXUSD" },
        { "description": "Euro", "proName": "FX_IDC:EURBRL" },
        { "description": "Ouro", "proName": "TVC:GOLD" }
      ],
      "showSymbolLogo": true,
      "colorTheme": "dark",
      "isTransparent": true,
      "displayMode": "adaptive",
      "locale": "br"
    });
    container.current.appendChild(script);
  }, []);

  return (
    <div className="w-full h-16 bg-[#050505] border-b border-white/10 overflow-hidden mb-6 -mt-4 md:-mt-8 -mx-4 md:-mx-8">
      <div className="tradingview-widget-container" ref={container}></div>
    </div>
  );
}

// --- WIDGET 2: GRÁFICO AVANÇADO ---
const TradingViewWidget = ({ symbol }: { symbol: string }) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
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
      <div className="tradingview-widget-container h-full w-full" ref={container}></div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function InvestmentsView({ goals, cdiRate, marketRates, onAddGoal }: any) {
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [newGoal, setNewGoal] = useState({ title: '', target_amount: '' })
  
  const [activeSymbol, setActiveSymbol] = useState("BMFBOVESPA:IBOV")
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
    <div className="p-4 md:p-8 animate-in fade-in pb-20">
      
      {/* 1. TICKER TAPE (FITA DE COTAÇÕES) */}
      <TickerTapeWidget />

      <div className="space-y-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                  <Globe className="h-8 w-8 text-indigo-500" /> 
                  Terminal Global
              </h2>
              <p className="text-gray-400 text-sm">Monitoramento de mercado em tempo real.</p>
           </div>
           <button onClick={() => setShowGoalForm(!showGoalForm)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition shadow-lg shadow-indigo-500/20">
              <Plus className="h-5 w-5" /> Nova Meta
           </button>
        </div>

        {/* 2. INDICADORES PRINCIPAIS (SELIC, DÓLAR, BITCOIN) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card Selic */}
            <div className="bg-[#111] border border-white/10 p-5 rounded-xl flex items-center justify-between group hover:border-emerald-500/30 transition shadow-lg">
                <div>
                    <p className="text-gray-400 text-xs font-bold uppercase mb-1 flex items-center gap-1">
                       <ArrowUpRight className="h-3 w-3 text-emerald-500" /> Taxa Selic (Anual)
                    </p>
                    <p className="text-3xl font-bold text-white tracking-tight">
                        {(cdiRate * 100).toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Renda Fixa / Tesouro</p>
                </div>
                <div className="h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 group-hover:text-white group-hover:bg-emerald-500 transition">
                    <Percent className="h-6 w-6" />
                </div>
            </div>
            
            {/* Card Dólar */}
            <div className="bg-[#111] border border-white/10 p-5 rounded-xl flex items-center justify-between group hover:border-blue-500/30 transition shadow-lg">
                <div>
                    <p className="text-gray-400 text-xs font-bold uppercase mb-1 flex items-center gap-1">
                       <ArrowUpRight className="h-3 w-3 text-blue-500" /> Dólar (PTAX)
                    </p>
                    <p className="text-3xl font-bold text-white tracking-tight">
                        R$ {marketRates?.usd?.toFixed(3) || '---'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">USD / BRL</p>
                </div>
                <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 group-hover:text-white group-hover:bg-blue-500 transition">
                    <DollarSign className="h-6 w-6" />
                </div>
            </div>

            {/* Card Bitcoin */}
            <div className="bg-[#111] border border-white/10 p-5 rounded-xl flex items-center justify-between group hover:border-orange-500/30 transition shadow-lg">
                <div>
                    <p className="text-gray-400 text-xs font-bold uppercase mb-1 flex items-center gap-1">
                       <ArrowUpRight className="h-3 w-3 text-orange-500" /> Bitcoin
                    </p>
                    <p className="text-3xl font-bold text-white tracking-tight">
                        {marketRates?.btc ? formatCurrency(marketRates.btc) : '---'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">BTC / BRL</p>
                </div>
                <div className="h-12 w-12 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 group-hover:text-white group-hover:bg-orange-500 transition">
                    <Bitcoin className="h-6 w-6" />
                </div>
            </div>
        </div>

        {/* 3. ÁREA DE GRÁFICOS (WALL STREET) */}
        <div className="space-y-4">
            {/* Barra de Busca */}
            <div className="bg-[#151515] border border-white/10 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
                <form onSubmit={handleSearch} className="relative w-full md:w-96 group">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500 group-focus-within:text-indigo-500 transition" />
                    <input 
                      type="text" 
                      placeholder="Ativo (Ex: PETR4, AAPL, BTCUSD)" 
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 text-white rounded-lg py-2.5 pl-10 pr-4 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition uppercase placeholder:normal-case"
                    />
                </form>

                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                    <button onClick={() => quickSelect("BMFBOVESPA:IBOV")} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs font-mono text-gray-300 transition whitespace-nowrap">🇧🇷 IBOV</button>
                    <button onClick={() => quickSelect("FX_IDC:USDBRL")} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs font-mono text-gray-300 transition whitespace-nowrap">🇺🇸 DÓLAR</button>
                    <button onClick={() => quickSelect("BMFBOVESPA:PETR4")} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs font-mono text-gray-300 transition whitespace-nowrap">🛢 PETR4</button>
                    <div className="w-px bg-white/10 mx-1"></div>
                    <button onClick={() => quickSelect("NASDAQ:AAPL")} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs font-mono text-gray-300 transition whitespace-nowrap">🍎 AAPL</button>
                    <button onClick={() => quickSelect("BINANCE:BTCUSD")} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs font-mono text-gray-300 transition whitespace-nowrap">₿ BTC</button>
                </div>
            </div>

            <TradingViewWidget symbol={activeSymbol} />
        </div>

        {/* 4. METAS PESSOAIS */}
        <div className="pt-8 border-t border-white/10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Target className="h-6 w-6 text-indigo-500" />
                Minhas Metas
            </h3>

            {showGoalForm && (
                <form onSubmit={handleSubmitGoal} className="bg-[#111] border border-white/10 p-6 rounded-xl space-y-4 mb-6 animate-in slide-in-from-top-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input placeholder="Nome da Meta (Ex: Aposentadoria)" value={newGoal.title} onChange={e => setNewGoal({...newGoal, title: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white focus:border-indigo-500 outline-none" required />
                      <input placeholder="Valor Alvo (R$)" type="number" value={newGoal.target_amount} onChange={e => setNewGoal({...newGoal, target_amount: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white focus:border-indigo-500 outline-none" required />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold transition">Criar Meta</button>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {goals.map((goal: any) => {
                   const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
                   return (
                       <div key={goal.id} className="bg-[#111] border border-white/10 p-6 rounded-2xl space-y-4 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                               <Target className="h-20 w-20 text-indigo-500" />
                           </div>
                           
                           <div className="flex justify-between items-start relative z-10">
                               <div>
                                  <h3 className="font-bold text-white text-lg">{goal.title}</h3>
                                  <p className="text-gray-500 text-xs mt-1">Planejamento</p>
                               </div>
                               <div className="bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded text-xs font-bold">
                                   {progress.toFixed(0)}%
                               </div>
                           </div>
                           
                           <div className="relative z-10">
                               <div className="flex justify-between text-sm mb-2">
                                   <span className="text-gray-400">Progresso</span>
                                   <span className="text-white font-bold">{formatCurrency(goal.current_amount)}</span>
                               </div>
                               <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                   <div className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
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
                       Nenhuma meta cadastrada. Clique em "Nova Meta" para começar.
                   </div>
               )}
            </div>
        </div>
      </div>
    </div>
  )
}