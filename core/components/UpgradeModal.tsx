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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isRedirecting ? onClose : undefined}
          className="absolute inset-0 cursor-pointer bg-[var(--color-overlay)] backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="upgrade-modal-title"
          className="relative w-full max-w-[440px] overflow-hidden rounded-[3rem] border border-[var(--color-card-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-floating)]"
        >
          <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-full -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--color-action-ai)_22%,transparent),transparent_70%)]" />

          {!isRedirecting && (
            <button
              type="button"
              aria-label="Fechar"
              onClick={onClose}
              className="absolute right-6 top-6 z-20 rounded-full border border-[var(--color-card-border)] bg-[var(--color-bg-elevated)] p-2.5 text-[var(--color-text-helper)] transition-all hover:bg-[var(--color-action-ghost-hover)] hover:text-[var(--color-text-primary)]"
            >
              <X size={18} />
            </button>
          )}

          <div className="relative z-10 flex flex-col items-center p-10 text-center">
            <motion.div
              animate={isRedirecting ? { rotate: 360 } : {}}
              transition={isRedirecting ? { repeat: Infinity, duration: 2, ease: 'linear' } : {}}
              className="mb-8 flex h-20 w-20 items-center justify-center rounded-[2rem] border border-white/20 bg-gradient-to-br from-indigo-500 to-purple-700 shadow-2xl shadow-indigo-500/30"
            >
              {isRedirecting ? <Loader2 className="h-10 w-10 animate-spin text-white" /> : <BrainCircuit className="h-10 w-10 text-white" />}
            </motion.div>

            <h2 id="upgrade-modal-title" className="mb-3 text-3xl font-black tracking-tighter text-[var(--color-text-primary)]">
              Cérebro.IA <span className="text-[var(--color-action-ai)]">PRO</span>
            </h2>
            <p className="mb-10 text-sm font-medium leading-relaxed text-[var(--color-text-secondary)]">
              O Cérebro.IA aguarda ativação. Desbloqueie análises avançadas, central de dívidas e projeções patrimoniais.
            </p>

            <div className="mb-10 grid w-full grid-cols-1 gap-4 text-left">
              {[
                { txt: 'Análises financeiras assistidas', icon: Sparkles },
                { txt: 'Plano de quitação de dívidas', icon: Swords },
                { txt: 'Patrimônio: Gestão de Ativos', icon: TrendingDown },
                { txt: 'Cartões e Metas Ilimitados', icon: Layers },
              ].map((item) => (
                <div key={item.txt} className="flex items-center gap-4 rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-bg-elevated)] p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-card-accent-fill)] text-[var(--color-action-ai)]">
                    <item.icon size={16} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">{item.txt}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isRedirecting}
              className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-[1.5rem] bg-[var(--color-action-primary)] py-5 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-text-on-action)] shadow-[var(--shadow-card-strong)] transition-all hover:bg-[var(--color-action-primary-hover)] hover:scale-[1.02] active:scale-95 disabled:bg-[var(--color-action-disabled-fill)] disabled:text-[var(--color-text-disabled)]"
            >
              {isRedirecting ? 'Sincronizando com Stripe...' : (
                <>
                  <Zap size={16} className="fill-current group-hover:animate-pulse" />
                  Assinar PRO
                </>
              )}
            </button>

            <div className="mt-6 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[var(--color-text-helper)]">
              <ShieldCheck size={12} className="text-[var(--color-status-success)]" />
              Pagamento Seguro via Stripe
            </div>

            {!isRedirecting && (
              <button
                type="button"
                onClick={onClose}
                className="mt-8 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-helper)] transition-colors hover:text-[var(--color-text-primary)]"
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
