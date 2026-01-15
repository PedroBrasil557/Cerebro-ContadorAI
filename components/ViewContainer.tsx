'use client'

import React from 'react'
import { ActiveTab } from '@/types'
import { EmergencyFund, Goal, CreditCard } from '@/types_db'

// Importação das Views
import DashboardView from './views/DashboardView'
import InvestmentsView from './views/InvestmentsView'
import EmergencyFundView from './views/EmergencyFundView'
import WalletView from './views/WalletView'
import AgendaView from './views/AgendaView'
// Se tiver TransactionsView, importe aqui também. Caso contrário, use uma div placeholder.
const TransactionsView = () => <div className="p-10 text-white">Transações (Em breve)</div>

interface ViewContainerProps {
  activeTab: ActiveTab
  summary: any
  charts: any
  cards: CreditCard[]
  goals: Goal[]
  emergencyFund: EmergencyFund | null
  cdiRate: number
  
  // Handlers
  handleRedirect: (tab: ActiveTab) => void
  onUpdateEmergencyFund: (amount: number) => Promise<void>
  onAddGoal: (goal: any) => Promise<void>
  onUpdateGoal?: (goal: any) => void // Adicionado opcional para evitar erro se não passado
  onAddCard?: (card: any) => void
  onDeleteCard?: (id: string) => void
}

export default function ViewContainer(props: ViewContainerProps) {
  const { activeTab } = props

  // Renderização baseada na Aba Ativa
  return (
    <div className="h-full w-full animate-in fade-in duration-300">
      
      {activeTab === 'dashboard' && (
        <DashboardView
          summary={props.summary}
          charts={props.charts}
          cards={props.cards}
          goals={props.goals}
          healthScore={850} // Valor calculado ou fixo
          cdiRate={props.cdiRate}
          handleRedirect={props.handleRedirect}
          handleUpdateEmergencyFund={props.onUpdateEmergencyFund}
          onUpdateGoal={props.onUpdateGoal}
          onOpenTransactionModal={() => {}}
        />
      )}

      {activeTab === 'transacoes' && (
        <TransactionsView />
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

      {/* CORREÇÃO DO ERRO: Mudado de 'emergencia' para 'reserva' */}
      {activeTab === 'reserva' && (
        <EmergencyFundView
          fund={props.emergencyFund}
          onUpdateFund={props.onUpdateEmergencyFund}
        />
      )}

      {/* Novas Abas Adicionadas para evitar erros de falta de tratamento */}
      {activeTab === 'carteira' && (
        <WalletView 
          cards={props.cards} 
          onAddCard={props.onAddCard || (() => {})} 
          onDeleteCard={props.onDeleteCard || (() => {})} 
        />
      )}

      {activeTab === 'agenda' && (
        <AgendaView />
      )}

      {activeTab === 'calendario' && (
        <AgendaView /> // Redireciona calendario antigo para Agenda
      )}
    </div>
  )
}