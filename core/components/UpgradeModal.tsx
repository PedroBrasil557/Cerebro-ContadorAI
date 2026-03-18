'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, CheckCircle2, Zap, BrainCircuit } from 'lucide-react'
import { toast } from 'sonner'

// Interface simplificada para evitar erros de tipagem com a Navigation
interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop Escuro e Borrado */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
        />

        {/* Card do Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#09090b] border border-indigo-500/20 rounded-[2rem] shadow-[0_0_50px_rgba(79,70,229,0.15)] overflow-hidden"
        >
          {/* Efeito de Luz Atmosférica no Topo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.3),transparent_70%)] pointer-events-none" />

          {/* Botão Fechar */}
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors z-20"
          >
            <X size={18} />
          </button>

          <div className="p-8 relative z-10 flex flex-col items-center text-center mt-4">
            {/* Ícone de Destaque Cognitivo */}
            <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6">
              <BrainCircuit className="text-white h-8 w-8" />
            </div>

            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
              Ative o <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Cérebro IA</span>
            </h2>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              O processamento cognitivo e as ferramentas avançadas são exclusivos para membros PRO. Desbloqueie a inteligência do seu sistema.
            </p>

            {/* Lista de Benefícios - IA como foco total */}
            <div className="w-full space-y-3 mb-8 text-left bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                {[
                    'Inteligência Artificial Cognitiva Total',
                    'Central de Dívidas & Plano de Quitação',
                    'Análise de Patrimônio e Investimentos',
                    'Insights e Previsões de Fluxo de Caixa',
                    'Metas e Cartões Ilimitados',
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-indigo-400 shrink-0" />
                        <span className="text-xs font-bold text-gray-300">{item}</span>
                    </div>
                ))}
            </div>

            {/* Botão de Chamada para Ação */}
            <button 
                onClick={() => toast.info('Integração com Stripe em andamento. Quase lá!')}
                className="w-full bg-white text-black hover:bg-gray-200 font-black py-4 rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
            >
                <Zap size={16} className="fill-black" />
                Fazer Upgrade Agora
            </button>
            
            <button 
              onClick={onClose} 
              className="mt-4 text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors"
            >
                Continuar com versão limitada
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}