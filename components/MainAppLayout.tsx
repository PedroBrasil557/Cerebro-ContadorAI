'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { 
  LayoutDashboard, Calendar, PieChart, LogOut, Bell, 
  TrendingUp, ShieldCheck, Zap, Sun, Moon, Search, Menu, FileText, User 
} from 'lucide-react'

import ViewContainer from './ViewContainer'
import { ActiveTab } from '@/types'

// --- 1. INTERFACES DE UI ---

interface Transaction {
  id: string
  amount: number
  type: 'receita' | 'despesa_fixa' | 'despesa_variavel'
  description: string
  date: string
  category: string 
  created_at?: string
  user_id?: string
}

interface ClientAppointment {
  id: string
  clientName: string
  service: string
  value: number
  date: string
  time: string
  status: 'agendado' | 'concluido' | 'faltou'
  caixaPercentage: number
  clientEmail?: string
  user_id?: string
}

interface Goal {
  id: string
  title: string
  target_amount: number
  current_amount: number
  user_id?: string
}

interface CreditCard {
  id: string
  name: string          
  type: 'credito' | 'debito' 
  limitOrBalance: number 
  lastFourDigits: string 
  dueDay: number
  user_id?: string
}

interface CaixaEntry {
  id: string
  amount: number
  date: string
  source: string
}

interface UserProfile {
  id: string
  full_name: string
  email: string
  phone: string
  avatar_url: string
}

interface MarketData {
  usd: number
  btc: number
  cdi: number
}

interface ThemeColors {
  mode: 'light' | 'dark'
  bg: string
  header: string
  textMain: string
  textSec: string
  card: string
  accent: string
  accentBg: string
  logo: string
  aiBox: string
  highlight: string
}

interface EmergencyFund {
  id: string
  current_amount: number
  goal_amount: number
}

// --- 2. ENGINE DE TEMAS ---
const THEMES: Record<'light' | 'dark', ThemeColors> = {
  light: {
    mode: 'light',
    bg: 'bg-slate-50',
    header: 'bg-white/80 backdrop-blur-md border-b border-slate-200',
    textMain: 'text-slate-900',
    textSec: 'text-slate-500',
    card: 'bg-white border border-slate-200 shadow-sm',
    accent: 'text-indigo-600',
    accentBg: 'bg-indigo-600',
    logo: 'text-indigo-600',
    aiBox: 'bg-gradient-to-r from-indigo-50 to-white border-indigo-100',
    highlight: 'bg-indigo-50 text-indigo-700 ring-indigo-200'
  },
  dark: {
    mode: 'dark',
    bg: 'bg-[#0a0a0a]',
    header: 'bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10',
    textMain: 'text-white',
    textSec: 'text-gray-400',
    card: 'bg-[#111] border border-white/10 shadow-2xl',
    accent: 'text-violet-500',
    accentBg: 'bg-violet-600',
    logo: 'text-violet-500',
    aiBox: 'bg-gradient-to-r from-violet-900/20 to-black border-violet-500/20',
    highlight: 'bg-violet-500/10 text-violet-400 ring-violet-500/20'
  }
}

interface DataCache {
  transactions: Transaction[]
  appointments: ClientAppointment[]
  goals: Goal[]
  cards: CreditCard[]
  caixaEntries: CaixaEntry[]
  profile: UserProfile | null
  market: MarketData
}

