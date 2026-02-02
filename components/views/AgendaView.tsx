'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar as CalendarIcon, Clock, User, CheckCircle2, 
  XCircle, Plus, Mail, DollarSign, TrendingUp // Importando TrendingUp
} from 'lucide-react'
import { ClientAppointment } from '@/types_db'
import { formatCurrency } from '@/lib/utils'

// Componente simples para KPIs (interno)
const KPICard = ({ label, value, subtext, icon: Icon, trend }: any) => (
  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
    <div className="flex justify-between items-start mb-2">
      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
        <Icon size={18} />
      </div>
      {trend && <span className="text-[10px] font-bold text-emerald-400">+{trend}%</span>}
    </div>
    <div>
      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-xl font-black text-white">{value}</h3>
      {subtext && <p className="text-[10px] text-gray-400 mt-1">{subtext}</p>}
    </div>
  </div>
)

interface AgendaViewProps {
  appointments: ClientAppointment[]
  onStatusChange: (id: string, status: string) => void
  onAddAppointment: (data: any) => void
}

const NewAppointmentModal = ({ isOpen, onClose, onSave }: any) => {
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    service: '',
    value: '',
    date: '',
    time: ''
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Combina data e hora para ISO String
    const combinedDate = new Date(`${formData.date}T${formData.time}:00`)
    onSave({
      client_name: formData.client_name,
      client_email: formData.client_email,
      service: formData.service,
      value: Number(formData.value),
      date: combinedDate.toISOString()
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md bg-[#09090b] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><XCircle /></button>
        <h2 className="text-xl font-bold text-white mb-6">Novo Agendamento</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="text-xs font-bold text-gray-500 uppercase">Cliente</label><input required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" onChange={e => setFormData({...formData, client_name: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Email</label><input type="email" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" onChange={e => setFormData({...formData, client_email: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
             <div><label className="text-xs font-bold text-gray-500 uppercase">Data</label><input required type="date" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" onChange={e => setFormData({...formData, date: e.target.value})} /></div>
             <div><label className="text-xs font-bold text-gray-500 uppercase">Hora</label><input required type="time" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" onChange={e => setFormData({...formData, time: e.target.value})} /></div>
          </div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Serviço</label><input required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" onChange={e => setFormData({...formData, service: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Valor (R$)</label><input required type="number" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" onChange={e => setFormData({...formData, value: e.target.value})} /></div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl mt-2">Agendar</button>
        </form>
      </motion.div>
    </div>
  )
}

export default function AgendaView({ appointments, onStatusChange, onAddAppointment }: AgendaViewProps) {
  const [filter, setFilter] = useState('todos')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredAppointments = appointments.filter(appt => {
    if (filter === 'todos') return true
    if (filter === 'hoje') {
      const today = new Date().toDateString()
      return new Date(appt.date).toDateString() === today
    }
    return appt.status === filter
  })

  // Cálculos simples para KPIs
  const totalValue = filteredAppointments.reduce((acc, curr) => acc + Number(curr.value), 0)

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-[1800px] mx-auto pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">Agenda Smart</h1>
          <p className="text-gray-400 font-light">Gerencie seus atendimentos.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition active:scale-95">
          <Plus size={18} /> Novo Agendamento
        </button>
      </div>

      {/* KPIs Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard label="Total Filtrado" value={formatCurrency(totalValue)} icon={DollarSign} />
          <KPICard label="Agendamentos" value={filteredAppointments.length} icon={CalendarIcon} />
          <KPICard label="Eficiência" value="100%" icon={TrendingUp} trend={5} /> 
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['todos', 'hoje', 'agendado', 'concluido'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${filter === f ? 'bg-blue-600 border-blue-600 text-white' : 'bg-transparent border-white/10 text-gray-500'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01] text-gray-500">
             <Clock size={40} className="mb-4 opacity-50" />
             <p>Nenhum agendamento encontrado.</p>
          </div>
        ) : (
          filteredAppointments.map((appt) => (
            <div key={appt.id} className="group bg-[#09090b]/60 border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 hover:border-white/10 transition-all">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className={`p-3 rounded-xl ${appt.status === 'concluido' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                   {appt.status === 'concluido' ? <CheckCircle2 size={20} /> : <CalendarIcon size={20} />}
                </div>
                <div>
                   <h3 className="text-white font-bold text-lg">{appt.client_name}</h3>
                   <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                      <span className="flex items-center gap-1"><Clock size={12}/> {new Date(appt.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-600" />
                      <span>{appt.service}</span>
                   </div>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                 <span className="font-mono font-bold text-white text-lg">{formatCurrency(appt.value)}</span>
                 <div className="flex items-center gap-2">
                    {appt.status !== 'concluido' && (
                      <button onClick={() => onStatusChange(appt.id, 'concluido')} className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20 transition-colors">Concluir</button>
                    )}
                    {appt.status !== 'cancelado' && (
                      <button onClick={() => onStatusChange(appt.id, 'cancelado')} className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-rose-400 transition-colors"><XCircle size={18} /></button>
                    )}
                 </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        <NewAppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={onAddAppointment} />
      </AnimatePresence>
    </div>
  )
}