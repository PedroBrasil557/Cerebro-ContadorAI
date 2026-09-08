'use client'

import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, Bot, Crown, Loader2, ScanLine, UserPlus, Users } from 'lucide-react'

interface Metrics {
  totalUsers: number
  activeUsers: number
  freeUsers: number
  proUsers: number
  premiumUsers: number
  activeSubscriptions: number
  pastDueSubscriptions: number
  canceledSubscriptions: number
  aiUsage: number
  ocrUsage: number
  newUsers7d: number
  newUsers30d: number
}

export default function FounderDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/metrics', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json() as { metrics?: Metrics; error?: { message?: string } }
        if (!response.ok || !result.metrics) throw new Error(result.error?.message || 'Falha ao carregar métricas.')
        setMetrics(result.metrics)
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Falha ao carregar métricas.'))
  }, [])

  if (error) return <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-8 text-rose-300"><AlertTriangle className="mb-3" />{error}</div>
  if (!metrics) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-indigo-400" /></div>

  const cards = [
    ['Usuários totais', metrics.totalUsers, Users], ['Ativos em 30d', metrics.activeUsers, Activity],
    ['FREE', metrics.freeUsers, Users], ['PRO', metrics.proUsers, Crown], ['PREMIUM', metrics.premiumUsers, Crown],
    ['Assinaturas ativas', metrics.activeSubscriptions, Activity], ['Past due', metrics.pastDueSubscriptions, AlertTriangle],
    ['Cancelamentos', metrics.canceledSubscriptions, AlertTriangle], ['Uso de IA', metrics.aiUsage, Bot],
    ['Uso de OCR', metrics.ocrUsage, ScanLine], ['Novos em 7d', metrics.newUsers7d, UserPlus], ['Novos em 30d', metrics.newUsers30d, UserPlus],
  ] as const

  return (
    <section className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
      <header><p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400">Administração</p><h1 className="mt-2 text-4xl font-black text-white">Visão agregada</h1><p className="mt-2 text-sm text-gray-500">Nenhum dado financeiro individual é exibido.</p></header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value, Icon]) => <article key={label} className="rounded-3xl border border-white/5 bg-[#09090b] p-6"><Icon className="mb-6 text-indigo-400" size={20} /><p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p><p className="mt-2 text-3xl font-black text-white">{value}</p></article>)}
      </div>
    </section>
  )
}
