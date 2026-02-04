// 1. Definição dos Tipos de Transação
export type TransactionType = 'receita' | 'despesa_fixa' | 'despesa_variavel' | 'transferencia';

// 2. Interface para Criar Nova Transação (Front-end)
export interface NewTransaction {
  description: string
  amount: number
  type: TransactionType
  category: string
  date: string
  payment_method?: string
}

// 3. Perfil do Usuário
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

// 4. Agendamento (CORRIGIDO)
export interface ClientAppointment {
  id: string
  user_id: string
  client_name: string
  client_email?: string
  service: string
  date: string // Formato ISO 8601
  time?: string // Caso venha separado
  value: number
  status: 'agendado' | 'concluido' | 'cancelado' | 'faltou' | 'pendente' | 'remarcar'
  
  // --- CAMPO NOVO ADICIONADO PARA CORRIGIR O ERRO ---
  caixa_percentage?: number 
  // --------------------------------------------------
  
  created_at?: string
  invite_sent?: boolean
}

// 5. Transação (Banco de Dados)
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
  source?: string // Ex: 'Agenda', 'Manual', 'Sistema'
  location?: string
  created_at?: string
}

// 6. Metas
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
  target_amount: number | string // Aceita string temporariamente do input
  deadline?: string
  color?: string
  icon?: string
  color_start?: string
  color_end?: string
}

// 7. Fundo de Emergência
export interface EmergencyFund {
  current_amount: number
  monthly_expenses: number
  months_covered: number
  target_months: number 
  status: 'safe' | 'warning' | 'danger'
}

// 8. Dados do Caixa Empresarial
export interface CaixaData {
  currentBalance: number
  monthlyGoal: number
  taxRate: number
  entries: Transaction[]
}

// 9. Cartão de Crédito
export interface CreditCard {
  id: string
  user_id: string
  name: string
  limit: number
  current_invoice: number
  due_date: string // Dia do vencimento
  closing_day?: number // Dia do fechamento
  color_start: string
  color_end: string
  brand: 'mastercard' | 'visa' | 'amex' | 'elo' | 'hipercard'
  used?: number 
}

// 10. Tipo Auxiliar para Navegação (Abas do Dashboard)
export type ActiveTab = 
  | 'dashboard' 
  | 'agenda' 
  | 'transacoes' 
  | 'investimentos' 
  | 'carteira' 
  | 'caixa' 
  | 'meu perfil'