'use client'

import React, { useState } from 'react'
import { Calendar, Clock, UserPlus, Video, MapPin, Plus } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function AgendaView() {
  const [events, setEvents] = useState([
    { id: 1, title: 'Reunião de Investimentos', time: '14:00', date: new Date(), type: 'meeting' },
    { id: 2, title: 'Pagar Aluguel', time: '09:00', date: addDays(new Date(), 2), type: 'bill' },
    { id: 3, title: 'Revisão de Metas', time: '16:30', date: addDays(new Date(), 1), type: 'review' },
  ])

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Agenda Inteligente</h2>
          <p className="text-gray-400">Sincronizado com Google Calendar (Simulado)</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 font-medium text-white hover:bg-brand-primary-dark">
          <Plus className="h-5 w-5" /> Novo Evento
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de Eventos */}
        <div className="lg:col-span-2 space-y-4">
          {events.map(evt => (
            <div key={evt.id} className="group flex items-center gap-4 rounded-xl border border-white/5 bg-[#111] p-5 transition hover:border-brand-primary/50">
              <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-white/5 text-gray-300">
                 <span className="text-xs font-bold uppercase">{format(evt.date, 'MMM', { locale: ptBR })}</span>
                 <span className="text-2xl font-bold">{format(evt.date, 'dd')}</span>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{evt.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {evt.time}</span>
                  <span className="flex items-center gap-1"><Video className="h-3 w-3" /> Zoom Meeting</span>
                </div>
              </div>

              <button className="rounded-full p-2 hover:bg-white/10 text-gray-400 group-hover:text-white">
                <UserPlus className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Mini Calendário Lateral (Decorativo) */}
        <div className="rounded-2xl border border-white/5 bg-[#111] p-6 h-fit">
           <h4 className="font-bold text-white mb-4">Próximos 7 Dias</h4>
           <div className="space-y-4">
              {[0,1,2,3,4].map(i => (
                <div key={i} className="flex items-center justify-between text-sm">
                   <span className="text-gray-400">{format(addDays(new Date(), i), "EEEE", { locale: ptBR })}</span>
                   <div className="h-2 w-2 rounded-full bg-gray-700" />
                </div>
              ))}
           </div>
           <div className="mt-6 pt-6 border-t border-white/5">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold">G</div>
                <span>pedro@gmail.com</span>
                <span className="ml-auto text-green-500 text-xs px-2 py-1 bg-green-500/10 rounded">Conectado</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}