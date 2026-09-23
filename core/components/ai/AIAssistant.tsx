'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Send, Zap, BrainCircuit, Loader2, LayoutDashboard, Terminal
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { CEREBRO_ASSISTANT_OPEN_EVENT } from '@/lib/assistant/openCerebroAssistant'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface AIAssistantProps {
  user: User
}

const MAX_CHAT_HISTORY = 8

export default function AIAssistant({ user }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: `Olá, ${user?.user_metadata?.full_name || 'tudo bem'}? Posso ajudar a entender e organizar suas finanças pessoais.` }
  ])
  const [isTyping, setIsTyping] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    const openAssistant = () => setIsOpen(true)
    window.addEventListener(CEREBRO_ASSISTANT_OPEN_EVENT, openAssistant)
    return () => window.removeEventListener(CEREBRO_ASSISTANT_OPEN_EVENT, openAssistant)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120)
    return () => window.clearTimeout(timer)
  }, [isOpen])

  const handleOpenChat = () => setIsOpen((current) => !current)

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input
    if (!textToSend.trim() || isTyping) return

    const history = messages
      .filter((message) => message.id !== '1')
      .slice(-MAX_CHAT_HISTORY)
      .map(({ role, content }) => ({ role, content }))

    setInput('')
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: textToSend }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, history })
      })

      const data = await response.json() as {
        response?: string
        error?: { message?: string }
      }
      if (!response.ok) throw new Error(data.error?.message || 'Falha ao consultar a IA.')
      if (!data.response?.trim()) throw new Error('A IA não retornou uma resposta válida.')
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.response! }])
    } catch (error: unknown) {
      const message = error instanceof Error && error.message
        ? error.message
        : 'Não consegui responder agora. Tente novamente em instantes.'
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: message }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <>
      <motion.button
        type="button"
        aria-label={isOpen ? 'Fechar Cérebro' : 'Abrir Cérebro'}
        aria-expanded={isOpen}
        whileHover={{ scale: 1.08, rotate: 4 }}
        whileTap={{ scale: 0.94 }}
        onClick={handleOpenChat}
        className={`fixed bottom-24 right-4 z-50 flex h-16 w-16 items-center justify-center rounded-[1.25rem] border shadow-[0_14px_40px_rgba(79,70,229,0.22)] transition-all duration-300 md:bottom-8 md:right-8 ${
          isOpen
            ? 'border-[var(--danger-300)] bg-[var(--color-action-destructive)] text-white'
            : 'border-[var(--color-card-border)] bg-[var(--color-bg-elevated)] text-[var(--color-action-ai)]'
        }`}
      >
        {isOpen ? <X className="text-white" /> : <BrainCircuit size={28} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-modal="false"
            aria-label="Cérebro financeiro"
            data-testid="cerebro-assistant"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="fixed bottom-40 right-4 z-50 flex h-[calc(100dvh-12rem)] max-h-[650px] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[2rem] border border-[var(--color-card-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-elevated)] md:bottom-28 md:right-8 md:h-[75vh] md:max-h-[750px] md:w-[480px]"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-card-border)] bg-[var(--color-bg-surface)] p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-card-accent-border)] bg-[var(--color-card-accent-fill)] text-[var(--color-action-ai)]">
                  <Zap size={20} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--color-text-primary)] italic">Cérebro.IA</h3>
                    <span className="rounded border border-[var(--color-card-accent-border)] bg-[var(--color-card-accent-fill)] px-2 py-0.5 text-[8px] font-black text-[var(--color-nav-active-text)]">CORE V2</span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase text-[var(--color-status-success)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-status-success)] animate-pulse" /> Auditoria Ativa
                  </p>
                </div>
              </div>
              <button type="button" aria-label="Fechar Cérebro" onClick={() => setIsOpen(false)} className="rounded-xl p-2.5 text-[var(--color-text-helper)] transition-colors hover:bg-[var(--color-action-ghost-hover)] hover:text-[var(--color-text-primary)]">
                <X size={20} />
              </button>
            </div>

            <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto bg-[var(--color-bg-elevated)] p-6">
              <div className="flex items-center gap-4 rounded-[1.5rem] border border-[var(--color-card-accent-border)] bg-[var(--color-card-accent-fill)] p-5 transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-card-accent-border)] bg-[var(--color-bg-surface)] text-[var(--color-action-ai)]">
                  <LayoutDashboard size={20} />
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-nav-active-text)]">Diretriz de Realidade</p>
                  <p className="text-xs leading-tight text-[var(--color-text-secondary)]">Sincronização ativa. Para valores exatos de caixa, consulte o <span className="font-bold text-[var(--color-action-ai)]">Dashboard Principal</span>.</p>
                </div>
              </div>

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-[1.5rem] p-4 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'rounded-tr-none bg-[var(--color-action-primary)] text-white shadow-[0_8px_24px_rgba(124,58,237,0.18)]'
                      : 'rounded-tl-none border border-[var(--color-card-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]'
                  }`}>
                    <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-[1.5rem] rounded-tl-none border border-[var(--color-card-border)] bg-[var(--color-bg-surface)] p-5">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="h-1.5 w-1.5 rounded-full bg-[var(--color-action-ai)]" />
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-[var(--color-action-ai)]" />
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-[var(--color-action-ai)]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2 overflow-x-auto border-t border-[var(--color-card-border)] bg-[var(--color-bg-surface)] px-6 py-3 scrollbar-hide">
              <button type="button" onClick={() => handleSend('Onde posso cortar gastos?')} className="shrink-0 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-bg-elevated)] px-4 py-2 text-[9px] font-black uppercase text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-card-accent-border)] hover:text-[var(--color-nav-active-text)]">Sugerir Cortes</button>
              <button type="button" onClick={() => handleSend('Analise minhas metas')} className="shrink-0 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-bg-elevated)] px-4 py-2 text-[9px] font-black uppercase text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-card-accent-border)] hover:text-[var(--color-nav-active-text)]">Metas Ativas</button>
              <button type="button" onClick={() => handleSend('Resumo de gastos do mês')} className="shrink-0 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-bg-elevated)] px-4 py-2 text-[9px] font-black uppercase text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-card-accent-border)] hover:text-[var(--color-nav-active-text)]">Auditoria Mensal</button>
            </div>

            <div className="border-t border-[var(--color-card-border)] bg-[var(--color-bg-surface)] p-6">
              <form
                onSubmit={(e) => { e.preventDefault(); void handleSend() }}
                className="flex items-center gap-3 rounded-2xl border border-[var(--color-field-border)] bg-[var(--color-field-fill)] px-4 py-2 shadow-inner transition-all focus-within:border-[var(--color-field-border-focus)]"
              >
                <Terminal size={16} className="text-[var(--color-text-helper)]" />
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pergunte sobre suas finanças..."
                  className="h-12 flex-1 bg-transparent text-sm font-medium text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-placeholder)]"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  aria-label="Enviar pergunta"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-action-primary)] text-white shadow-lg transition-all hover:bg-[var(--color-action-primary-hover)] active:scale-95 disabled:opacity-30"
                >
                  {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>
              <p className="mt-4 text-center text-[8px] font-black uppercase tracking-[0.3em] text-[var(--color-text-helper)] opacity-70">Intelligence Protocol v2.4.0</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
