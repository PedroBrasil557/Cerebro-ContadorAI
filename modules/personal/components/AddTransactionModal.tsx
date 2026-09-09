'use client'

import React, { useState } from 'react'
import { X, Calendar, Clock, User, DollarSign, Briefcase } from 'lucide-react'

interface AddAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (appointment: {
    clientName: string
    service: string
    value: number
    date: string
    time: string
    status: 'agendado'
    caixaPercentage: number
  }) => void
}

export default function AddAppointmentModal({ isOpen, onClose, onSave }: AddAppointmentModalProps) {
  const [clientName, setClientName] = useState('')
  const [service, setService] = useState('')
  const [value, setValue] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação básica
    if (!clientName || !service || !value || !date || !time) return

    onSave({
      clientName,
      service,
      value: parseFloat(value.replace(',', '.')), // Garante formato numérico
      date,
      time,
      status: 'agendado',
      caixaPercentage: 20 // Padrão de 20%
    })

    // Limpar formulário
    setClientName('')
    setService('')
    setValue('')
    setDate('')
    setTime('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-6">Novo Agendamento</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Cliente */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Cliente</label>
            <div className="relative">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
                <input 
                  type="text"
                  placeholder="Nome do Cliente"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-violet-500 transition"
                  autoFocus
                />
            </div>
          </div>

          {/* Serviço */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Serviço</label>
            <div className="relative">
                <Briefcase className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
                <input 
                  type="text"
                  placeholder="Ex: Consultoria, Corte..."
                  value={service}
                  onChange={e => setService(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-violet-500 transition"
                />
            </div>
          </div>

          {/* Valor */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Valor (R$)</label>
            <div className="relative">
                <DollarSign className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
                <input 
                  type="number"
                  placeholder="0.00"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-violet-500 transition"
                />
            </div>
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Data</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
                    <input 
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-violet-500 transition [color-scheme:dark]"
                    />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Horário</label>
                <div className="relative">
                    <Clock className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
                    <input 
                      type="time"
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-violet-500 transition [color-scheme:dark]"
                    />
                </div>
              </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-4 rounded-xl transition mt-4 shadow-lg shadow-violet-900/20"
          >
            Confirmar Agendamento
          </button>
        </form>
      </div>
    </div>
  )
}
