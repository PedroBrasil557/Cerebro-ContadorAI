import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, CalendarHeart, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function NailDashboard() {
  // Mock de dados para renderização inicial
  const metrics = {
    revenue: 4500,
    appointments: 32,
    ticket: 140,
    newClients: 5
  }

  const Card = ({ title, value, icon: Icon, color }: any) => (
    <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md flex items-center gap-4 hover:bg-white/[0.04] transition-all">
      <div className={`p-3 rounded-2xl ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-black text-white">{value}</h3>
      </div>
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Faturamento (Mês)" value={formatCurrency(metrics.revenue)} icon={TrendingUp} color="bg-emerald-500/10 text-emerald-400" />
        <Card title="Agendamentos" value={metrics.appointments} icon={CalendarHeart} color="bg-pink-500/10 text-pink-400" />
        <Card title="Ticket Médio" value={formatCurrency(metrics.ticket)} icon={DollarSign} color="bg-blue-500/10 text-blue-400" />
        <Card title="Novas Clientes" value={`+${metrics.newClients}`} icon={Users} color="bg-purple-500/10 text-purple-400" />
      </div>
    </motion.div>
  )
}