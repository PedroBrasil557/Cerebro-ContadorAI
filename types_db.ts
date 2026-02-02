// types_db.ts

// 1. Exportando o Tipo para ser usado no Modal e na Interface
export type TransactionType = 'receita' | 'despesa_fixa' | 'despesa_variavel' | 'transferencia';

// 2. Interface para Nova Transação
export interface NewTransaction {
  description: string
  amount: number
  type: TransactionType
  category: string
  date: string
  payment_method?: string
}

export interface UserProfile {
  id: string
  full_name?: string
  avatar_url?: string
  email?: string
  plan?: 'free' | 'pro' | 'enterprise'
  phone?: string
  location?: string
  bio?: string
  created_at?: string
}

export interface ClientAppointment {
  id: string
  user_id: string
  client_name: string
  client_email?: string
  service: string
  date: string
  value: number
  status: 'agendado' | 'concluido' | 'cancelado' | 'faltou' | 'pendente' | 'remarcar'
}

export interface Transaction {
  id: string
  user_id: string
  description: string
  amount: number
  type: TransactionType 
  category: string
  payment_method?: string
  date: string
  status?: string
  source?: string
  location?: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  target_amount: number
  current_amount: number
  deadline?: string
  color?: string
  color_start?: string
  color_end?: string
  icon?: string
  created_at?: string
}

export interface NewGoal {
  title: string
  target_amount: number
  deadline?: string
  color?: string
  icon?: string
  color_start?: string
  color_end?: string
}

// --- CORREÇÃO AQUI: Renomeado de total_saved para current_amount ---
export interface EmergencyFund {
  current_amount: number // Agora bate com o que o componente espera
  monthly_expenses: number
  months_covered: number
  target_months: number 
  status: 'safe' | 'warning' | 'danger'
}

export interface CaixaData {
  currentBalance: number
  monthlyGoal: number
  taxRate: number
  entries: Transaction[]
}

export interface CreditCard {
  id: string
  user_id: string
  name: string
  limit: number
  current_invoice: number
  due_date: string
  color_start: string
  color_end: string
  brand: string
  used?: number 
}