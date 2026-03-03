'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Link as LinkIcon, Share2 } from 'lucide-react'
import { toast } from 'sonner'

// Importação dos componentes do Mini-ERP do Estúdio
import NailDashboard from '../components/nail/NailDashboard'
import NailCalendar from '../components/nail/NailCalendar'
import NailClientManager from '../components/nail/NailClientManager'
import NailServiceManager from '../components/nail/NailServiceManager'

export default function NailDesignView() {
  const [activeTab, setActiveTab] = useState('geral')

  const handleCopyLink = () => {
    // No futuro, este link será gerado dinamicamente com o ID do utilizador
    const link = "https://cerebro.os/agendar/pedro-nail-studio"
    navigator.clipboard.writeText(link)
    toast.success("Link de agendamento copiado para a área de transferência!")
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
          <p className="text-sm text-gray-400 font-medium">Controlo total da sua agenda, clientes e faturação.</p>
        </div>
        
        <button 
          onClick={handleCopyLink}
          className="group flex items-center gap-3 bg-pink-500 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:bg-pink-400 active:scale-95 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]"
        >
          <LinkIcon size={16} className="group-hover:rotate-12 transition-transform" />
          Copiar Link Público
          <Share2 size={14} className="opacity-50" />
        </button>
      </header>

      {/* NAVEGAÇÃO INTERNA DO MÓDULO */}
      <div className="flex space-x-2 overflow-x-auto custom-scrollbar pb-2">
        {['geral', 'clientes', 'catalogo'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
              activeTab === tab 
                ? 'bg-white/10 text-white border border-white/20' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
            }`}
          >
            {tab === 'geral' ? 'Visão Geral & Agenda' : tab === 'clientes' ? 'CRM de Clientes' : 'Catálogo de Serviços'}
          </button>
        ))}
      </div>

      {/* ÁREA DE CONTEÚDO DINÂMICO */}
      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'geral' && (
          <div className="space-y-6">
            {/* Métricas no topo */}
            <NailDashboard />
            
            {/* Agenda ocupa o resto do espaço */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <NailCalendar />
              </div>
              <div className="lg:col-span-1 space-y-6">
                {/* Pode-se colocar um mini-resumo ou atalhos rápidos aqui no futuro */}
                <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-3xl p-6 text-center">
                  <h4 className="text-white font-bold mb-2">Próximo Passo:</h4>
                  <p className="text-sm text-pink-200/70 mb-4">Crie o seu link público para as clientes agendarem sozinhas.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clientes' && (
          <div className="max-w-4xl">
            <NailClientManager />
          </div>
        )}

        {activeTab === 'catalogo' && (
          <div className="max-w-5xl">
            <NailServiceManager />
          </div>
        )}
      </motion.div>

    </div>
  )
}