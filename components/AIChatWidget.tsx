'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, X, Send, Sparkles, Wallet, 
  TrendingUp, TrendingDown, Bot
} from 'lucide-react'
import { getTransactions } from '@/app/action/transactions'
import { Transaction } from '@/types_db' // O tipo correto que queremos usar
import { formatCurrency } from '@/lib/utils'

// Importando o componente de lista fixa
import FixedExpensesList from '@/components/FixedExpensesList'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Olá! Sou o Cérebro AI 🧠. Posso analisar seus gastos, prever despesas ou tirar dúvidas financeiras. Como posso ajudar?' }
  ])
  const [isTyping, setIsTyping] = useState(false)
  
  // Estado tipado corretamente com o Transaction do types_db
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Carregar dados reais ao abrir o chat ou montar
  useEffect(() => {
    const loadData = async () => {
        try {
            const data = await getTransactions()
            // CORREÇÃO DO ERRO AQUI:
            // Forçamos o tipo para garantir compatibilidade entre a Action e o Componente
            setTransactions(data as unknown as Transaction[])
        } catch (error) {
            console.error("Erro ao carregar transações no chat:", error)
        } finally {
            setLoadingData(false)
        }
    }
    loadData()
  }, [])

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulação de resposta da IA
    setTimeout(() => {
        const aiMsg: Message = { 
            id: (Date.now() + 1).toString(), 
            role: 'assistant', 
            content: 'Entendido. Estou analisando seus dados financeiros para responder com precisão...' 
        }
        setMessages(prev => [...prev, aiMsg])
        setIsTyping(false)
    }, 1500)
  }

  // Cálculos rápidos para os cards de resumo
  const totals = transactions.reduce((acc, t) => {
    const val = Number(t.amount)
    if (t.type === 'receita') {
        acc.income += val
        acc.balance += val
    } else {
        acc.expense += Math.abs(val)
        acc.balance -= Math.abs(val)
    }
    return acc
  }, { income: 0, expense: 0, balance: 0 })

  return (
    <>
      {/* BOTÃO FLUTUANTE (TRIGGER) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-red-500 rotate-90' : 'bg-blue-600'}`}
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
                    <h3 className="text-white font-bold">Cérebro Financial AI</h3>
                    <p className="text-xs text-green-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Online
                    </p>
                </div>
            </div>

            {/* CONTEÚDO SCROLLÁVEL */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                
                {/* WIDGETS DE RESUMO FINANCEIRO */}
                <div className="space-y-4 mb-6">
                    {/* CARDS DE RESUMO */}
                    <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
                         <div className="min-w-[140px] bg-white/5 p-3 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-2 mb-1 opacity-50">
                                <Wallet size={14} className="text-white" />
                                <span className="text-[10px] font-bold uppercase">Saldo</span>
                            </div>
                            <p className="text-lg font-bold text-white">{formatCurrency(totals.balance)}</p>
                         </div>
                         <div className="min-w-[140px] bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10">
                            <div className="flex items-center gap-2 mb-1 opacity-50">
                                <TrendingUp size={14} className="text-emerald-400" />
                                <span className="text-[10px] font-bold uppercase text-emerald-400">Entradas</span>
                            </div>
                            <p className="text-lg font-bold text-emerald-400">{formatCurrency(totals.income)}</p>
                         </div>
                         <div className="min-w-[140px] bg-rose-500/5 p-3 rounded-2xl border border-rose-500/10">
                            <div className="flex items-center gap-2 mb-1 opacity-50">
                                <TrendingDown size={14} className="text-rose-400" />
                                <span className="text-[10px] font-bold uppercase text-rose-400">Saídas</span>
                            </div>
                            <p className="text-lg font-bold text-rose-400">{formatCurrency(totals.expense)}</p>
                         </div>
                    </div>

                    {/* LISTA DE CONTAS FIXAS */}
                    <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                           <Wallet size={12} /> Próximas Contas Fixas
                        </h4>
                        
                        <FixedExpensesList 
                            transactions={transactions} 
                            currentDate={new Date()} 
                        />
                    </div>
                </div>

                {/* MENSAGENS */}
                {messages.map((msg) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                            {msg.role === 'user' ? <span className="text-xs font-bold">VC</span> : <Bot size={16} />}
                        </div>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                            msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-tr-sm' 
                                : 'bg-white/10 text-gray-200 rounded-tl-sm'
                        }`}>
                            {msg.content}
                        </div>
                    </motion.div>
                ))}
                
                {isTyping && (
                    <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                            <Bot size={16} />
                        </div>
                        <div className="bg-white/10 p-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100" />
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <div className="p-4 bg-black/40 border-t border-white/10">
                <form 
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2 items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 focus-within:border-blue-500/50 transition-colors"
                >
                    <input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Pergunte sobre suas finanças..."
                        className="flex-1 bg-transparent text-white placeholder:text-gray-500 outline-none text-sm"
                    />
                    <button 
                        type="submit" 
                        disabled={!input.trim()}
                        className="p-2 bg-blue-600 rounded-full text-white disabled:opacity-50 disabled:bg-gray-700 hover:scale-105 transition-all"
                    >
                        <Send size={16} />
                    </button>
                </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}