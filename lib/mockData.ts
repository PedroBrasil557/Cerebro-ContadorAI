import { CreditCard, UserProfile, Transaction, Goal, ClientAppointment } from '@/types_db'

export const MOCK_USER: UserProfile = {
  id: 'mock-user-1',
  full_name: 'Pedro Brasil',
  email: 'pedro@exemplo.com',
  avatar_url: 'https://github.com/shadcn.png',
  plan: 'pro',
  location: 'São Paulo, SP',
  bio: 'Empreendedor e Investidor.',
  created_at: new Date().toISOString()
}

export const MOCK_CARDS: CreditCard[] = [
  {
    id: 'card-1',
    user_id: MOCK_USER.id,
    name: 'Nubank Ultravioleta',
    limit: 50000,
    current_invoice: 3450.90,
    due_date: '2026-02-10',
    color_start: '#820ad1',
    color_end: '#400080',
    brand: 'Mastercard',
    used: 15
  },
  {
    id: 'card-2',
    user_id: MOCK_USER.id,
    name: 'XP Visa Infinite',
    limit: 80000,
    current_invoice: 1200.00,
    due_date: '2026-02-15',
    color_start: '#111111',
    color_end: '#333333',
    brand: 'Visa',
    used: 5
  }
]

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    user_id: MOCK_USER.id,
    description: 'Recebimento de Cliente',
    amount: 15000,
    type: 'receita',
    category: 'Serviços',
    date: new Date().toISOString(),
    status: 'concluido'
  },
  {
    id: 't2',
    user_id: MOCK_USER.id,
    description: 'Servidor AWS',
    amount: -850,
    type: 'despesa_fixa',
    category: 'Software',
    date: new Date().toISOString(),
    status: 'concluido'
  }
]

export const MOCK_GOALS: Goal[] = [
  {
    id: 'g1',
    user_id: MOCK_USER.id,
    title: 'Reserva de Emergência',
    target_amount: 100000,
    current_amount: 35000,
    deadline: '2026-12-31',
    color: '#10b981',
    color_start: '#10b981',
    color_end: '#059669',
    icon: 'Shield',
    created_at: new Date().toISOString()
  }
]

export const MOCK_APPOINTMENTS: ClientAppointment[] = [
  {
    id: 'a1',
    user_id: MOCK_USER.id,
    client_name: 'Empresa X',
    service: 'Consultoria Financeira',
    date: new Date().toISOString(),
    value: 5000,
    status: 'agendado'
  }
]

// --- ADICIONADO PARA CORRIGIR O ERRO ---
export const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Meta Atingida! 🎯',
    message: 'Você atingiu 35% da sua meta de Reserva de Emergência.',
    time: '2h atrás',
    read: false,
  },
  {
    id: '2',
    title: 'Fatura Fechada',
    message: 'A fatura do Nubank vence em 5 dias.',
    time: '5h atrás',
    read: true,
  },
  {
    id: '3',
    title: 'Novo Agendamento',
    message: 'Reunião com Empresa X confirmada.',
    time: '1d atrás',
    read: true,
  }
]