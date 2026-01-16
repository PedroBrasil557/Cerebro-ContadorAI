'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { 
  LayoutDashboard, Calendar, PieChart, LogOut, 
  TrendingUp, ShieldCheck, Zap, Menu, FileText, User, Bell, Settings 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// SE ESTES IMPORTS FICAREM VERMELHOS, RODE O PASSO 1 NO TERMINAL
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import ViewContainer from './ViewContainer'
import { ActiveTab } from '@/types'

// Interfaces
interface Transaction { id: string; amount: number; type: 'receita' | 'despesa_fixa' | 'despesa_variavel'; description: string; date: string; category: string; }
interface ClientAppointment { id: string; clientName: string; service: string; value: number; date: string; time: string; status: 'agendado' | 'concluido' | 'faltou'; caixaPercentage: number; clientEmail?: string; }
interface Goal { id: string; title: string; target_amount: number; current_amount: number; }
interface CreditCard { id: string; name: string; type: 'credito' | 'debito'; limitOrBalance: number; lastFourDigits: string; dueDay: number; user_id?: string }
interface CaixaEntry { id: string; amount: number; date: string; source: string; }
interface UserProfile { id: string; full_name: string; email: string; phone: string; avatar_url: string; }
interface MarketData { usd: number; btc: number; cdi: number; }
interface EmergencyFund { id: string; current_amount: number; goal_amount: number; }

const THEME_PREMIUM = {
  bg: 'bg-[#030303]',
  header: 'bg-[#030303]/60 backdrop-blur-xl border-b border-white/[0.08]',
  textMain: 'text-white',
  accent: 'indigo-500'
}

interface DataCache {
  transactions: Transaction[]; appointments: ClientAppointment[]; goals: Goal[]; cards: CreditCard[]; caixaEntries: CaixaEntry[]; profile: UserProfile | null; market: MarketData;
}

