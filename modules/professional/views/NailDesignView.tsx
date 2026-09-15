'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Calendar as CalendarIcon, Users, LayoutGrid, MessageCircle } from 'lucide-react'

// Importação dos componentes do Mini-ERP do Estúdio
import NailDashboard from '../components/nail/NailDashboard'
import NailCalendar from '../components/nail/NailCalendar'
import NailClientManager from '../components/nail/NailClientManager'
import NailServiceManager from '../components/nail/NailServiceManager'

export default function NailDesignView() {
  const [activeTab, setActiveTab] = useState('geral')

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
                      Consulte a agenda para acompanhar os atendimentos registrados. Os indicadores acima usam somente dados salvos na sua conta.
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
