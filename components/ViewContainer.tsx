'use client'
// ... imports (mantenha os mesmos)
import React from 'react'
import { ActiveTab } from '@/types'
import { EmergencyFund, Goal, CreditCard, Transaction, ClientAppointment, CaixaData, NewGoal } from '@/types_db'
import DashboardView from './views/DashboardView'
import InvestmentsView from './views/InvestmentsView'
import WalletView from './views/WalletView'
import AgendaView from './views/AgendaView'
import CaixaView from './views/CaixaView'
import TransactionsView from './views/TransactionsView'
import EmergencyFundView from './views/EmergencyFundView'
import ProfileView from './views/ProfileView'

interface ViewContainerProps {
  // ... (outras props)
  activeTab: ActiveTab
  handleRedirect: (tab: ActiveTab) => void
  user?: any
  summary: any
  charts: any
  cards: CreditCard[]
  goals: Goal[]
  emergencyFund: EmergencyFund | null
  cdiRate: number
  transactions: Transaction[]
  appointments: ClientAppointment[]
  caixaData: CaixaData
  onUpdateEmergencyFund: (amount: number) => Promise<void>
  onAddGoal: (goal: NewGoal) => Promise<void>
  onUpdateGoal?: (goal: any) => void 
  onAddTransaction: (t: Transaction) => void
  setAppointments: React.Dispatch<React.SetStateAction<ClientAppointment[]>>
  onUpdateAppointmentStatus: (id: string, status: 'concluido' | 'faltou' | 'remarcar') => void
  onAddAppointment: (appt: any) => void

  // NOVOS
  onAddCard: (card: any) => void
  onDeleteCard: (id: string) => void
  onUpdateProfile?: (data: any) => void
}

export default function ViewContainer(props: ViewContainerProps) {
  const { activeTab } = props

  return (
    <div className="h-full w-full animate-in fade-in duration-300">
      {activeTab === 'dashboard' && <DashboardView {...props} handleRedirect={props.handleRedirect} onUpdateGoal={props.onUpdateGoal} healthScore={850} />}
      {activeTab === 'transacoes' && <TransactionsView transactions={props.transactions} onAddTransaction={props.onAddTransaction} />}
      {activeTab === 'investimentos' && <InvestmentsView goals={props.goals} cdiRate={props.cdiRate} emergencyFund={props.emergencyFund} onAddGoal={props.onAddGoal} handleRedirect={props.handleRedirect} />}
      
      {/* Carteira Conectada */}
      {activeTab === 'carteira' && <WalletView cards={props.cards} onAddCard={props.onAddCard} onDeleteCard={props.onDeleteCard} />}

      {(activeTab === 'agenda' || activeTab === 'calendario') && <AgendaView appointments={props.appointments} setAppointments={props.setAppointments} onUpdateStatus={props.onUpdateAppointmentStatus} onAddAppointment={props.onAddAppointment} />}
      {activeTab === 'caixa' && <CaixaView data={props.caixaData} />}
      
      {/* Perfil Conectado */}
      {activeTab === 'perfil' && <ProfileView user={props.user} onUpdateProfile={props.onUpdateProfile} />}
      
      {activeTab === 'reserva' && (props.emergencyFund ? <EmergencyFundView fund={props.emergencyFund} onUpdateFund={props.onUpdateEmergencyFund} /> : <div className="p-8 text-white">Carregando...</div>)}
    </div>
  )
}