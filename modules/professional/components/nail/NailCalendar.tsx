import React from 'react'
import { motion } from 'framer-motion'
import { Clock, User, CheckCircle2 } from 'lucide-react'

export default function NailCalendar() {
  // Mock de horários
  const appointments = [
    { id: 1, client: "Amanda Silva", service: "Manutenção Fibra", time: "09:00", status: "confirmado" },
    { id: 2, client: "Juliana Costa", service: "Alongamento Gel", time: "11:30", status: "pendente" },
    { id: 3, client: "Carolina Mendes", service: "Esmaltação em Gel", time: "14:00", status: "confirmado" },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <Clock className="text-pink-400" size={20} /> Agenda de Hoje
      </h3>
      
      <div className="space-y-3">
        {appointments.map((appt) => (
          <div key={appt.id} className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-pink-500/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="text-lg font-black text-white w-16">{appt.time}</div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  <User size={14} className="text-gray-400"/> {appt.client}
                </p>
                <p className="text-xs text-pink-400 font-medium">{appt.service}</p>
              </div>
            </div>
            {appt.status === 'confirmado' && <CheckCircle2 size={20} className="text-emerald-400" />}
          </div>
        ))}
      </div>
    </motion.div>
  )
}