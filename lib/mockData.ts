import { CreditCard, Goal, Transaction } from '@/types_db'

export const MOCK_USER = {
  id: 'user-123',
  name: 'Pedro Brasil',
  email: 'pedro@cerebro.ai',
  avatar: 'https://github.com/shadcn.png'
}

export const MOCK_NOTIFICATIONS = [
  { id: 1, text: 'Fatura do Nubank fecha amanhã', read: false },
  { id: 2, text: 'Meta "Londres" atingiu 38%', read: true },
  { id: 3, text: 'Recebimento de R$ 3.500 confirmado', read: true },
]

export const MOCK_CARDS: CreditCard[] = [
  {
    id: 'card-1',
    user_id: MOCK_USER.id,
    name: 'Nubank',
    type: 'credito',
    limitOrBalance: 12500, // Novo campo obrigatório
    limit: 12500,          // Mantido para compatibilidade
    color: '#820ad1',
    due_day: 10
  },
  {
    id: 'card-2',
    user_id: MOCK_USER.id,
    name: 'Inter',
    type: 'debito',
    limitOrBalance: 850.20,
    color: '#ff7a00',
    due_day: 5
  },
  {
    id: 'card-3',
    user_id: MOCK_USER.id,
    name: 'XP Visa Infinite',
    type: 'credito',
    limitOrBalance: 45000,
    limit: 45000,
    color: '#000000',
    due_day: 15
  }
]

export const MOCK_GOALS: Goal[] = [
  {
    id: 'goal-1',
    user_id: MOCK_USER.id,
    title: 'Viagem para Londres',
    target_amount: 20000,
    current_amount: 7500,
    created_at: '2023-01-15'
  },
  {
    id: 'goal-2',
    user_id: MOCK_USER.id,
    title: 'Carro Novo',
    target_amount: 50000,
    current_amount: 15000,
    created_at: '2023-03-10'
  },
  {
    id: 'goal-3',
    user_id: MOCK_USER.id,
    title: 'MacBook Pro',
    target_amount: 12000,
    current_amount: 12000, // Concluída
    created_at: '2023-06-01'
  }
]