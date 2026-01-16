'use client'

import React from 'react'
import { ActiveTab } from '@/types'
import { 
  EmergencyFund, 
  Goal, 
  CreditCard, 
  Transaction, 
  ClientAppointment, 
  CaixaData, 
  NewGoal 
} from '@/types_db'

// Importação das Views
import DashboardView from './views/DashboardView'
import InvestmentsView from './views/InvestmentsView'
import WalletView from './views/WalletView'
import AgendaView from './views/AgendaView'
import CaixaView from './views/CaixaView'
import TransactionsView from './views/TransactionsView'
import EmergencyFundView from './views/EmergencyFundView'
import ProfileView from './views/ProfileView'

interface ViewContainerProps {
  // Navegação e Usuário
  activeTab: ActiveTab
  handleRedirect: (tab: ActiveTab) => void
  user?: any

  // Dados Financeiros Gerais
  summary: any
  charts: any
  cards: CreditCard[]
  goals: Goal[]
  emergencyFund: EmergencyFund | null
  cdiRate: number

  // NOVOS DADOS (Essenciais para o funcionamento do sistema atualizado)
  transactions: Transaction[]     // <--- Agora passado para o Dashboard
  appointments: ClientAppointment[]
  caixaData: CaixaData
  
  // Handlers (Ações)
  onUpdateEmergencyFund: (amount: number) => Promise<void>
  onAddGoal: (goal: NewGoal) => Promise<void>
  onUpdateGoal?: (goal: any) => void 
  onAddCard?: (card: any) => void
  onDeleteCard?: (id: string) => void

  // Handlers Novos
  onAddTransaction: (t: Transaction) => void
  setAppointments: React.Dispatch<React.SetStateAction<ClientAppointment[]>>
  onCompleteAppointment: (id: string) => void
}

export default function ViewContainer(props: ViewContainerProps) {
  const { activeTab } = props

  return (
    <div className="h-full w-full animate-in fade-in duration-300">
      
      {activeTab === 'dashboard' && (
        <DashboardView
          summary={props.summary}
          charts={props.charts}
          cards={props.cards}
          goals={props.goals}
          healthScore={850} 
          cdiRate={props.cdiRate}
          
          // DADOS CONECTADOS AO NOVO ORÇAMENTO INTELIGENTE
          transactions={props.transactions} 
          
          handleRedirect={props.handleRedirect}
          onUpdateGoal={props.onUpdateGoal}
        />
      )}

      {activeTab === 'transacoes' && (
        <TransactionsView 
            transactions={props.transactions} 
            onAddTransaction={props.onAddTransaction} 
        />
      )}

      {activeTab === 'investimentos' && (
        <InvestmentsView
          goals={props.goals}
          cdiRate={props.cdiRate}
          emergencyFund={props.emergencyFund}
          onAddGoal={props.onAddGoal}
          handleRedirect={props.handleRedirect}
        />
      )}

      {activeTab === 'carteira' && (
        <WalletView 
          cards={props.cards} 
          onAddCard={props.onAddCard || (() => {})} 
          onDeleteCard={props.onDeleteCard || (() => {})} 
        />
      )}

      {(activeTab === 'agenda' || activeTab === 'calendario') && (
        <AgendaView 
            appointments={props.appointments}
            setAppointments={props.setAppointments}
            onComplete={props.onCompleteAppointment}
        />
      )}

      {activeTab === 'caixa' && (
        <CaixaView data={props.caixaData} />
      )}

      {activeTab === 'perfil' && (
        <ProfileView user={props.user} />
      )}
      
      {activeTab === 'reserva' && (
         props.emergencyFund ? (
            <EmergencyFundView fund={props.emergencyFund} onUpdateFund={props.onUpdateEmergencyFund} />
         ) : (
            <div className="p-8 text-white">Carregando Reserva...</div>
         )
      )}
    </div>
  )
}