export default function MainAppLayout({ session }: { session: any }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')
  const [loading, setLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const theme = THEME_PREMIUM
  const supabase = createClient()

  const [dataCache, setDataCache] = useState<DataCache>({
    transactions: [], appointments: [], goals: [], cards: [], caixaEntries: [], profile: null,
    market: { usd: 0, btc: 0, cdi: 0.15 }
  })

  useEffect(() => { if (session?.user && !sessionStorage.getItem('cerebro_session_active')) sessionStorage.setItem('cerebro_session_active', 'true') }, [session])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const results = await Promise.allSettled([
        supabase.from('transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('appointments').select('*').neq('status', 'concluido').neq('status', 'faltou'),
        supabase.from('goals').select('*'),
        supabase.from('credit_cards').select('*'),
        supabase.from('caixa_entries').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      ])

      const getList = (res: any) => (res.status === 'fulfilled' && res.value?.data) ? res.value.data : []
      
      const cleanTx = getList(results[0]).map((t: any) => ({ ...t, category: t.category || 'Geral' }))
      const cleanAppt = getList(results[1]).map((a: any) => ({ id: a.id, clientName: a.client_name, service: a.service, value: a.value, date: a.date, time: a.time, status: a.status, caixaPercentage: a.caixa_percentage ?? 20, clientEmail: a.client_email }))
      const cleanGoals = getList(results[2])
      const cleanCards = getList(results[3]).map((c: any) => ({ id: c.id, name: c.card_alias, type: 'credito', limitOrBalance: c.limit_amount, lastFourDigits: c.last_four_digits, dueDay: c.due_day, user_id: c.user_id }))
      const cleanCaixa = getList(results[4]).map((c: any) => ({ id: c.id, amount: c.amount, date: c.created_at || new Date().toISOString(), source: c.description || c.source || 'Entrada' }))
      const profileData = (results[5].status === 'fulfilled' && results[5].value?.data) ? results[5].value.data : { id: user.id, full_name: '', email: user.email, phone: '', avatar_url: '' }

      // Mercado API
      let marketData = { usd: 0, btc: 0, cdi: 0.15 }
      try {
         const coinReq = fetch('https://economia.awesomeapi.com.br/last/USD-BRL,BTC-BRL').then(r => r.json())
         const coins = await coinReq
         marketData = { usd: Number(coins.USDBRL.bid), btc: Number(coins.BTCBRL.bid), cdi: 0.15 }
      } catch (e) { }

      setDataCache({ transactions: cleanTx, appointments: cleanAppt, goals: cleanGoals, cards: cleanCards, caixaEntries: cleanCaixa, profile: profileData, market: marketData })
    } catch (e) { toast.error("Erro ao sincronizar.") } finally { setLoading(false) }
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const chartsData = useMemo(() => ({ monthlyBalanceHistory: dataCache.transactions.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(t => ({ date: t.date, value: t.type === 'receita' ? Number(t.amount) : -Number(t.amount) })) }), [dataCache.transactions])
  const emergencyFundData = useMemo(() => ({ id: 'main', current_amount: dataCache.caixaEntries.reduce((acc, t) => acc + Number(t.amount), 0), goal_amount: 50000 }), [dataCache.caixaEntries])

  // --- WRAPPER DE AÇÃO ---
  const wrapAction = async (promise: Promise<any>) => {
      const { data, error } = await promise
      if (error) throw new Error(error.message)
      return data || {}
  }

  // --- HANDLERS ---
  const handleSmartSchedule = async (apptData: any) => {
    const targetEmail = apptData.clientEmail || session?.user?.email
    const payload = { 
        client_name: apptData.clientName, // Aqui está a correção
        service: apptData.service,
        value: apptData.value,
        date: apptData.date,
        time: apptData.time,
        caixa_percentage: apptData.caixaPercentage,
        client_email: targetEmail
    }

    const req = fetch('/api/schedule', { method: 'POST', body: JSON.stringify(payload) }).then(async r => {
        const d = await r.json(); if(!r.ok) throw new Error(d.error); return d;
    })

    toast.promise(req, {
      loading: 'Agendando...',
      success: (res) => {
        const newAppt: ClientAppointment = { id: res.data.id, clientName: res.data.client_name, service: res.data.service, value: res.data.value, date: res.data.date, time: res.data.time, status: res.data.status, caixaPercentage: res.data.caixa_percentage ?? 20, clientEmail: targetEmail }
        setDataCache(prev => ({ ...prev, appointments: [...prev.appointments, newAppt] }))
        return 'Agendado!'
      }, error: (err) => `Erro: ${err.message}`
    })
  }

  const handleUpdateProfile = async (d: any) => { const { data } = await supabase.from('profiles').upsert({ id: session.user.id, ...d }).select().single(); if(data) setDataCache(prev => ({...prev, profile: data as any})) }
  const handleAddTransaction = async (d: any) => { const { data } = await supabase.from('transactions').insert({ user_id: session.user.id, ...d }).select().single(); if(data) setDataCache(prev => ({...prev, transactions: [data as any, ...prev.transactions]})) }
  const handleAddGoal = async (d: any) => { const { data } = await supabase.from('goals').insert({ user_id: session.user.id, ...d }).select().single(); if(data) setDataCache(prev => ({...prev, goals: [...prev.goals, data as any]})) }
  const handleAddCard = async (d: any) => { const { data } = await supabase.from('credit_cards').insert({ user_id: session.user.id, card_alias: d.name, last_four_digits: d.lastFourDigits, limit_amount: d.limitOrBalance, due_day: d.dueDay }).select().single(); if(data) fetchData() }
  const handleDeleteCard = async (id: string) => { await supabase.from('credit_cards').delete().eq('id', id); fetchData() }
  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.href = '/login' }
  const handleGeneratePDF = () => { const doc = new jsPDF(); autoTable(doc, { body: dataCache.transactions.map(t => [t.date, t.description, t.amount]) }); doc.save('extrato.pdf') }
  const handleUpdateAppointmentStatus = async (id: string, status: any) => { /* Mesma lógica anterior */ }

  const NavItem = ({ id, label, icon: Icon }: any) => {
    const isActive = activeTab === id
    return (
      <button onClick={() => setActiveTab(id)} className="relative px-4 py-2 rounded-full text-sm font-medium transition-colors group">
        {isActive && (
          <motion.div layoutId="activeTabBg" className={`absolute inset-0 bg-${theme.accent}/10 border border-${theme.accent}/20 rounded-full -z-10`} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
        )}
        <span className={`flex items-center gap-2 relative z-10 ${isActive ? `text-${theme.accent}` : 'text-gray-400 group-hover:text-white'}`}>
          <Icon className="h-4 w-4" /> {label}
        </span>
      </button>
    )
  }

  const userInitials = dataCache.profile?.full_name ? dataCache.profile.full_name.substring(0, 2).toUpperCase() : 'US'

  return (
    <div className={`min-h-screen ${theme.bg} font-sans select-none overflow-hidden`}>
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-20%] w-[70%] h-[70%] rounded-full bg-indigo-900/20 blur-[120px]" />
      </div>

      <header className={`fixed top-0 left-0 right-0 h-16 z-50 ${theme.header} flex items-center justify-between px-6 lg:px-8`}>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className={`h-9 w-9 bg-gradient-to-tr from-${theme.accent} to-violet-600 rounded-xl flex items-center justify-center shadow-lg`}>
                <Zap className="h-5 w-5 text-white fill-white" />
            </div>
            <span className={`text-xl font-bold tracking-tight ${theme.textMain}`}>CÉREBRO.AI</span>
          </div>
          <nav className="hidden xl:flex items-center p-1 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
            <NavItem id="dashboard" label="Visão Geral" icon={LayoutDashboard} />
            <NavItem id="agenda" label="Agenda Smart" icon={Calendar} />
            <NavItem id="transacoes" label="Fluxo" icon={TrendingUp} />
            <NavItem id="caixa" label="Caixa Empresa" icon={ShieldCheck} />
            <NavItem id="investimentos" label="Investimentos" icon={PieChart} />
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse border border-[#030303]" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden border-2 border-transparent hover:border-indigo-500/50">
                <Avatar className="h-full w-full">
                  <AvatarImage src={dataCache.profile?.avatar_url} />
                  <AvatarFallback className="bg-indigo-500/20 text-indigo-500">{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-[#0a0a0a]/95 border-white/10 text-white" align="end">
              <DropdownMenuLabel>{dataCache.profile?.full_name || 'Usuário'}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={() => setActiveTab('perfil')} className="cursor-pointer focus:bg-white/10"> <User className="mr-2 h-4 w-4" /> Perfil </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="text-red-400 cursor-pointer focus:bg-red-500/10"> <LogOut className="mr-2 h-4 w-4" /> Sair </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <main className="relative z-10 pt-24 pb-12 px-4 md:px-6 lg:px-8 max-w-[1600px] mx-auto">
         <ViewContainer 
            activeTab={activeTab} handleRedirect={setActiveTab} user={dataCache.profile} charts={chartsData} emergencyFund={emergencyFundData}
            summary={{ currentBalance: dataCache.transactions.reduce((acc, t) => t.type === 'receita' ? acc + Number(t.amount) : acc - Number(t.amount), 0), monthlyIncome: 0, monthlyExpense: 0, emergencyTotal: 0 }} 
            transactions={dataCache.transactions} appointments={dataCache.appointments} goals={dataCache.goals} cards={dataCache.cards} 
            caixaData={{ currentBalance: dataCache.caixaEntries.reduce((acc, entry) => acc + entry.amount, 0), monthlyGoal: 5000, entries: dataCache.caixaEntries }}
            cdiRate={dataCache.market.cdi} marketRates={dataCache.market}
            onAddAppointment={handleSmartSchedule} onUpdateProfile={handleUpdateProfile} onAddTransaction={handleAddTransaction} onAddGoal={handleAddGoal} onAddCard={handleAddCard} onDeleteCard={handleDeleteCard} onUpdateAppointmentStatus={handleUpdateAppointmentStatus} onUpdateEmergencyFund={async () => {}} onUpdateGoal={async () => {}} setAppointments={async () => {}}
         />
      </main>
    </div>
  )
}