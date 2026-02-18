'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Loader2, Sparkles, Bot, User, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface AIAssistantProps {
  context?: {
    summary: any
    goals: any[]
    transactions: any[]
  }
}

export default function AIAssistant({ context }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  
  // A saudação inicial fica apenas visual na tela, não enviamos ela no histórico para a API
  const [messages, setMessages] = useState<{id: string, role: string, text: string}[]>([
    { id: 'saudacao', role: 'model', text: 'Olá! Sou o Cérebro.AI. Posso analisar suas finanças, sugerir cortes de gastos ou criar estratégias de investimento. Como posso ajudar hoje?' }
  ])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => { 
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) 
  }, [messages, isOpen])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userText = input
    setInput('')
    
    // Adiciona a mensagem do usuário na tela
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText }])
    setLoading(true)

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
      if (!apiKey) throw new Error("API_KEY_MISSING")

      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
      
      const financeContext = context ? `
        DADOS ATUAIS: Saldo R$ ${context.summary?.balance}, Receita R$ ${context.summary?.income}, Despesa R$ ${context.summary?.expense}.
      ` : ""

      // CORREÇÃO CRÍTICA: Filtramos o histórico para garantir que comece com 'user'
      const apiHistory = messages
        .filter((m, index) => !(index === 0 && m.role === 'model')) // Remove a saudação inicial do histórico da API
        .filter(m => !m.text.includes("Desculpe") && !m.text.includes("⚠️")) // Remove erros anteriores
        .map(m => ({
          role: m.role === 'model' ? 'model' : 'user' as any,
          parts: [{ text: m.text }],
        }))

      const chat = model.startChat({ history: apiHistory })

      const systemPrompt = `Você é o Cérebro.AI, consultor financeiro. ${financeContext} Responda em Português-BR de forma curta.`
      
      const result = await chat.sendMessage(`${systemPrompt}\n\nPergunta: ${userText}`)
      const responseText = result.response.text()
      
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: responseText }])

    } catch (error: any) {
      console.error("Erro AI:", error)
      let errorMsg = "Desculpe, tive um problema de conexão. Tente novamente."
      if (error.message === "API_KEY_MISSING") errorMsg = "⚠️ Chave de API não configurada no .env.local"
      
      setMessages(prev => [...prev, { id: "erro", role: 'model', text: errorMsg }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="mb-4 w-[350px] h-[550px] bg-[#09090b] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-blue-600/10 p-4 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bot size={20} className="text-blue-500" />
                <span className="font-bold text-sm text-white">Cérebro Assistant</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-200'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && <Loader2 className="animate-spin text-blue-500 mx-auto" />}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/5">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <input className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500" placeholder="Pergunte..." value={input} onChange={e => setInput(e.target.value)} />
                <button type="submit" className="bg-blue-600 p-2 rounded-xl text-white"><Send size={18} /></button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setIsOpen(!isOpen)} className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-xl hover:bg-blue-500 transition-all">
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </button>
    </div>
  )
}