// ============================================================================
// TIPOS GLOBAIS DO SISTEMA FINANCEIRO (Sincronizado com Supabase)
// ============================================================================

// 1. Definição dos Tipos de Transação
export type TransactionType = 'receita' | 'despesa_fixa' | 'despesa_variavel' | 'transferencia';

// 2. Transação (Banco de Dados + UI)
export interface Transaction {
  id: string
  user_id: string
  description: string
  amount: number
  type: TransactionType 
  category: string
  payment_method?: string
  date: string        // ISO String vinda do banco
  status?: string     // 'concluido', 'pendente'
  source?: string     // 'Agenda', 'Manual', 'Sistema'
  location?: string
  created_at?: string
}

// Interface simplificada para criar nova transação (Forms)
export interface NewTransaction {
  description: string
  amount: number
  type: TransactionType
  category: string
  date: string
  payment_method?: string
}

// 3. Notificações (CRÍTICO: Adicionado para remover MockData)
export interface NotificationItem {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'alert'
  read: boolean
  created_at: string
}

// 4. Perfil do Usuário
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

// 5. Agendamento (Agenda)
export interface ClientAppointment {
  id: string
  user_id: string
  client_name: string
  client_email?: string
  service: string
  date: string        // ISO String (YYYY-MM-DD)
  time?: string       // HH:mm:ss
  value: number
  status: 'agendado' | 'concluido' | 'cancelado' | 'faltou' | 'pendente' | 'remarcar'
  
  // Campo para cálculo de comissão/caixa
  caixa_percentage?: number 
  
  created_at?: string
  invite_sent?: boolean
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

// 7. Cartão de Crédito (Sincronizado com SQL)
export interface CreditCard {
  id: string
  user_id: string
  name: string
  brand: string // 'mastercard', 'visa', 'amex', etc.
  
  // Campos alinhados com o SQL (limit_amount em vez de limit)
  limit_amount: number 
  current_invoice: number
  
  due_day: number      // Dia do vencimento (integer)
  closing_day: number  // Dia do fechamento (integer)
  
  color_start?: string
  color_end?: string
  
  // Campo calculado no frontend (opcional)
  used?: number 
}

// 8. Dados Agregados (Dashboard Helpers)
export interface EmergencyFund {
  current_amount: number
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

// 9. Tipo Auxiliar para Navegação
export type ActiveTab = 
  | 'dashboard' 
  | 'agenda' 
  | 'transacoes' 
  | 'investimentos' 
  | 'carteira' 
  | 'caixa' 
  | 'meu perfil'