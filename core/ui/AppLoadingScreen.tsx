'use client'

import React, { useEffect, useId, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BrainCircuit, CheckCircle2, Cpu, ShieldCheck } from 'lucide-react'

interface AppLoadingScreenProps {
  isLoading: boolean // Estado real de carregamento do pai
}

const LOADING_MESSAGES = [
  "Estabelecendo conexão segura neural...",
  "Sincronizando transações financeiras...",
  "Carregando módulos de inteligência artificial...",
  "Calculando projeções de patrimônio...",
  "Otimizando fluxo de caixa...",
  "Renderizando dashboard..."
]

export default function AppLoadingScreen({ isLoading }: AppLoadingScreenProps) {
  const sessionId = useId().replaceAll(':', '').toUpperCase()
  const [progress, setProgress] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  // 1. Lógica da Barra de Progresso "Cinemática"
  useEffect(() => {
    if (isLoading) {
      // Avança rápido até 30%, desacelera até 70%, rasteja até 90% e espera
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 30) return prev + 2      // Início rápido
          if (prev < 60) return prev + 0.5    // Meio constante
          if (prev < 85) return prev + 0.1    // Final tenso (esperando dados)
          return prev
        })
      }, 50)
      return () => clearInterval(interval)
    }

    // Agenda as atualizações para preservar a transição sem encadear renderizações no efeito.
    const progressTimer = setTimeout(() => setProgress(100), 0)
    const completionTimer = setTimeout(() => setIsComplete(true), 800)
    return () => {
      clearTimeout(progressTimer)
      clearTimeout(completionTimer)
    }
  }, [isLoading])

  // 2. Rotação de Mensagens
  useEffect(() => {
    if (!isLoading) return
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 1800) // Troca frase a cada 1.8s
    return () => clearInterval(messageInterval)
  }, [isLoading])

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          data-testid="app-loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(15px)", scale: 1.02 }} // Saída cinematográfica
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505] overflow-hidden font-sans"
        >
          {/* --- LAYER 1: AMBIENTE E BACKGROUND --- */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Gradientes Orbitais */}
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1], 
                opacity: [0.2, 0.4, 0.2],
                rotate: [0, 90, 0]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-blue-600/10 rounded-full blur-[150px]" 
            />
            <motion.div 
              animate={{ 
                scale: [1, 1.3, 1], 
                opacity: [0.1, 0.3, 0.1],
                x: [0, -50, 0]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-600/10 rounded-full blur-[150px]" 
            />
            {/* Grid Sutil ao fundo (Noise Texture opcional) */}
            <div className="absolute inset-0 bg-[url('/bg-grid.svg')] opacity-[0.02]" />
          </div>

          {/* --- LAYER 2: CONTEÚDO CENTRAL --- */}
          <div className="relative z-10 w-full max-w-[400px] px-6 flex flex-col items-center">
            
            {/* Logo Animado */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-10 flex flex-col items-center"
            >
              <div className="relative w-20 h-20 flex items-center justify-center mb-6">
                {/* Glow pulsante atrás do ícone */}
                <motion.div 
                   animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.1, 1] }}
                   transition={{ duration: 2, repeat: Infinity }}
                   className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full" 
                />
                {/* Anel giratório tecnológico */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border border-blue-500/20 border-t-blue-400 border-r-transparent"
                />
                {/* Ícone Central */}
                <div className="relative z-10 bg-gradient-to-br from-gray-900 to-black p-4 rounded-2xl border border-white/10 shadow-2xl">
                  <BrainCircuit className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-white tracking-tight text-center">
                CÉREBRO<span className="text-blue-500">.AI</span>
              </h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-[10px] text-blue-200/40 uppercase tracking-[0.4em] mt-3 font-medium"
              >
                Financial Operating System
              </motion.p>
            </motion.div>

            {/* Barra de Progresso e Status */}
            <div className="w-full space-y-3">
              
              {/* Texto de Status (Typewriter effect simulado) */}
              <div className="h-6 flex items-center justify-between text-xs font-mono">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={messageIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="text-blue-300/80 flex items-center gap-2"
                  >
                    {progress < 100 ? (
                        <Cpu size={12} className="animate-pulse text-blue-500" /> 
                    ) : (
                        <CheckCircle2 size={12} className="text-emerald-400" />
                    )}
                    {progress === 100 ? "Sistema pronto." : LOADING_MESSAGES[messageIndex]}
                  </motion.span>
                </AnimatePresence>
                
                <span className="text-blue-500/60 font-bold tabular-nums">{Math.round(progress)}%</span>
              </div>

              {/* Container da Barra */}
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden relative backdrop-blur-sm border border-white/5">
                {/* Efeito de brilho percorrendo a barra (Shimmer) */}
                <motion.div 
                    className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent z-20 blur-[2px]"
                    animate={{ x: [-100, 400] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Fill da Barra */}
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 relative z-10 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
                />
              </div>

              {/* Metadados Técnicos (Footer) */}
              <div className="flex justify-between items-center pt-4 opacity-30 border-t border-white/5 mt-4">
                 <div className="flex items-center gap-1.5">
                    <ShieldCheck size={10} className="text-emerald-500" />
                    <span className="text-[9px] text-white font-mono uppercase tracking-wider">Secure Connection</span>
                 </div>
                 <span className="text-[9px] text-white font-mono">ID: {sessionId}</span>
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
