'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, X, Send, Sparkles, Wallet, 
  TrendingUp, Bot, User
} from 'lucide-react'
import { financeService } from '@/services/financeService'
import { formatCurrency } from '@/lib/utils'
import FixedExpensesList from '@/modules/personal/components/FixedExpensesList'
import type { CaixaData, Debt, Goal, Transaction } from '@/types_db'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface FinancialContext {
  transactions: Transaction[]
  debts: Debt[]
  goals: Goal[]
  balance: CaixaData | null
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Olá! Sou seu Cérebro Financeiro 🧠. Tenho acesso às suas transações, dívidas e metas. O que deseja saber hoje?' }
  ])
  const [isTyping, setIsTyping] = useState(false)
  
  // Contexto Financeiro Global
  const [contextData, setContextData] = useState<FinancialContext>({
      transactions: [],
      debts: [],
      goals: [],
      balance: null
  })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Carregar TODOS os dados reais ao iniciar
  useEffect(() => {
    const loadContext = async () => {
        try {
            const [trans, debts, goals, caixa] = await Promise.all([
                financeService.getTransactions(),
                financeService.getDebts(),
                financeService.getGoals(),
                financeService.getCaixaData()
            ])
            
            setContextData({
                transactions: trans || [],
                debts: debts || [],
                goals: goals || [],
                balance: caixa
            })
        } catch (error) {
            console.error("Erro ao carregar contexto para IA:", error)
        }
    }
    loadContext()
  }, [])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // 2. Enviar mensagem para a API Groq
  const handleSend = async () => {
    if (!input.trim()) return

    const userText = input
    setInput('') // Limpa input
    
    // Adiciona msg do usuário na tela
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userText }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    try {
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: userText
            })
        })

        if (!response.ok) throw new Error('Erro na API')

        const data = await response.json()
        
        const aiMsg: Message = { 
            id: (Date.now() + 1).toString(), 
            role: 'assistant', 
            content: data.response 
        }
        setMessages(prev => [...prev, aiMsg])

    } catch {
        const errorMsg: Message = { 
            id: (Date.now() + 1).toString(), 
            role: 'assistant', 
            content: '⚠️ Tive um problema de conexão. Tente novamente.' 
        }
        setMessages(prev => [...prev, errorMsg])
    } finally {
        setIsTyping(false)
    }
  }

  // Cálculos rápidos para o Widget visual (Mini Dashboard no Chat)
  const totals = contextData.transactions.reduce((acc, t) => {
    const val = Number(t.amount)
    if (t.type === 'receita') {
        acc.income += val
    } else {
        acc.expense += Math.abs(val)
    }
    return acc
  }, { income: 0, expense: 0 })

  const currentBalance = contextData.balance?.currentBalance || (totals.income - totals.expense)

  return (
    <>
      {/* BOTÃO FLUTUANTE */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-rose-500 rotate-90' : 'bg-blue-600'}`}
      >
        {isOpen ? <X className="text-white" /> : <MessageSquare className="text-white" />}
      </motion.button>

      {/* JANELA DO CHAT */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-4 md:right-6 w-[90vw] md:w-[450px] h-[80vh] max-h-[700px] bg-[#09090b]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* HEADER */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400">
                    <Sparkles size={20} />
                </div>
                <div>
                    <h3 className="text-white font-bold">Consultor IA</h3>
                    <p className="text-xs text-green-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Conectado aos seus dados
                    </p>
                </div>
            </div>

            {/* CONTEÚDO SCROLLÁVEL */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                
                {/* WIDGETS VISUAIS (Resumo rápido sempre visível no topo) */}
                <div className="space-y-4 mb-6">
                    <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
                         <div className="min-w-[140px] bg-white/5 p-3 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-2 mb-1 opacity-50">
                                <Wallet size={14} className="text-white" />
                                <span className="text-[10px] font-bold uppercase">Saldo Atual</span>
                            </div>
                            <p className="text-lg font-bold text-white">{formatCurrency(currentBalance)}</p>
                         </div>
                         <div className="min-w-[140px] bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10">
                            <div className="flex items-center gap-2 mb-1 opacity-50">
                                <TrendingUp size={14} className="text-emerald-400" />
                                <span className="text-[10px] font-bold uppercase text-emerald-400">Entradas</span>
                            </div>
                            <p className="text-lg font-bold text-emerald-400">{formatCurrency(totals.income)}</p>
                         </div>
                    </div>
                    
                    {/* Lista de Contas Fixas - Componente Reutilizado */}
                    <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                           <Wallet size={12} /> Próximas Contas
                        </h4>
                        <FixedExpensesList 
                            transactions={contextData.transactions} 
                            currentDate={new Date()} 
                        />
                    </div>
                </div>

                {/* HISTÓRICO DE MENSAGENS */}
                {messages.map((msg) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                            {msg.role === 'user' ? <User size={14} /> : <Bot size={16} />}
                        </div>
                        <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-lg ${
                            msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-tr-sm' 
                                : 'bg-[#1a1a1a] text-gray-200 rounded-tl-sm border border-white/5'
                        }`}>
                            {/* Renderização de Markdown Simples */}
                            <div className="whitespace-pre-wrap font-light">
                                {msg.content}
                            </div>
                        </div>
                    </motion.div>
                ))}
                
                {isTyping && (
                    <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                            <Bot size={16} />
                        </div>
                        <div className="bg-[#1a1a1a] p-4 rounded-2xl rounded-tl-sm border border-white/5 flex gap-1.5 items-center">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100" />
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* BARRA DE INPUT */}
            <div className="p-4 bg-black/40 border-t border-white/10 backdrop-blur-md">
                <form 
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2 items-center bg-[#1a1a1a] border border-white/10 rounded-full px-1.5 py-1.5 focus-within:border-blue-500/50 transition-colors shadow-lg"
                >
                    <input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ex: Quanto gastei com Mercado este mês?"
                        className="flex-1 bg-transparent text-white placeholder:text-gray-500 outline-none text-sm px-4 h-10"
                    />
                    <button 
                        type="submit" 
                        disabled={!input.trim() || isTyping}
                        className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:bg-gray-700 hover:bg-blue-500 transition-all"
                    >
                        {isTyping ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send size={18} />}
                    </button>
                </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
