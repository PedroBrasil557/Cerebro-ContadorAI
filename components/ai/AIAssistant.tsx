'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { aiService } from '@/services/aiService'

// LOGO DO GEMINI (Mantido o SVG oficial)
const GeminiLogo = ({ className = "", size = 24 }: { className?: string, size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" fill="currentColor"/>
  </svg>
)

interface AIAssistantProps {
  context?: {
    summary: any
    goals: any[]
    transactions: any[]
  }
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export default function AIAssistant({ context }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', text: 'Olá. Sou a inteligência do seu Cérebro Financeiro. Em que posso ser útil?' }
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
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: "Erro de conexão." }])
    } finally {
      setLoading(false)
    }
  }

  // --- COR PROFISSIONAL (ROYAL BLUE) ---
  // Essa cor passa confiança, tecnologia e seriedade.
  const primaryColor = "bg-blue-600"
  const primaryHover = "hover:bg-blue-500"

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[350px] md:w-[400px] h-[550px] bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* CABEÇALHO SÓLIDO AZUL */}
            <div className={`${primaryColor} p-4 flex justify-between items-center shadow-md`}>
              <div className="flex items-center gap-3 text-white">
                <div className="bg-white/20 p-1.5 rounded-lg">
                    <GeminiLogo size={18} />
                </div>
                <div>
                   <span className="font-bold text-sm block tracking-wide">Gemini Assistant</span>
                   <span className="text-[10px] text-blue-100/80 block uppercase font-semibold">Google DeepMind</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors bg-black/10 hover:bg-black/20 rounded-full p-1.5">
                <X size={18} />
              </button>
            </div>

            {/* ÁREA DE MENSAGENS */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-gray-800">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  
                  {/* BALÕES DE MENSAGEM */}
                  <div className={`p-3.5 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? `${primaryColor} text-white rounded-tr-none` // Usuário: Azul (Destaque)
                      : 'bg-[#1f1f1f] text-gray-200 rounded-tl-none border border-white/5' // IA: Cinza Escuro (Neutro)
                  }`}>
                    {msg.role === 'assistant' && (
                        <span className="text-blue-400 inline-block mr-2 align-middle">
                             <GeminiLogo size={14} />
                        </span>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex flex-col items-start gap-1">
                    <div className="bg-[#1f1f1f] px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2 border border-white/5">
                      <Loader2 size={16} className="animate-spin text-blue-500" />
                      <span className="text-xs text-gray-500">Digitando...</span>
                    </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <div className="p-4 bg-[#0a0a0a] border-t border-white/10">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex gap-2 items-center bg-[#111] rounded-full px-2 py-2 border border-white/10 focus-within:border-blue-500/50 transition-colors"
              >
                <input 
                  className="bg-transparent flex-1 text-sm text-white outline-none placeholder:text-gray-600 pl-4 h-full"
                  placeholder="Pergunte ao Gemini..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={loading || !input.trim()}
                  className={`h-10 w-10 rounded-full ${primaryColor} ${primaryHover} flex items-center justify-center text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Send size={18} className={loading ? 'opacity-0' : 'ml-0.5'} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTÃO FLUTUANTE - AGORA BEM VISÍVEL E INTUITIVO */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`h-16 w-16 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${primaryColor} ${primaryHover} text-white border-2 border-white/10 z-50`}
      >
        {isOpen ? (
          <X size={28} />
        ) : (
          <GeminiLogo size={32} />
        )}
      </motion.button>

    </div>
  )
}