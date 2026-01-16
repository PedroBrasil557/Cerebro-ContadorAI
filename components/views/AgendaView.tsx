'use client'

import React, { useState } from 'react'
import { ClientAppointment } from '@/types_db'
import { Calendar, Check, X, Clock, User, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface AgendaProps {
  appointments: ClientAppointment[]
  setAppointments: React.Dispatch<React.SetStateAction<ClientAppointment[]>>
  onComplete: (id: string) => void
}

export default function AgendaView({ appointments, setAppointments, onComplete }: AgendaProps) {
  const [showModal, setShowModal] = useState(false)
  
  // Form State
  const [newClient, setNewClient] = useState('')
  const [service, setService] = useState('')
  const [value, setValue] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [percentage, setPercentage] = useState(20)

  const handleAdd = () => {
    const newAppt: ClientAppointment = {
      id: Math.random().toString(),
      clientName: newClient,
      service,
      value: Number(value),
      date,
      time,
      status: 'agendado',
      caixaPercentage: percentage
    }
    setAppointments([...appointments, newAppt])
    setShowModal(false)
    // Reset form...
  }

  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-3xl font-bold text-white">Agenda Smart</h2>
           <p className="text-gray-400">Gerencie clientes e automatize seu caixa.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition">
           <Plus className="h-5 w-5" /> Novo Agendamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {appointments.length === 0 && (
           <div className="col-span-full text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-2xl">
              Nenhum agendamento para hoje.
           </div>
        )}
        
        {appointments.map(appt => (
          <div key={appt.id} className={`p-5 rounded-2xl border ${appt.status === 'concluido' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-[#111]'} relative overflow-hidden group`}>
             <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-violet-400"><User className="h-5 w-5"/></div>
                   <div>
                      <h3 className="font-bold text-white">{appt.clientName}</h3>
                      <p className="text-xs text-gray-400">{appt.service}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="font-bold text-white">{formatCurrency(appt.value)}</p>
                   <p className="text-[10px] text-gray-500">{appt.caixaPercentage}% p/ Caixa</p>
                </div>
             </div>
             
             <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3"/> {appt.date}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3"/> {appt.time}</span>
             </div>

             {appt.status === 'agendado' ? (
                <div className="flex gap-2 mt-2">
                   <button onClick={() => onComplete(appt.id)} className="flex-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white py-2 rounded-lg text-xs font-bold transition flex justify-center items-center gap-1">
                      <Check className="h-3 w-3" /> Concluir
                   </button>
                   <button className="flex-1 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white py-2 rounded-lg text-xs font-bold transition">
                      Remarcar
                   </button>
                   <button className="flex-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-2 rounded-lg text-xs font-bold transition">
                      Faltou
                   </button>
                </div>
             ) : (
                <div className="mt-2 text-center py-2 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-bold border border-emerald-500/20">
                   Concluído (Valor adicionado ao saldo)
                </div>
             )}
          </div>
        ))}
      </div>

      {/* Modal Simplificado de Adição */}
      {showModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#151515] p-6 rounded-2xl border border-white/10 w-full max-w-md space-y-4">
               <h3 className="text-xl font-bold text-white">Novo Cliente</h3>
               <input placeholder="Nome do Cliente" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white" value={newClient} onChange={e => setNewClient(e.target.value)} />
               <input placeholder="Procedimento" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white" value={service} onChange={e => setService(e.target.value)} />
               <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Valor (R$)" className="bg-black/50 border border-white/10 rounded-lg p-3 text-white" value={value} onChange={e => setValue(e.target.value)} />
                  <input type="number" placeholder="% Caixa (20)" className="bg-black/50 border border-white/10 rounded-lg p-3 text-white" value={percentage} onChange={e => setPercentage(Number(e.target.value))} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <input type="date" className="bg-black/50 border border-white/10 rounded-lg p-3 text-white" value={date} onChange={e => setDate(e.target.value)} />
                  <input type="time" className="bg-black/50 border border-white/10 rounded-lg p-3 text-white" value={time} onChange={e => setTime(e.target.value)} />
               </div>
               <button onClick={handleAdd} className="w-full bg-violet-600 py-3 rounded-lg font-bold text-white">Salvar na Agenda</button>
               <button onClick={() => setShowModal(false)} className="w-full text-gray-500 py-2">Cancelar</button>
            </div>
         </div>
      )}
    </div>
  )
}