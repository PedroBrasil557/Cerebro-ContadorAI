'use client'

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Session, createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { toast } from 'sonner' // UX Profissional
import { ActiveTab } from '@/types'
import { 
  CreditCard, Goal, Transaction, ClientAppointment, CaixaData, NewGoal, NewTransaction 
} from '@/types_db'
import { Bell, Search, Menu, LogOut, User, Loader2, FileText } from 'lucide-react'

import Navigation from './Navigation'
import ViewContainer from './ViewContainer'

// --- Interfaces ---
interface UserProfile {
  id: string
  full_name: string
  email: string
  phone: string
  avatar_url: string
}

// --- TopBar Component ---
const TopBar = ({ title, user, profile, notifications, onToggleMenu, onNavigate, onLogout, onGeneratePDF }: any) => {
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
  
    useEffect(() => {
      function handleClickOutside(event: any) {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setShowProfileMenu(false)
        }
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])
  
    return (
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-xl px-4 md:px-8">
        <div className="flex items-center gap-4">
          <button onClick={onToggleMenu} className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg transition">
              <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold capitalize text-white">{title}</h1>
        </div>
  
        <div className="flex items-center gap-4 md:gap-6">
           <button 
              onClick={onGeneratePDF}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-600/20 rounded-lg text-xs font-bold text-violet-400 transition"
           >
              <FileText className="h-4 w-4" /> Extrato PDF
           </button>

           <div className="h-6 w-px bg-white/10 mx-1 hidden md:block" />

           {/* Notificações Ativas */}
           <div className="relative group">
             <button className="relative p-2 text-gray-400 hover:text-white transition">
               <Bell className="h-5 w-5" />
               {notifications?.length > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
             </button>
             {/* Dropdown Simples de Notificações */}
             <div className="absolute right-0 mt-2 w-64 bg-[#111] border border-white/10 rounded-xl shadow-2xl p-4 hidden group-hover:block z-50">
                <h4 className="text-xs font-bold text-gray-400 mb-2">Últimas Atualizações</h4>
                {notifications.length === 0 ? (
                    <p className="text-xs text-gray-500">Nenhuma notificação.</p>
                ) : (
                    notifications.map((n: any, i: number) => (
                        <div key={i} className="mb-2 pb-2 border-b border-white/5 last:border-0">
                            <p className="text-xs text-white">{n.message}</p>
                            <p className="text-[10px] text-gray-500">{n.time}</p>
                        </div>
                    ))
                )}
             </div>
           </div>
  
           <div className="relative" ref={menuRef}>
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 cursor-pointer p-1 rounded-full hover:bg-white/5 transition border border-transparent hover:border-white/10">
                 <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center border border-white/10 overflow-hidden">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <span className="font-bold text-xs text-white">{user?.email?.substring(0,2).toUpperCase() || 'US'}</span>
                    )}
                 </div>
              </button>
              {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#111] border border-white/10 shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-4 py-2 border-b border-white/5 mb-1">
                          <p className="text-xs text-gray-400">Logado como</p>
                          <p className="text-sm font-bold text-white truncate">{profile?.full_name || user?.email}</p>
                      </div>
                      <button onClick={() => { onNavigate('perfil'); setShowProfileMenu(false) }} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition">
                          <User className="h-4 w-4" /> Meu Perfil
                      </button>
                      <button onClick={onLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition">
                          <LogOut className="h-4 w-4" /> Desconectar
                      </button>
                  </div>
              )}
           </div>
        </div>
      </header>
    )
}

