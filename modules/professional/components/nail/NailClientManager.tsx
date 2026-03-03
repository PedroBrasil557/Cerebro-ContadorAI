import React from 'react'
import { motion } from 'framer-motion'
import { Search, Star, Cake, Phone } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function NailClientManager() {
  const clients = [
    { id: 1, name: "Fernanda Souza", phone: "(47) 99999-1111", spent: 1250, vip: true },
    { id: 2, name: "Beatriz Lima", phone: "(47) 99999-2222", spent: 450, vip: false },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white">Carteira de Clientes</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input type="text" placeholder="Buscar cliente..." className="bg-black/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-pink-500/50" />
        </div>
      </div>

      <div className="space-y-2">
        {clients.map(client => (
          <div key={client.id} className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold">
                {client.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  {client.name} {client.vip && <Star size={12} className="text-amber-400 fill-amber-400" />}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10}/> {client.phone}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">LTV (Gasto Total)</p>
              <p className="text-sm font-black text-emerald-400">{formatCurrency(client.spent)}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}