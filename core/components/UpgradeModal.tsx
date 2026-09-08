'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, X, Zap, BrainCircuit, Loader2, 
  ShieldCheck, Swords, TrendingDown, Layers 
} from 'lucide-react'
import { toast } from 'sonner'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Função para disparar o Checkout do Stripe
  const handleUpgrade = async () => {
    setIsRedirecting(true)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' }),
      })

      const data = await response.json() as {
        url?: string
        error?: { message?: string }
      }

      if (!response.ok) {
        throw new Error(data.error?.message || 'Falha ao iniciar checkout.')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Falha ao gerar link de pagamento')
      }
    } catch {
      toast.error('Erro ao iniciar portal de pagamento. Tente novamente.')
      setIsRedirecting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop com desfoque profundo */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={!isRedirecting ? onClose : undefined}
          className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer"
        />

        {/* Card do Modal Estilo Elite */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          className="relative w-full max-w-[440px] bg-[#09090b] border border-white/10 rounded-[3rem] shadow-[0_0_80px_rgba(79,70,229,0.2)] overflow-hidden"
        >
          {/* Efeito de iluminação superior */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.25),transparent_70%)] pointer-events-none" />

          {/* Botão Fechar (Invisível durante loading) */}
          {!isRedirecting && (
            <button 
              onClick={onClose} 
              className="absolute top-6 right-6 p-2.5 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all z-20"
            >
              <X size={18} />
            </button>
          )}

          <div className="p-10 relative z-10 flex flex-col items-center text-center">
            {/* Ícone Animado */}
            <motion.div 
              animate={isRedirecting ? { rotate: 360 } : {}}
              transition={isRedirecting ? { repeat: Infinity, duration: 2, ease: "linear" } : {}}
              className="h-20 w-20 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-8 border border-white/20"
            >
              {isRedirecting ? <Loader2 className="text-white h-10 w-10 animate-spin" /> : <BrainCircuit className="text-white h-10 w-10" />}
            </motion.div>

            <h2 className="text-3xl font-black text-white mb-3 tracking-tighter uppercase italic">
              Acesso <span className="text-indigo-400">Total</span>
            </h2>
            <p className="text-sm text-gray-400 mb-10 leading-relaxed font-medium">
              O Cérebro.IA aguarda ativação. Desbloqueie análises avançadas, central de dívidas e projeções patrimoniais.
            </p>

            {/* Grid de Benefícios Premium */}
            <div className="w-full grid grid-cols-1 gap-4 mb-10 text-left">
              {[
                { txt: 'Cérebro IA: Auditoria Cognitiva', icon: Sparkles },
                { txt: 'Sala de Guerra: Plano de Quitação', icon: Swords },
                { txt: 'Patrimônio: Gestão de Ativos', icon: TrendingDown },
                { txt: 'Cartões e Metas Ilimitados', icon: Layers },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <item.icon size={16} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-gray-300">{item.txt}</span>
                </div>
              ))}
            </div>

            {/* CTA Principal */}
            <button 
                onClick={handleUpgrade}
                disabled={isRedirecting}
                className="group relative w-full bg-white text-black disabled:bg-gray-600 font-black py-5 rounded-[1.5rem] text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-2xl hover:scale-[1.02] active:scale-95 overflow-hidden"
            >
                {isRedirecting ? (
                  <>Sincronizando com Stripe...</>
                ) : (
                  <>
                    <Zap size={16} className="fill-black group-hover:animate-pulse" />
                    Ativar Membrana PRO
                  </>
                )}
            </button>

            <div className="mt-6 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-600">
                <ShieldCheck size={12} className="text-emerald-500" />
                Pagamento Seguro via Stripe
            </div>
            
            {!isRedirecting && (
              <button 
                onClick={onClose} 
                className="mt-8 text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-[0.2em] transition-colors"
              >
                Continuar com limitações
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
