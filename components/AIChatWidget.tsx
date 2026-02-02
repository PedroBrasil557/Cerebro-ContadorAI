'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles, Loader2, Play } from 'lucide-react' // Usando 'Play' como seta estilizada ou manter Send
import { motion, AnimatePresence } from 'framer-motion'
import { aiService } from '@/services/aiService' 

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Mensagem inicial mais acolhedora
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', text: 'Olá! Sou o Gemini Financial. Posso analisar seus gastos ou dar dicas de investimento. O que manda?' }
  ])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  
  useEffect(() => { scrollToBottom() }, [messages, isOpen])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const responseText = await aiService.sendMessage(userMsg.text)
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: responseText }
      setMessages(prev => [...prev, aiMsg])
    } catch (error) {
      console.error(error)
      const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: "Desculpe, tive um problema de conexão com o Google." }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      
      {/* JANELA DO CHAT (Estilo Glassmorphism + Google Colors) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[350px] md:w-[420px] h-[550px] bg-[#0e0e0e]/95 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Cabeçalho Gradiente Gemini */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 p-4 flex justify-between items-center shadow-lg">
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="text-white animate-pulse" size={20} />
                <div>
                   <span className="font-bold text-sm block">Gemini Assistant</span>
                   <span className="text-[10px] opacity-80 block">Powered by Google</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors bg-white/10 rounded-full p-1">
                <X size={18} />
              </button>
            </div>

            {/* Área de Mensagens */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-gray-800">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  
                  {/* Nomezinho pequeno */}
                  <span className="text-[10px] text-gray-500 px-1">
                    {msg.role === 'user' ? 'Você' : 'Gemini'}
                  </span>

                  <div className={`p-3.5 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#1f1f1f] text-white rounded-tr-none border border-white/5' 
                      : 'bg-gradient-to-br from-blue-900/20 to-purple-900/20 text-gray-100 rounded-tl-none border border-blue-500/20'
                  }`}>
                    {msg.role === 'assistant' && (
                        <Sparkles size={12} className="inline-block mr-2 text-blue-400 mb-0.5" />
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex flex-col items-start gap-1">
                    <span className="text-[10px] text-gray-500 px-1">Gemini</span>
                    <div className="bg-[#1f1f1f] px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2 border border-white/5">
                      <Loader2 size={16} className="animate-spin text-blue-400" />
                      <span className="text-xs text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-bold">
                        Gerando resposta...
                      </span>
                    </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#0e0e0e] border-t border-white/10">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex gap-2 items-center bg-[#1a1a1a] rounded-full px-2 py-2 border border-white/10 focus-within:border-blue-500/50 transition-colors shadow-inner"
              >
                <input 
                  className="bg-transparent flex-1 text-sm text-white outline-none placeholder:text-gray-500 pl-4 h-full"
                  placeholder="Pergunte ao Gemini..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={loading || !input.trim()}
                  className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
                >
                  <Send size={18} className={loading ? 'opacity-0' : 'ml-0.5'} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTÃO FLUTUANTE (GEMINI STYLE) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`h-16 w-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 border-2 border-white/10 ${
          isOpen 
            ? 'bg-[#1f1f1f] text-white rotate-90' 
            : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white hover:shadow-indigo-500/50'
        }`}
      >
        {isOpen ? <X size={28} /> : <Sparkles size={28} className="animate-pulse" />}
      </motion.button>

    </div>
  )
}