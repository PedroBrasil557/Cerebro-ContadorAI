import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, CalendarHeart, DollarSign, type LucideIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { financeService } from '@/services/financeService'

interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: string
}

function MetricCard({ title, value, icon: Icon, color }: MetricCardProps) {
  return (
    <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md flex items-center gap-4 hover:bg-white/[0.04] transition-all">
      <div className={`p-3 rounded-2xl ${color}`}><Icon size={24} /></div>
      <div>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-black text-white">{value}</h3>
      </div>
    </div>
  )
}

interface DashboardMetrics {
  revenue: number
  appointments: number
  ticket: number
  clients: number
}

export default function NailDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)

  useEffect(() => {
    let active = true
    financeService.getAppointments().then((appointments) => {
      if (!active) return
      const month = new Date().toISOString().slice(0, 7)
      const current = appointments.filter((appointment) => appointment.date.startsWith(month) && appointment.status !== 'cancelado')
      const revenue = current.reduce((total, appointment) => total + Number(appointment.value), 0)
      setMetrics({
        revenue,
        appointments: current.length,
        ticket: current.length ? revenue / current.length : 0,
        clients: new Set(current.map((appointment) => appointment.client_name)).size,
      })
    }).catch(() => {
      if (active) setMetrics({ revenue: 0, appointments: 0, ticket: 0, clients: 0 })
    })
    return () => { active = false }
  }, [])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Faturamento (Mês)" value={metrics ? formatCurrency(metrics.revenue) : '—'} icon={TrendingUp} color="bg-emerald-500/10 text-emerald-400" />
        <MetricCard title="Agendamentos" value={metrics?.appointments ?? '—'} icon={CalendarHeart} color="bg-pink-500/10 text-pink-400" />
        <MetricCard title="Ticket Médio" value={metrics ? formatCurrency(metrics.ticket) : '—'} icon={DollarSign} color="bg-blue-500/10 text-blue-400" />
        <MetricCard title="Clientes atendidas" value={metrics?.clients ?? '—'} icon={Users} color="bg-purple-500/10 text-purple-400" />
      </div>
    </motion.div>
  )
}