export default function MainAppLayout({ session }: { session: any }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')
  const [loading, setLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentMode, setCurrentMode] = useState<'light' | 'dark'>('dark')
  
  const theme = THEMES[currentMode]
  const supabase = createClientComponentClient()

  const [dataCache, setDataCache] = useState<DataCache>({
    transactions: [],
    appointments: [],
    goals: [],
    cards: [],
    caixaEntries: [],
    profile: null,
    market: { usd: 0, btc: 0, cdi: 0.1125 } // Valor base seguro
  })

  // --- CORREÇÃO DO LOOP DE LOGIN ---
  // Removido o useEffect agressivo que causava o logout.
  // Agora apenas garantimos que se não houver sessão, redirecionamos.
  useEffect(() => {
    if (!session) {
        window.location.href = '/login'
    }
  }, [session])

  // Hidratação do Tema
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('cerebro-theme') as 'light' | 'dark'
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setCurrentMode(savedTheme)
      }
    }
  }, [])

  const toggleTheme = () => {
    const newMode = currentMode === 'light' ? 'dark' : 'light'
    setCurrentMode(newMode)
    localStorage.setItem('cerebro-theme', newMode)
    toast.success(`Modo ${newMode === 'light' ? 'Claro' : 'Escuro'} ativado`)
  }

  // --- MOTOR DE DADOS ---
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

      const [txRes, apRes, glRes, cdRes, cxRes, profRes] = results

      const getList = <T,>(res: PromiseSettledResult<{ data: T[] | null; error: any }>): T[] => {
        if (res.status === 'fulfilled' && res.value.data) {
          return res.value.data
        }
        return []
      }

      let profileData: UserProfile | null = null
      if (profRes.status === 'fulfilled' && profRes.value.data) {
        profileData = profRes.value.data as UserProfile
      } else {
        profileData = { id: user.id, full_name: '', email: user.email || '', phone: '', avatar_url: '' }
      }

      // --- FETCH MERCADO (SELIC REAL + DÓLAR) ---
      let marketData = { usd: 0, btc: 0, cdi: 0.1125 }
      try {
         // Consulta Selic no Banco Central via BrasilAPI
         const selicReq = fetch('https://brasilapi.com.br/api/taxas/v1').then(r => r.json())
         const coinReq = fetch('https://economia.awesomeapi.com.br/last/USD-BRL,BTC-BRL').then(r => r.json())
         
         const [taxas, coins] = await Promise.all([selicReq, coinReq])
         
         // Encontra a taxa Selic exata
         const selicObj = taxas.find((t: any) => t.nome === 'Selic')
         const selicVal = selicObj ? (selicObj.valor / 100) : 0.1125

         marketData = {
             usd: Number(coins.USDBRL.bid),
             btc: Number(coins.BTCBRL.bid),
             cdi: selicVal
         }
      } catch (e) { console.warn("Mercado offline, usando dados em cache.") }

      // --- ADAPTADORES DB -> UI ---
      
      const rawTx = getList<any>(txRes)
      const cleanTx: Transaction[] = rawTx.map((t: any) => ({
        ...t,
        category: t.category || 'Geral'
      }))

      const rawAppt = getList<any>(apRes)
      const cleanAppt: ClientAppointment[] = rawAppt.map((a: any) => ({
        id: a.id,
        clientName: a.client_name, 
        service: a.service,
        value: a.value,
        date: a.date,
        time: a.time,
        status: a.status,
        caixaPercentage: a.caixa_percentage ?? 20,
        clientEmail: a.client_email
      }))

      const rawCards = getList<any>(cdRes)
      const cleanCards: CreditCard[] = rawCards.map((c: any) => ({
        id: c.id,
        name: c.card_alias,
        type: 'credito' as const,
        limitOrBalance: c.limit_amount,
        lastFourDigits: c.last_four_digits,
        dueDay: c.due_day,
        user_id: c.user_id
      }))

      const rawCaixa = getList<any>(cxRes)
      const cleanCaixa: CaixaEntry[] = rawCaixa.map((c: any) => ({
        id: c.id,
        amount: c.amount,
        date: c.created_at || new Date().toISOString(),
        source: c.description || c.source || 'Entrada',
      }))

      setDataCache({
        transactions: cleanTx,
        appointments: cleanAppt,
        goals: getList<Goal>(glRes),
        cards: cleanCards,
        caixaEntries: cleanCaixa,
        profile: profileData,
        market: marketData
      })

    } catch (e) {
      console.error("Critical Fetch Error:", e)
      toast.error("Erro ao sincronizar dados.")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  // --- DADOS DERIVADOS ---
  const chartsData = useMemo(() => {
    const monthlyBalanceHistory = dataCache.transactions
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(t => ({
        date: t.date,
        value: t.type === 'receita' ? Number(t.amount) : -Number(t.amount)
      }))
    return { monthlyBalanceHistory }
  }, [dataCache.transactions])

  const emergencyFundData = useMemo(() => {
    const total = dataCache.caixaEntries.reduce((acc, t) => acc + Number(t.amount), 0)
    return { id: 'main', current_amount: total, goal_amount: 50000 }
  }, [dataCache.caixaEntries])

  // --- WRAPPERS ---
  const wrapSupabaseAction = async <T,>(
    builderPromise: PromiseLike<{ data: T | null; error: any }>,
    errorMessage: string = "Erro na operação"
  ): Promise<T> => {
    const { data, error } = await builderPromise
    if (error) throw new Error(error.message || errorMessage)
    if (data === null) return {} as T
    return data
  }

  // --- HANDLERS ---

  // *** CORREÇÃO DO EMAIL: USA SEU EMAIL (LOGIN) PARA O CONVITE ***
  const handleSmartSchedule = async (apptData: any) => {
    
    // Fallback: Se não tem email do cliente, usa o seu (do profissional)
    // Isso evita o erro "E-mail inválido"
    const finalEmail = (apptData.clientEmail && apptData.clientEmail.includes('@')) 
        ? apptData.clientEmail 
        : session?.user?.email

    const scheduleFn = async () => {
        if (!finalEmail || !finalEmail.includes('@')) {
            throw new Error("Erro: Perfil sem e-mail cadastrado.")
        }
        
        // Injeta o email correto no payload para a API
        const payload = { 
            ...apptData, 
            client_email: finalEmail // Força o envio para este email
        }

        const res = await fetch('/api/schedule', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || "Erro ao criar agendamento")
        return body.data
    }

    toast.promise(scheduleFn(), {
      loading: 'Agendando e enviando convite...',
      success: (data) => {
        const newAppt: ClientAppointment = { 
            id: data.id,
            clientName: data.client_name,
            service: data.service,
            value: data.value,
            date: data.date,
            time: data.time,
            status: data.status,
            caixaPercentage: data.caixa_percentage ?? 20,
            clientEmail: finalEmail // Exibe o email para onde foi
        }
        setDataCache(prev => ({
          ...prev,
          appointments: [...prev.appointments, newAppt]
        }))
        return `Agendado! Convite enviado para ${finalEmail}`
      },
      error: (err) => `Falha: ${err.message}`
    })
  }

  const handleUpdateProfile = async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return toast.error("Sessão inválida.")

      const action = supabase.from('profiles').upsert({
          id: user.id,
          full_name: data.full_name,
          phone: data.phone,
          avatar_url: data.avatar_url,
          email: user.email,
          updated_at: new Date().toISOString()
      }).select().single()

      toast.promise(wrapSupabaseAction(action, "Erro ao atualizar perfil"), {
          loading: 'Salvando perfil...',
          success: (res) => {
              setDataCache(prev => ({ ...prev, profile: res as UserProfile }))
              return 'Perfil atualizado com sucesso!'
          },
          error: (err) => `Erro: ${err.message}`
      })
  }

  const handleAddTransaction = async (t: Partial<Transaction>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const action = supabase.from('transactions').insert({
      user_id: user.id,
      description: t.description,
      amount: t.amount,
      type: t.type,
      category: t.category || 'Geral',
      date: t.date
    }).select().single()

    toast.promise(wrapSupabaseAction(action, "Erro ao gravar transação"), {
      loading: 'Registrando...',
      success: (res) => {
        const newTx = { ...res, category: res.category || 'Geral' } as Transaction
        setDataCache(prev => ({ ...prev, transactions: [newTx, ...prev.transactions] }))
        return 'Transação registrada!'
      },
      error: (err) => `Erro: ${err.message}`
    })
  }

  const handleAddGoal = async (g: Partial<Goal>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const action = supabase.from('goals').insert({
      user_id: user.id,
      title: g.title,
      target_amount: g.target_amount,
      current_amount: 0
    }).select().single()

    toast.promise(wrapSupabaseAction(action, "Erro ao criar meta"), {
      loading: 'Criando meta...',
      success: (res) => {
        setDataCache(prev => ({ ...prev, goals: [...prev.goals, res as Goal] }))
        return 'Meta criada!'
      },
      error: (err) => `Erro: ${err.message}`
    })
  }

  const handleAddCard = async (c: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const action = supabase.from('credit_cards').insert({
      user_id: user.id,
      card_alias: c.name || c.alias,
      last_four_digits: c.lastFourDigits || c.lastFour,
      limit_amount: c.limitOrBalance || c.limit,
      due_day: c.dueDay
    }).select().single()

    toast.promise(wrapSupabaseAction(action, "Erro ao adicionar cartão"), {
      loading: 'Adicionando...',
      success: (res) => {
        const newCard: CreditCard = {
            id: res.id,
            name: res.card_alias,
            type: 'credito',
            limitOrBalance: res.limit_amount,
            lastFourDigits: res.last_four_digits,
            dueDay: res.due_day,
            user_id: res.user_id
        }
        setDataCache(prev => ({ ...prev, cards: [...prev.cards, newCard] }))
        return 'Cartão adicionado!'
      },
      error: (err) => `Erro: ${err.message}`
    })
  }

  const handleDeleteCard = async (id: string) => {
    const deleteAction = async () => {
        const { error } = await supabase.from('credit_cards').delete().eq('id', id)
        if (error) throw error
        return { success: true }
    }

    toast.promise(deleteAction(), {
      loading: 'Removendo...',
      success: () => {
        setDataCache(prev => ({ ...prev, cards: prev.cards.filter(c => c.id !== id) }))
        return 'Cartão removido.'
      },
      error: (err) => `Erro: ${err.message}`
    })
  }

  const handleUpdateAppointmentStatus = async (id: string, status: 'concluido' | 'faltou' | 'remarcar') => {
    const action = supabase.from('appointments').update({ status }).eq('id', id).select().single()

    try {
      await wrapSupabaseAction(action, "Erro ao atualizar status")
      
      const apptToUpdate = dataCache.appointments.find(a => a.id === id)
      
      setDataCache(prev => ({
        ...prev,
        appointments: prev.appointments.filter(a => a.id !== id)
      }))

      if (status === 'concluido' && apptToUpdate && session?.user?.id) {
         const percent = apptToUpdate.caixaPercentage ?? 20
         const valCaixa = Number(apptToUpdate.value) * (percent / 100)
         const valWallet = Number(apptToUpdate.value) - valCaixa
         const today = new Date().toISOString().split('T')[0]

         await Promise.all([
           supabase.from('caixa_entries').insert({ 
             user_id: session.user.id, amount: valCaixa, source: `Serviço: ${apptToUpdate.clientName}`, date: today 
           }),
           supabase.from('transactions').insert({ 
             user_id: session.user.id, description: `Atendimento: ${apptToUpdate.clientName}`, amount: valWallet, type: 'receita', category: 'Serviços', date: today 
           })
         ])
         
         fetchData()
         toast.success(`Serviço concluído! R$ ${valWallet.toFixed(2)} foi para o fluxo.`)
      } else {
        toast.info("Status atualizado.")
      }
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleGeneratePDF = () => {
    try {
      const doc = new jsPDF()
      doc.setFillColor(79, 70, 229); 
      doc.rect(0, 0, 210, 20, 'F');
      doc.setTextColor(255, 255, 255); 
      doc.setFontSize(16); 
      doc.text('CÉREBRO.AI - Extrato Oficial', 14, 13)
      
      doc.setTextColor(0, 0, 0); 
      doc.setFontSize(10);
      const userName = dataCache.profile?.full_name || session?.user?.email || 'Cliente'
      doc.text(`Cliente: ${userName}`, 14, 30)
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString()}`, 14, 35)

      const tableData = dataCache.transactions.map(t => [
        new Date(t.date || '').toLocaleDateString(),
        t.description,
        t.type === 'receita' ? `+ R$ ${Number(t.amount).toFixed(2)}` : `- R$ ${Number(t.amount).toFixed(2)}`
      ])

      autoTable(doc, {
        head: [['Data', 'Descrição', 'Valor']],
        body: tableData,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
      })
      
      doc.save('extrato_cerebro.pdf')
      toast.success("Download iniciado!")
    } catch (err) { 
      toast.error("Erro ao gerar PDF.") 
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // --- UI COMPONENTS ---

  const NavItem = ({ id, label, icon: Icon }: any) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
      ${activeTab === id ? `${theme.highlight} ring-1` : `${theme.textSec} hover:${theme.textMain} hover:bg-black/5 dark:hover:bg-white/5`}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )

  return (
    <div className={`min-h-screen ${theme.bg} font-sans transition-colors duration-300`}>
      <header className={`fixed top-0 left-0 right-0 h-16 z-50 ${theme.header} flex items-center justify-between px-6 lg:px-12 transition-colors duration-300`}>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 ${theme.accentBg} rounded-lg flex items-center justify-center`}>
              <Zap className="h-5 w-5 text-white fill-white" />
            </div>
            <span className={`text-lg font-bold tracking-tight ${theme.textMain}`}>
              CÉREBRO<span className={theme.logo}>.AI</span>
            </span>
          </div>

          <nav className="hidden xl:flex items-center gap-1">
            <NavItem id="dashboard" label="Visão Geral" icon={LayoutDashboard} />
            <NavItem id="agenda" label="Agenda Smart" icon={Calendar} />
            <NavItem id="transacoes" label="Fluxo" icon={TrendingUp} />
            <NavItem id="caixa" label="Caixa Empresa" icon={ShieldCheck} />
            <NavItem id="investimentos" label="Investimentos" icon={PieChart} />
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col items-end mr-2">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status do Sistema</span>
             <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Online & Seguro
             </span>
          </div>
          
          <div className="h-8 w-px bg-slate-200 dark:bg-white/10" />

          <button onClick={handleGeneratePDF} className={`hidden md:flex p-2 rounded-full transition ${theme.textSec} hover:${theme.textMain}`} title="Baixar Extrato PDF">
             <FileText className="h-5 w-5" />
          </button>

          <button onClick={toggleTheme} className={`p-2 rounded-full transition ${theme.textSec} hover:${theme.textMain} hover:bg-black/5 dark:hover:bg-white/5`}>
            {currentMode === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>

          <button onClick={handleSignOut} className={`p-2 rounded-full transition ${theme.textSec} hover:text-red-500`}>
            <LogOut className="h-5 w-5" />
          </button>

          <div 
             className={`h-9 w-9 rounded-full overflow-hidden border cursor-pointer ${currentMode === 'light' ? 'border-slate-300 bg-slate-200' : 'border-white/20 bg-white/10'}`}
             onClick={() => setActiveTab('perfil')}
          >
             {dataCache.profile?.avatar_url ? (
               <img src={dataCache.profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
             ) : (
               <div className={`h-full w-full flex items-center justify-center font-bold text-xs ${theme.textSec}`}>
                  {(session?.user?.email || 'US').substring(0,2).toUpperCase()}
               </div>
             )}
          </div>
          
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="xl:hidden p-2 text-gray-400">
             <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>
      
      {isMenuOpen && (
        <div className={`fixed top-16 left-0 right-0 z-40 border-b xl:hidden ${theme.header} animate-in slide-in-from-top-5`}>
           <div className="p-4 flex flex-col gap-2">
              <NavItem id="dashboard" label="Visão Geral" icon={LayoutDashboard} />
              <NavItem id="agenda" label="Agenda Smart" icon={Calendar} />
              <NavItem id="transacoes" label="Fluxo Financeiro" icon={TrendingUp} />
              <NavItem id="caixa" label="Caixa Empresa" icon={ShieldCheck} />
              <NavItem id="investimentos" label="Investimentos" icon={PieChart} />
              <NavItem id="perfil" label="Meu Perfil" icon={User} />
           </div>
        </div>
      )}

      <main className="pt-24 pb-12 px-4 md:px-6 lg:px-12 max-w-[1600px] mx-auto transition-colors duration-300">
         <div className={`mb-8 p-4 rounded-xl flex items-start gap-4 shadow-sm border ${theme.aiBox} transition-colors duration-300`}>
            <div className={`p-2 rounded-lg ${currentMode === 'light' ? 'bg-indigo-100 text-indigo-600' : 'bg-violet-500/20 text-violet-400'}`}>
               <Zap className="h-5 w-5" />
            </div>
            <div>
               <h3 className={`text-sm font-bold ${currentMode === 'light' ? 'text-indigo-900' : 'text-white'}`}>Insight do Cérebro</h3>
               <p className={`text-sm mt-1 ${currentMode === 'light' ? 'text-indigo-700/80' : 'text-gray-400'}`}>
                  Seu caixa empresarial está saudável. Continue focando em serviços de alto valor agregado.
               </p>
            </div>
         </div>

         <ViewContainer
            activeTab={activeTab}
            handleRedirect={setActiveTab}
            user={dataCache.profile}
            
            // Dados & Gráficos
            charts={chartsData}
            emergencyFund={emergencyFundData}

            summary={{ 
                currentBalance: dataCache.transactions.reduce((acc, t) => t.type === 'receita' ? acc + Number(t.amount) : acc - Number(t.amount), 0),
                monthlyIncome: dataCache.transactions.filter(t => t.type === 'receita').reduce((acc, t) => acc + Number(t.amount), 0),
                monthlyExpense: dataCache.transactions.filter(t => t.type !== 'receita').reduce((acc, t) => acc + Number(t.amount), 0),
                emergencyTotal: dataCache.caixaEntries.reduce((acc, t) => acc + Number(t.amount), 0)
            }} 

            transactions={dataCache.transactions}
            appointments={dataCache.appointments}
            goals={dataCache.goals}
            cards={dataCache.cards}
            caixaData={{ 
              currentBalance: dataCache.caixaEntries.reduce((acc, t) => acc + Number(t.amount), 0),
              monthlyGoal: 5000, 
              entries: dataCache.caixaEntries 
            }}
            cdiRate={dataCache.market.cdi}
            marketRates={dataCache.market}

            // Handlers
            onAddAppointment={handleSmartSchedule}
            onUpdateProfile={handleUpdateProfile}
            onAddTransaction={handleAddTransaction}
            onAddGoal={handleAddGoal}
            onAddCard={handleAddCard}
            onDeleteCard={handleDeleteCard}
            onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
            
            // Placeholders
            onUpdateEmergencyFund={async () => {}}
            onUpdateGoal={async () => {}}
            setAppointments={async () => {}}
         />
      </main>
    </div>
  )
}