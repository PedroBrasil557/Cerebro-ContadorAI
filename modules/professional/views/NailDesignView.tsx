'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, Link as LinkIcon, Share2, Calendar as CalendarIcon, 
  Users, LayoutGrid, Plus, Smartphone, MessageCircle 
} from 'lucide-react'
import { toast } from 'sonner'

// Importação dos componentes do Mini-ERP do Estúdio
import NailDashboard from '../components/nail/NailDashboard'
import NailCalendar from '../components/nail/NailCalendar'
import NailClientManager from '../components/nail/NailClientManager'
import NailServiceManager from '../components/nail/NailServiceManager'

export default function NailDesignView() {
  const [activeTab, setActiveTab] = useState('geral')

  const handleCopyLink = () => {
    // Link dinâmico para agendamento público
    const link = "https://cerebro.os/agendar/pedro-nail-studio"
    navigator.clipboard.writeText(link)
    toast.success("Link de agendamento copiado! Envie para suas clientes.")
  }

  return (
    <div className="p-4 md:p-10 space-y-8 max-w-[1600px] mx-auto pb-32 animate-in fade-in duration-700">
      
      {/* CABEÇALHO DA VISÃO DO ESTÚDIO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Gestão do Estúdio</h1>
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-black uppercase tracking-widest">
              <Sparkles size={12} />
              Nail Design
            </div>
          </div>
          <p className="text-sm text-gray-400 font-medium">Controle total da sua agenda, clientes e faturação estratégica.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handleCopyLink}
            className="flex-1 md:flex-none group flex items-center justify-center gap-3 bg-pink-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-pink-400 active:scale-95 shadow-[0_0_20px_rgba(236,72,153,0.3)]"
          >
            <LinkIcon size={16} className="group-hover:rotate-12 transition-transform" />
            Link de Agendamento
            <Share2 size={14} className="opacity-50" />
          </button>
        </div>
      </header>

      {/* NAVEGAÇÃO INTERNA (Segmented Control Estilo Apple) */}
      <div className="flex p-1 bg-[#050505] border border-white/5 rounded-2xl w-fit overflow-x-auto scrollbar-none">
        {[
          { id: 'geral', label: 'Agenda & Dashboard', icon: CalendarIcon },
          { id: 'clientes', label: 'CRM de Clientes', icon: Users },
          { id: 'catalogo', label: 'Catálogo de Serviços', icon: LayoutGrid }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-white/10 text-white shadow-lg' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ÁREA DE CONTEÚDO DINÂMICO */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'geral' && (
            <div className="space-y-6">
              {/* Métricas Reais do Estúdio */}
              <NailDashboard />
              
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Agenda Principal */}
                <div className="lg:col-span-3">
                  <NailCalendar />
                </div>

                {/* Lateral Inteligente: Atalhos e IA Insights */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <MessageCircle size={14} className="text-pink-500" /> Lembrete Rápido
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed font-medium">
                      Você tem <span className="text-white font-bold">4 atendimentos</span> confirmados para hoje. 
                      A receita projetada é de <span className="text-emerald-400 font-bold">R$ 580,00</span>.
                    </p>
                    <button className="w-full mt-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all">
                      Enviar Lembretes WhatsApp
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-pink-500/10 to-indigo-500/10 border border-white/5 rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12">
                      <Smartphone size={80} />
                    </div>
                    <h4 className="text-white font-bold mb-2 relative z-10">Crescimento</h4>
                    <p className="text-xs text-pink-200/70 mb-4 relative z-10">
                      Clientes que agendam pelo link público tendem a retornar 30% mais vezes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clientes' && (
            <div className="bg-[#050505] border border-white/5 rounded-3xl p-1">
              <NailClientManager />
            </div>
          )}

          {activeTab === 'catalogo' && (
            <div className="bg-[#050505] border border-white/5 rounded-3xl p-1">
              <NailServiceManager />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  )
}