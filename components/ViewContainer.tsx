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

import DashboardView from './views/DashboardView'
import InvestmentsView from './views/InvestmentsView'
import WalletView from './views/WalletView'
import AgendaView from './views/AgendaView'
import CaixaView from './views/CaixaView'
import TransactionsView from './views/TransactionsView'
import EmergencyFundView from './views/EmergencyFundView'
import ProfileView from './views/ProfileView'

/* ───────────────────────────────
   PROPS CONTRATO (100% COMPATÍVEL)
──────────────────────────────── */
interface ViewContainerProps {
  activeTab: ActiveTab
  handleRedirect: (tab: ActiveTab) => void

  user?: any

  summary: {
    currentBalance: number
    monthlyIncome: number
    monthlyExpense: number
    emergencyTotal: number
  }

  charts: any

  cards: CreditCard[]
  goals: Goal[]

  emergencyFund: EmergencyFund | null

  cdiRate: number

  marketRates?: {
    usd: number
    btc: number
    cdi: number
  }

  transactions: Transaction[]
  appointments: ClientAppointment[]

  caixaData: CaixaData

  onUpdateEmergencyFund: (amount: number) => Promise<void>
  onAddGoal: (goal: NewGoal) => Promise<void>
  onUpdateGoal?: (goal: any) => void

  onAddCard: (card: any) => void
  onDeleteCard: (id: string) => void

  onUpdateProfile?: (data: any) => void
  onAddTransaction: (t: Transaction) => void

  setAppointments: React.Dispatch<
    React.SetStateAction<ClientAppointment[]>
  >

  onUpdateAppointmentStatus: (
    id: string,
    status: 'concluido' | 'faltou' | 'remarcar'
  ) => void

  onAddAppointment: (appt: any) => void
}

/* ───────────────────────────────
   COMPONENTE
──────────────────────────────── */
export default function ViewContainer(props: ViewContainerProps) {
  const { activeTab } = props

  return (
    <div className="h-full w-full animate-in fade-in duration-300">

      {/* DASHBOARD */}
      {activeTab === 'dashboard' && (
        <DashboardView
          summary={props.summary}
          charts={props.charts}
          cards={props.cards}
          goals={props.goals}
          healthScore={850}
          cdiRate={props.cdiRate}
          transactions={props.transactions}
          handleRedirect={props.handleRedirect}
          onUpdateGoal={props.onUpdateGoal}
        />
      )}

      {/* TRANSAÇÕES */}
      {activeTab === 'transacoes' && (
        <TransactionsView
          transactions={props.transactions}
          onAddTransaction={props.onAddTransaction}
        />
      )}

      {/* INVESTIMENTOS */}
      {activeTab === 'investimentos' && (
        <InvestmentsView
          goals={props.goals}
          cdiRate={props.cdiRate}
          marketRates={props.marketRates}
          emergencyFund={props.emergencyFund}
          onAddGoal={props.onAddGoal}
          handleRedirect={props.handleRedirect}
        />
      )}

      {/* CARTEIRA */}
      {activeTab === 'carteira' && (
        <WalletView
          cards={props.cards}
          onAddCard={props.onAddCard}
          onDeleteCard={props.onDeleteCard}
        />
      )}

      {/* AGENDA */}
      {(activeTab === 'agenda' || activeTab === 'calendario') && (
        <AgendaView
          appointments={props.appointments}
          setAppointments={props.setAppointments}
          onUpdateStatus={props.onUpdateAppointmentStatus}
          onAddAppointment={props.onAddAppointment}
        />
      )}

      {/* CAIXA */}
      {activeTab === 'caixa' && (
        <CaixaView data={props.caixaData} />
      )}

      {/* PERFIL */}
      {activeTab === 'perfil' && (
        <ProfileView
          user={props.user}
          onUpdateProfile={props.onUpdateProfile}
        />
      )}

      {/* RESERVA */}
      {activeTab === 'reserva' && (
        props.emergencyFund ? (
          <EmergencyFundView
            fund={props.emergencyFund}
            onUpdateFund={props.onUpdateEmergencyFund}
          />
        ) : (
          <div className="p-8 text-white">
            Carregando Reserva...
          </div>
        )
      )}

    </div>
  )
}