export default function MainAppLayout({ session }: { session: Session }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [appointments, setAppointments] = useState<ClientAppointment[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [cards, setCards] = useState<CreditCard[]>([])
  const [caixaEntries, setCaixaEntries] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  
  // Dados de Mercado (API Real)
  const [marketRates, setMarketRates] = useState({ usd: 0, btc: 0, cdi: 0.1165 })

  const fetchData = useCallback(async () => {
    try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if(!user) return

        // 1. Perfil
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
        if (profile) setUserProfile(profile)
        else setUserProfile({ id: user.id, full_name: '', email: user.email || '', phone: '', avatar_url: '' })

        // 2. Dados Financeiros
        const { data: tx } = await supabase.from('transactions').select('*').order('created_at', { ascending: false })
        const { data: ap } = await supabase.from('appointments').select('*').neq('status', 'concluido').neq('status', 'faltou')
        const { data: gl } = await supabase.from('goals').select('*')
        const { data: cd } = await supabase.from('credit_cards').select('*')
        const { data: cx } = await supabase.from('caixa_entries').select('*').order('created_at', { ascending: false })

        if (tx) setTransactions(tx)
        if (ap) setAppointments(ap)
        if (gl) setGoals(gl)
        if (cd) setCards(cd)
        if (cx) setCaixaEntries(cx)

        // 3. API FINANCEIRA (AwesomeAPI)
        try {
            const res = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,BTC-BRL')
            const data = await res.json()
            setMarketRates(prev => ({
                ...prev,
                usd: Number(data.USDBRL.bid),
                btc: Number(data.BTCBRL.bid)
            }))
        } catch (err) {
            console.error("Erro ao buscar cotações:", err)
        }

    } catch (e) { 
        console.error("Erro no fetchData:", e) 
    } finally { 
        setLoading(false) 
    }
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  // --- NOTIFICAÇÕES INTELIGENTES ---
  const dynamicNotifications = useMemo(() => {
    const notifs = []
    if (appointments.length > 0) {
        notifs.push({ message: `Você tem ${appointments.length} agendamentos pendentes.`, time: 'Agora' })
    }
    if (transactions.length > 0 && transactions[0].type === 'receita') {
        notifs.push({ message: `Nova receita: R$ ${transactions[0].amount}`, time: 'Recente' })
    }
    return notifs
  }, [appointments, transactions])


  // --- GERADOR DE PDF ---
  const handleGeneratePDF = () => {
    try {
        const doc = new jsPDF()
        doc.setFillColor(109, 40, 217); doc.rect(0, 0, 210, 20, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.text('CÉREBRO.AI - Extrato Oficial', 14, 13)
        
        doc.setTextColor(0, 0, 0); doc.setFontSize(10);
        doc.text(`Cliente: ${userProfile?.full_name || session.user.email}`, 14, 30)
        doc.text(`Data: ${new Date().toLocaleDateString()}`, 14, 35)

        const tableData = transactions.map(t => [
            new Date(t.date || '').toLocaleDateString(),
            t.description,
            t.type === 'receita' ? `+ R$ ${Number(t.amount).toFixed(2)}` : `- R$ ${Number(t.amount).toFixed(2)}`
        ])

        autoTable(doc, {
            head: [['Data', 'Descrição', 'Valor']],
            body: tableData,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [109, 40, 217] },
        })
        doc.save('extrato_cerebro.pdf')
        toast.success("Download do extrato iniciado!")
    } catch (err) {
        toast.error("Erro ao gerar PDF.")
    }
  }

  // --- PERFIL (CORRIGIDO E BLINDADO) ---
  const handleUpdateProfile = async (data: any) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) return toast.error("Sessão inválida.")

      // SOLUÇÃO DEFINITIVA DO ERRO DE TYPESCRIPT:
      // Criamos uma função async que retorna uma Promise padrão do Javascript.
      const updateProfilePromise = async () => {
          const { data: result, error } = await supabase.from('profiles').upsert({
              id: user.id,
              full_name: data.full_name,
              phone: data.phone,
              avatar_url: data.avatar_url,
              email: user.email,
              updated_at: new Date().toISOString()
          })
          .select()
          .single()

          // Se der erro no banco, lançamos um erro real para o Toast pegar
          if (error) throw new Error(error.message)
          
          return result
      }

      // Agora passamos a EXECUÇÃO da função (que devolve a Promise correta)
      toast.promise(updateProfilePromise(), {
          loading: 'Salvando perfil...',
          success: (res) => {
              if (res) setUserProfile(res)
              return 'Perfil atualizado com sucesso!'
          },
          error: (err) => `Erro ao salvar: ${err.message || 'Desconhecido'}`
      })
  }

  // --- FINANCEIRO ---
  const financialSummary = useMemo(() => {
    const income = transactions.filter(t => t.type === 'receita').reduce((acc, t) => acc + Number(t.amount), 0)
    const expense = transactions.filter(t => t.type.includes('despesa')).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0)
    return { balance: income - expense, income, expense }
  }, [transactions])

  const caixaTotal = useMemo(() => caixaEntries.reduce((acc, e) => acc + Number(e.amount), 0), [caixaEntries])

  const handleAppointmentStatus = async (apptId: string, newStatus: any) => {
    const { data: { user } } = await supabase.auth.getUser(); 
    if(!user) return toast.error("Faça login novamente.");

    const appt = appointments.find(a => a.id === apptId); 
    if (!appt) return;

    setAppointments(prev => prev.filter(a => a.id !== apptId))

    try {
        await supabase.from('appointments').update({ status: newStatus }).eq('id', apptId)

        if (newStatus === 'concluido') {
            const percent = Number((appt as any).caixa_percentage ?? 20)
            const valCaixa = Number(appt.value) * (percent / 100)
            const valWallet = Number(appt.value) - valCaixa
            const today = new Date().toISOString().split('T')[0]

            const { data: cx } = await supabase.from('caixa_entries').insert({ 
                user_id: user.id, amount: valCaixa, source: `Serviço: ${appt.clientName}`, date: today 
            }).select().single()
            
            const { data: tx } = await supabase.from('transactions').insert({ 
                user_id: user.id, description: `Atendimento: ${appt.clientName}`, amount: valWallet, type: 'receita', category: 'Serviços', date: today 
            }).select().single()
            
            if(cx) setCaixaEntries(prev => [cx, ...prev])
            if(tx) setTransactions(prev => [tx, ...prev])
            
            toast.success(`Serviço concluído! R$ ${valWallet} na conta.`)
        } else {
            toast.info("Status do agendamento atualizado.")
        }
    } catch (err) {
        toast.error("Erro ao sincronizar. Verifique a conexão.")
    }
  }
  
  const handleAddAppointment = async (a: any) => {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
      const { data, error } = await supabase.from('appointments').insert({ 
          user_id: user.id, client_name: a.clientName, service: a.service, value: a.value, date: a.date, time: a.time, caixa_percentage: a.caixaPercentage 
      }).select().single()
      
      if(data) {
          setAppointments(prev => [...prev, {...data, clientName: data.client_name, caixaPercentage: data.caixa_percentage}])
          toast.success("Agendamento criado!")
      } else {
          toast.error("Erro ao criar agendamento.")
      }
  }

  const handleAddTransaction = async (t: any) => {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
      const { data, error } = await supabase.from('transactions').insert({ 
          user_id: user.id, description: t.description, amount: t.amount, type: t.type, category: t.category, date: t.date 
      }).select().single()
      
      if(data) {
          setTransactions(prev => [data, ...prev])
          toast.success("Transação registrada!")
      } else {
          toast.error("Erro ao registrar.")
      }
  }

  const handleAddGoal = async (g: any) => {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
      const { data, error } = await supabase.from('goals').insert({ 
          user_id: user.id, title: g.title, target_amount: g.target_amount 
      }).select().single()
      
      if(data) {
          setGoals(prev => [...prev, data])
          toast.success("Nova meta criada!")
      }
  }

  const handleUpdateGoal = async (g: any) => {
      const { error } = await supabase.from('goals').update({ current_amount: g.current_amount }).eq('id', g.id)
      if (!error) {
          setGoals(prev => prev.map(item => item.id === g.id ? g : item))
          toast.success("Progresso da meta atualizado!")
      } else {
          toast.error("Erro ao atualizar meta.")
      }
  }

  const handleAddCard = async (card: any) => {
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    const { data, error } = await supabase.from('credit_cards').insert({
        user_id: user.id, card_alias: card.alias, last_four_digits: card.lastFour, limit_amount: card.limit, due_day: card.dueDay
    }).select().single()
    
    if (data) {
        setCards(prev => [...prev, data])
        toast.success("Cartão adicionado à carteira!")
    } else {
        toast.error("Erro ao adicionar cartão.")
    }
  }

  const handleDeleteCard = async (id: string) => {
      await supabase.from('credit_cards').delete().eq('id', id)
      setCards(prev => prev.filter(c => c.id !== id))
      toast.success("Cartão removido.")
  }

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = '/login' }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-violet-500 selection:text-white">
      <Navigation activeTab={activeTab} onSelectTab={setActiveTab} onLogout={handleLogout} isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <main className="flex-1 flex flex-col md:pl-[260px] transition-all duration-300">
        <TopBar 
            title={activeTab} user={session?.user} profile={userProfile} 
            notifications={dynamicNotifications}
            onToggleMenu={() => setIsMenuOpen(!isMenuOpen)} onNavigate={setActiveTab} onLogout={handleLogout} onGeneratePDF={handleGeneratePDF} 
        />
        <div className="flex-1 overflow-x-hidden bg-[url('/bg-grid.svg')] bg-fixed">
           {loading ? <div className="flex h-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-violet-600" /></div> : (
               <ViewContainer
                  activeTab={activeTab} handleRedirect={setActiveTab} user={userProfile || session?.user}
                  summary={{ currentBalance: financialSummary.balance, monthlyIncome: financialSummary.income, monthlyExpense: financialSummary.expense, setBalance: ()=>{}, setIncome: ()=>{}, setExpense: ()=>{}, setEmergency: ()=>{}, emergencyTotal: caixaTotal }}
                  charts={{ monthlyBalanceHistory: [] }} cards={cards} goals={goals} 
                  emergencyFund={{ id: '1', current_amount: caixaTotal, goal_amount: 50000 }} 
                  
                  // DADOS DE MERCADO
                  cdiRate={marketRates.cdi}
                  marketRates={marketRates}

                  transactions={transactions} appointments={appointments} caixaData={{ currentBalance: caixaTotal, monthlyGoal: 5000, entries: caixaEntries }}
                  onUpdateEmergencyFund={async () => {}} onAddGoal={handleAddGoal} onUpdateGoal={handleUpdateGoal}
                  onAddCard={handleAddCard} onDeleteCard={handleDeleteCard} onUpdateProfile={handleUpdateProfile}
                  onAddTransaction={handleAddTransaction} setAppointments={setAppointments} onUpdateAppointmentStatus={handleAppointmentStatus} onAddAppointment={handleAddAppointment}
               />
           )}
        </div>
      </main>
    </div>
  )
}