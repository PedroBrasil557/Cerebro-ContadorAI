// lib/mockData.ts
// Dados falsos para desenvolver o frontend sem o Supabase

import { Transaction, Goal, CreditCard, EmergencyFund } from "@/types_db"
import { formatISO } from "date-fns"

export const MOCK_USER = {
  id: "mock-user-123",
  email: "dev@user.com",
}

export const MOCK_CARDS: CreditCard[] = [
  {
    id: "card-1",
    user_id: MOCK_USER.id,
    name: "Cartão Violeta",
    limit: 10000,
    due_day: 10,
    closing_day: 3,
    created_at: formatISO(new Date()),
  },
  {
    id: "card-2",
    user_id: MOCK_USER.id,
    name: "Cartão Azul",
    limit: 5000,
    due_day: 15,
    closing_day: 8,
    created_at: formatISO(new Date()),
  },
]

// Usamos o ano atual para que os dados não pareçam muito antigos
const CURRENT_YEAR = new Date().getFullYear()

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    user_id: MOCK_USER.id,
    type: "expense",
    description: "Almoço no Shopping",
    amount: -50.75, // Despesas são negativas
    date: formatISO(new Date(CURRENT_YEAR, new Date().getMonth(), 3)),
    category: "Alimentação",
    credit_card_id: MOCK_CARDS[0].id,
    created_at: formatISO(new Date()),
  },
  {
    id: "tx-2",
    user_id: MOCK_USER.id,
    type: "income",
    description: "Salário",
    amount: 5215.75, // Receitas são positivas
    date: formatISO(new Date(CURRENT_YEAR, new Date().getMonth(), 1)),
    category: "Salário",
    credit_card_id: null,
    created_at: formatISO(new Date()),
  },
  {
    id: "tx-3",
    user_id: MOCK_USER.id,
    type: "expense",
    description: "Gasolina",
    amount: -150.0,
    date: formatISO(new Date(CURRENT_YEAR, new Date().getMonth(), 2)),
    category: "Transporte",
    credit_card_id: null,
    created_at: formatISO(new Date()),
  },
  {
    id: "tx-5",
    user_id: MOCK_USER.id,
    type: "expense",
    description: "Cinema",
    amount: -60.0,
    date: formatISO(new Date(CURRENT_YEAR, new Date().getMonth() - 1, 28)), // Mês passado
    category: "Lazer",
    credit_card_id: MOCK_CARDS[1].id,
    created_at: formatISO(new Date()),
  },
]

export const MOCK_GOALS: Goal[] = [
  {
    id: "goal-1",
    user_id: MOCK_USER.id,
    title: "Viagem para Londres",
    target_amount: 20000,
    current_amount: 7500,
    created_at: formatISO(new Date()),
  },
  {
    id: "goal-2",
    user_id: MOCK_USER.id,
    title: "Carro Novo",
    target_amount: 50000,
    current_amount: 15000,
    created_at: formatISO(new Date()),
  },
]

// A CORREÇÃO ESTÁ AQUI: Adicionamos o 'target_amount' e o tipo
export const MOCK_EMERGENCY_FUND: EmergencyFund & { target_amount: number } = {
  id: "fund-1",
  user_id: MOCK_USER.id,
  current_amount: 12000,
  created_at: formatISO(new Date()),
  target_amount: 16000, // <-- A META DA RESERVA (ex: R$ 16.000)
}
import { Notification } from "@/types_db";

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Fatura Próxima', message: 'Cartão Violeta vence amanhã', time: '2h atrás', read: false, type: 'alert' },
  { id: '2', title: 'Meta Atingida', message: 'Você atingiu 50% da meta Carro Novo', time: '1d atrás', read: true, type: 'success' },
  { id: '3', title: 'Rendimento', message: 'Seu CDI rendeu R$ 45,00 hoje', time: '3d atrás', read: true, type: 'info' },
];

export const MOCK_CDI_RATE = 0.1165 // 11.65% a.a.

// NOVOS DADOS: MOCK DATA para o Mercado Global
export const MOCK_MARKET_DATA = [
  { name: 'S&P 500', value: 5085.3, change: 0.85, direction: 'up' },
  { name: 'NASDAQ', value: 16750.1, change: -1.23, direction: 'down' },
  { name: 'IBOVESPA', value: 128540.0, change: 0.15, direction: 'up' },
  { name: 'Tesla (TSLA)', value: 178.90, change: -2.10, direction: 'down' },
  { name: 'Apple (AAPL)', value: 195.45, change: 1.50, direction: 'up' },
];