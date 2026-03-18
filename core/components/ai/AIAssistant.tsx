'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Send, Sparkles, Zap, BrainCircuit, Loader2, Lock, LayoutDashboard, Terminal
} from 'lucide-react'
import { financeService } from '@/services/financeService'
import { formatCurrency } from '@/lib/utils'
import UpgradeModal from '@/core/components/UpgradeModal'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface AIAssistantProps {
  user: any
  realBalance: number
}

export default function AIAssistant({ user, realBalance }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: `Conexão Neural Estabelecida. 🧠\nOlá ${user?.user_metadata?.full_name || 'Comandante'}. O núcleo Cérebro.OS está online. Como posso auditar suas estratégias hoje?` }
  ])
  const [isTyping, setIsTyping] = useState(false)
  
  const [contextData, setContextData] = useState<any>({
      transactions: [],
      goals: [],
      balance: realBalance
  })

  // 🛡️ Lógica de Plano Reativada
  const userPlan = user?.user_metadata?.plan_tier || 'free'
  const isFreePlan = userPlan !== 'pro' && userPlan !== 'premium'
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadContext = async () => {
        try {
            const [trans, goals] = await Promise.all([
                financeService.getTransactions(),
                financeService.getGoals()
            ])
            setContextData({ transactions: trans || [], goals: goals || [], balance: realBalance })
        } catch (error) { console.error("Erro Contexto IA:", error) }
    }
    if (isOpen && !isFreePlan) loadContext()
  }, [isOpen, realBalance, isFreePlan])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleOpenChat = () => {
    if (isFreePlan) {
      setShowUpgradeModal(true)
      return
    }
    setIsOpen(!isOpen)
  }

  const handleSend = async (customText?: string) => {
    if (isFreePlan) {
        setShowUpgradeModal(true)
        return
    }

    const textToSend = customText || input
    if (!textToSend.trim()) return
    
    setInput('')
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: textToSend }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    try {
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: textToSend, 
                context: {
                    ...contextData,
                    currentBalance: realBalance,
                    systemPrompt: `Você é o Cérebro.OS. REGRA ABSOLUTA: Sempre que o usuário perguntar sobre o "saldo atual", "quanto tem na conta" ou valores disponíveis, você deve confirmar que o sistema está sincronizado, mas instruir o usuário a olhar o valor exato no CARD DE SALDO do Dashboard principal para segurança total. Nunca tente adivinhar o valor se não tiver certeza absoluta.`
                } 
            })
        })
        
        const data = await response.json()
        setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: data.response }])
    } catch (error) {
        setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: '⚠️ Falha na sinapse neural. Tente novamente.' }])
    } finally { setIsTyping(false) }
  }

  return (
    <>
      {/* BOTÃO FLUTUANTE DE ELITE */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleOpenChat}
        className={`fixed bottom-8 right-8 z-50 h-16 w-16 rounded-[1.25rem] shadow-[0_0_40px_rgba(99,102,241,0.2)] flex items-center justify-center transition-all duration-500 group border ${
            isOpen ? 'bg-rose-500 border-rose-400' : 'bg-[#09090b] border-white/10'
        }`}
      >
        {isOpen ? <X className="text-white" /> : (
            <div className="relative">
                <BrainCircuit className={`${isFreePlan ? 'text-gray-500' : 'text-indigo-400'} group-hover:text-indigo-300 transition-colors`} size={28} />
                {isFreePlan && (
                    <div className="absolute -top-3 -right-3 bg-amber-500 rounded-full p-1 border-2 border-[#050505]">
                        <Lock size={10} className="text-black" />
                    </div>
                )}
            </div>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="fixed bottom-28 right-4 md:right-8 w-[95vw] md:w-[480px] h-[75vh] max-h-[750px] bg-[#09090b]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-50 flex flex-col overflow-hidden"
          >
            {/* HEADER TERMINAL STYLE */}
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                        <Zap size={20} className="animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white italic">Cérebro.OS</h3>
                            <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/30 font-black">CORE V2</span>
                        </div>
                        <p className="text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase mt-0.5">
                           <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" /> Auditoria Ativa
                        </p>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2.5 hover:bg-white/5 rounded-xl text-gray-500 transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* MESSAGE FEED */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                
                {/* ORIENTAÇÃO DE SEGURANÇA FIXA */}
                <div className="bg-indigo-600/5 border border-indigo-500/10 p-5 rounded-[1.5rem] flex gap-4 items-center group hover:bg-indigo-600/10 transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-500/20">
                        <LayoutDashboard size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Diretriz de Realidade</p>
                        <p className="text-xs text-gray-400 leading-tight">Sincronização ativa. Para valores exatos de caixa, consulte o <span className="text-indigo-400 font-bold">Dashboard Principal</span>.</p>
                    </div>
                </div>

                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm leading-relaxed shadow-xl ${
                            msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-900/20' 
                                : 'bg-white/[0.03] border border-white/10 text-gray-200 rounded-tl-none'
                        }`}>
                            <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                        </div>
                    </motion.div>
                ))}
                
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 border border-white/10 p-5 rounded-[1.5rem] rounded-tl-none flex gap-1.5 items-center">
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* QUICK ACTIONS BAR */}
            <div className="px-6 py-3 flex gap-2 overflow-x-auto scrollbar-hide border-t border-white/5 bg-black/20">
                <button onClick={() => handleSend("Onde posso cortar gastos?")} className="shrink-0 px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black uppercase text-gray-400 hover:text-white hover:bg-indigo-600/20 transition-all">Sugerir Cortes</button>
                <button onClick={() => handleSend("Analise minhas metas")} className="shrink-0 px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black uppercase text-gray-400 hover:text-white hover:bg-indigo-600/20 transition-all">Metas Ativas</button>
                <button onClick={() => handleSend("Resumo de gastos do mês")} className="shrink-0 px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black uppercase text-gray-400 hover:text-white hover:bg-indigo-600/20 transition-all">Auditoria Mensal</button>
            </div>

            {/* INPUT AREA HARDWARE STYLE */}
            <div className="p-6 bg-black/60 backdrop-blur-md">
                <form 
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-3 items-center bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-2 focus-within:border-indigo-500/50 transition-all shadow-inner"
                >
                    <Terminal size={16} className="text-gray-600" />
                    <input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Comandar auditoria neural..."
                        className="flex-1 bg-transparent text-white placeholder:text-gray-600 outline-none text-sm h-12 font-medium"
                    />
                    <button 
                        type="submit" 
                        disabled={!input.trim() || isTyping}
                        className="h-10 w-10 bg-white text-black rounded-xl flex items-center justify-center disabled:opacity-30 hover:bg-indigo-500 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                        {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </form>
                <p className="text-[8px] text-gray-600 text-center mt-4 uppercase font-black tracking-[0.3em] opacity-40">Intelligence Protocol v2.4.0</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  )
}