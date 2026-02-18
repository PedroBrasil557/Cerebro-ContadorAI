// ============================================================================
// TIPOS GLOBAIS DO SISTEMA FINANCEIRO (Sincronizado com Supabase)
// ============================================================================

// 1. Definição dos Tipos de Transação
export type TransactionType = 'receita' | 'despesa_fixa' | 'despesa_variavel' | 'transferencia';

// 2. Transação (Dados vindos do Banco)
export interface Transaction {
  id: string
  user_id: string
  description: string
  amount: number
  type: TransactionType 
  category: string
  payment_method?: string
  card_id?: string
  date: string        // ISO String vinda do banco
  status?: string     // 'concluido', 'pendente'
  source?: string     // 'Agenda', 'Manual', 'Sistema'
  
  // CAMPOS NATIVOS
  is_paid: boolean    
  is_fixed: boolean
  due_date?: string
  edit_note?: string
  
  location?: string
  created_at?: string
  updated_at?: string
}

// Interface para formulários de criação (NewTransaction)
export interface NewTransaction {
  description: string
  amount: number
  type: TransactionType
  category: string
  date: string
  payment_method?: string
  card_id?: string
  is_paid: boolean
  is_fixed: boolean
}

// 3. Cartão de Crédito
export interface CreditCard {
  id: string
  user_id: string
  name: string
  brand: string 
  last_4_digits: string 
  limit_amount: number 
  current_invoice: number
  due_day: number      // Dia do vencimento (integer)
  closing_day: number  // Dia do fechamento (integer)
  color_start?: string
  color_end?: string
  created_at?: string
}

// 4. Notificações
export interface NotificationItem {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'alert'
  read: boolean
  created_at: string
}

// 5. Perfil do Usuário
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
  updated_at?: string
}

// 6. Agendamento (Agenda Smart)
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
  caixa_percentage?: number 
  invite_sent?: boolean
  created_at?: string
}

// 7. Metas (Goals)
export interface Goal {
  id: string
  user_id: string
  title: string
  target_amount: number
  current_amount: number
  deadline?: string
  color?: string
  created_at?: string
}

// Interface auxiliar para formulários
export interface NewGoal {
  title: string
  target_amount: number | string 
  deadline?: string
  color?: string
  icon?: string
}

// 8. Dívidas (Debts)
export interface Debt {
  id: string
  user_id: string
  name: string
  total_amount: number
  remaining_amount: number
  interest_rate: number
  due_day?: number
  category?: string
  priority: 'baixa' | 'media' | 'alta'
  status: 'aberto' | 'negociacao' | 'pago'
  created_at: string
}

// 9. Investimentos
export interface Investment {
  id: string
  user_id: string
  name: string
  ticker?: string 
  type: 'renda_fixa' | 'acoes' | 'fii' | 'cripto' | 'fundos' | 'exterior' | 'reserva' | 'outros'
  
  // Dados Numéricos
  quantity: number        
  average_price: number   
  current_price: number   
  
  // Campos Calculados/Opcionais
  amount_invested?: number 
  current_value?: number   
  yield_rate?: string
  institution?: string
  
  created_at?: string
  updated_at?: string
}

// 10. Histórico Patrimonial
export interface PatrimonyHistory {
  id: string
  user_id: string
  total_balance: number
  record_date: string
  created_at?: string
}

// 11. Dados do Caixa e Configurações
export interface BusinessSettings {
  user_id: string
  current_balance: number
  monthly_goal: number
  tax_rate: number
  reserve_rate: number
  updated_at?: string
}

export interface CaixaData {
  currentBalance: number
  monthlyGoal: number
  taxRate: number
  reserveRate?: number
  entries: Transaction[]
}

// --- CORREÇÃO: ADICIONADA A INTERFACE EMERGENCYFUND ---
export interface EmergencyFund {
  current_amount: number
  monthly_expenses: number
  months_covered: number
  target_months: number 
  status: 'safe' | 'warning' | 'danger'
}

// 12. Navegação
export type ActiveTab = 
  | 'dashboard' 
  | 'agenda' 
  | 'transacoes' 
  | 'investimentos' 
  | 'carteira' 
  | 'caixa' 
  | 'meu perfil'
  | 'central_dividas';