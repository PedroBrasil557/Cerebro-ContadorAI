'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, LayoutGrid, Clock, DollarSign, 
  Trash2, Edit3, Layers, Save, X 
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface Service {
  id: string
  name: string
  price: number
  duration: string
  materialCost: number
}

export default function NailServiceManager() {
  const [services, setServices] = useState<Service[]>([
    { id: '1', name: 'Alongamento Fibra', price: 180, duration: '150 min', materialCost: 22.50 },
    { id: '2', name: 'Manutenção Gel', price: 120, duration: '90 min', materialCost: 15.80 }
  ])
  
  const [isAdding, setIsAdding] = useState(false)
  const [newService, setNewService] = useState({ name: '', price: '', duration: '', materialCost: '' })

  const handleAddService = () => {
    if (!newService.name || !newService.price) return
    
    const service: Service = {
      id: Math.random().toString(36).substr(2, 9),
      name: newService.name,
      price: parseFloat(newService.price),
      duration: newService.duration + ' min',
      materialCost: parseFloat(newService.materialCost) || 0
    }

    setServices([...services, service])
    setIsAdding(false)
    setNewService({ name: '', price: '', duration: '', materialCost: '' })
    toast.success("Serviço adicionado ao catálogo.")
  }

  return (
    <div className="space-y-6">
      {/* HEADER DO MÓDULO */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3 bg-pink-500 rounded-full" />
          <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Catálogo de Serviços</h3>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
        >
          <Plus size={14} /> Novo Serviço
        </button>
      </div>

      {/* FORMULÁRIO DE ADIÇÃO RÁPIDA */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
          >
            <div className="space-y-2">
              <label className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Nome do Serviço</label>
              <input 
                type="text" 
                value={newService.name}
                onChange={e => setNewService({...newService, name: e.target.value})}
                placeholder="Ex: Blindagem"
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-pink-500/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Preço Sugerido (R$)</label>
              <input 
                type="number" 
                value={newService.price}
                onChange={e => setNewService({...newService, price: e.target.value})}
                placeholder="0,00"
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-pink-500/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Custo Mat. (R$)</label>
              <input 
                type="number" 
                value={newService.materialCost}
                onChange={e => setNewService({...newService, materialCost: e.target.value})}
                placeholder="0,00"
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-pink-500/50"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddService} className="flex-1 bg-pink-600 text-white h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-pink-700 transition-all">Salvar</button>
              <button onClick={() => setIsAdding(false)} className="bg-white/5 text-gray-400 px-3 h-10 rounded-xl hover:bg-white/10 transition-all"><X size={16}/></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GRID DE SERVIÇOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {services.map((service) => (
          <div key={service.id} className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-pink-500 transition-colors">{service.name}</h4>
                <div className="flex items-center gap-3 mt-1 text-gray-500">
                  <div className="flex items-center gap-1 text-[10px] font-medium uppercase">
                    <Clock size={12} /> {service.duration}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-gray-600 hover:text-white transition-colors"><Edit3 size={14}/></button>
                <button className="p-2 text-gray-600 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
              <div>
                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1">Custo Insumos</p>
                <p className="text-sm font-bold text-rose-500/80">{formatCurrency(service.materialCost)}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1">Preço Final</p>
                <p className="text-base font-black text-white">{formatCurrency(service.price)}</p>
              </div>
            </div>

            <div className="mt-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 flex justify-between items-center">
              <span className="text-[9px] text-emerald-500/70 font-bold uppercase tracking-widest">Margem de Contribuição</span>
              <span className="text-xs font-black text-emerald-500">
                {(((service.price - service.materialCost) / service.price) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}