import React from 'react'
import { motion } from 'framer-motion'
import { Scissors, Clock as ClockIcon, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function NailServiceManager() {
  const services = [
    { id: 1, name: "Alongamento Fibra de Vidro", price: 180, duration: 120 },
    { id: 2, name: "Manutenção Fibra", price: 100, duration: 90 },
    { id: 3, name: "Banho de Gel", price: 90, duration: 60 },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Scissors className="text-pink-400" size={20} /> Catálogo de Serviços
        </h3>
        <button className="bg-pink-500 hover:bg-pink-600 text-white p-2 rounded-xl transition-colors">
          <Plus size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(service => (
          <div key={service.id} className="p-4 rounded-2xl bg-black/40 border border-white/5">
            <h4 className="text-sm font-bold text-white mb-3">{service.name}</h4>
            <div className="flex justify-between items-end">
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <ClockIcon size={12}/> {service.duration} min
              </p>
              <p className="text-lg font-black text-pink-400">{formatCurrency(service.price)}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}