'use client'

import React, { useState } from 'react'
import { Plus, Check, X, Clock, Calendar as CalendarIcon, User } from 'lucide-react'
import { ClientAppointment } from '@/types_db'
import { formatCurrency } from '@/lib/utils'
import AddAppointmentModal from '@/components/AddAppointmentModal'

interface AgendaViewProps {
  appointments: ClientAppointment[]
  setAppointments: React.Dispatch<React.SetStateAction<ClientAppointment[]>>
  onUpdateStatus: (id: string, status: 'concluido' | 'faltou' | 'remarcar') => void
  onAddAppointment: (appt: any) => void
}

export default function AgendaView({ appointments, setAppointments, onUpdateStatus, onAddAppointment }: AgendaViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="p-6 md:p-8 animate-in fade-in space-y-8">
      
      <AddAppointmentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onAddAppointment}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h2 className="text-3xl font-bold text-white">Agenda Smart</h2>
            <p className="text-gray-400">Gerencie clientes e automatize seu caixa.</p>
         </div>
         <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-3 rounded-xl font-bold transition shadow-lg shadow-violet-900/20"
         >
            <Plus className="h-5 w-5" /> Novo Agendamento
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appointments.map((appt) => (
          <div key={appt.id} className="bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-violet-500/30 transition group">
             
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-violet-400 group-hover:bg-violet-500/10 transition">
                      <User className="h-5 w-5" />
                   </div>
                   <div>
                      {/* Tenta ler clientName (frontend) ou client_name (banco) */}
                      <h3 className="font-bold text-white leading-none mb-1">
                          {appt.clientName || (appt as any).client_name}
                      </h3>
                      <p className="text-xs text-gray-400">{appt.service}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="font-bold text-white">{formatCurrency(Number(appt.value))}</p>
                   <p className="text-[10px] text-gray-500">
                       {appt.caixaPercentage || (appt as any).caixa_percentage || 20}% p/ Caixa
                   </p>
                </div>
             </div>

             <div className="flex items-center gap-4 mb-6 text-sm text-gray-400 bg-black/20 p-3 rounded-lg border border-white/5">
                <div className="flex items-center gap-1.5">
                   <CalendarIcon className="h-4 w-4 text-violet-500" />
                   <span>{appt.date}</span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-1.5">
                   <Clock className="h-4 w-4 text-violet-500" />
                   <span>{appt.time}</span>
                </div>
             </div>

             <div className="grid grid-cols-3 gap-2">
                <button onClick={() => onUpdateStatus(appt.id, 'concluido')} className="flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white py-2.5 rounded-lg text-xs font-bold transition border border-emerald-500/20">
                   <Check className="h-3 w-3" /> Concluir
                </button>
                <button onClick={() => onUpdateStatus(appt.id, 'remarcar')} className="flex items-center justify-center gap-1.5 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white py-2.5 rounded-lg text-xs font-bold transition border border-orange-500/20">
                   <Clock className="h-3 w-3" /> Remarcar
                </button>
                <button onClick={() => onUpdateStatus(appt.id, 'faltou')} className="flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-2.5 rounded-lg text-xs font-bold transition border border-red-500/20">
                   <X className="h-3 w-3" /> Faltou
                </button>
             </div>
          </div>
        ))}
      </div>

      {appointments.length === 0 && (
         <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
            <p className="text-gray-400">Nenhum agendamento pendente.</p>
         </div>
      )}
    </div>
  )
}