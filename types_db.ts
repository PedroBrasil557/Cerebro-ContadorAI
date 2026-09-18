// ============================================================================
// types_db.ts - CÉREBRO.OS Global Type Definitions
// ============================================================================

export type SystemRole = 'user' | 'admin' | 'founder'
export type WorkspaceRole = 'owner' | 'admin' | 'member'
export type AccountMode = 'personal' | 'professional'
export type ProductCode = 'personal' | 'professional'
export type PlanTier = 'free' | 'basic' | 'pro' | 'premium' | 'professional_full'
export type TransactionType = 'receita' | 'despesa_fixa' | 'despesa_variavel' | 'transferencia'
export type TransactionScope = 'personal' | 'business'

// --- 1. PERFIL E CONFIGURAÇÕES ---
export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  system_role: SystemRole
  account_mode: AccountMode
  plan_tier: PlanTier
  base_currency: string
  timezone: string
  phone?: string
  location?: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface Business {
  id: string
  owner_id: string
  name: string
  tax_regime: string
  default_tax_rate: number
  default_tax_rate_confirmed_at?: string | null
  created_at: string
}

// --- 2. FINANCEIRO CORE ---
export interface Transaction {
  id: string
  user_id: string
  business_id?: string
  workspace_id?: string | null
  description: string
  amount: number | string
  type: TransactionType
  scope: TransactionScope
  category: string
  payment_method?: string
  card_id?: string
  date: string
  status: string
  is_fixed: boolean
  is_paid: boolean
  due_date?: string
  edit_note?: string
  source?: string
  created_at?: string
  updated_at?: string
}

export type NewTransaction = Omit<Transaction, 'id' | 'created_at' | 'updated_at'>

export interface CreditCard {
  id: string
  user_id: string
  name: string
  brand: string
  last_digits: string
  last_4_digits?: string
  limit_amount: number | string
  current_invoice?: number | string
  due_day: number
  closing_day: number
  color_start?: string
  color_end?: string
  created_at?: string
}

export interface Debt {
  id: string
  user_id: string
  name: string
  total_amount: number
  remaining_amount: number
  interest_rate: number
  due_day: number
  category?: string
  priority: 'baixa' | 'media' | 'alta' | 'urgente'
  status: string
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  target_amount: number
  current_amount: number
  deadline: string
  color?: string
  icon?: string
  created_at?: string
}

export type NewGoal = Pick<Goal, 'title' | 'target_amount' | 'deadline' | 'color' | 'icon'>

export interface Investment {
  id: string
  user_id: string
  name: string
  ticker: string
  type: string
  quantity: number
  average_price: number
  current_price: number
  amount_invested: number
  current_value?: number
  institution?: string
  created_at?: string
  updated_at?: string
}

// --- 3. SMART SHOPPING & OCR ---
export interface MonthlyShoppingSession {
  id: string
  user_id: string
  month: string
  estimated_total: number
  actual_total: number
  status: string
  currency_code?: string
}

export interface ShoppingItem {
  id: string
  session_id: string
  name: string
  category: string
  estimated_price: number
  actual_price: number | null
  quantity: number
  is_essential: boolean
  is_purchased: boolean
  price_variation_pct: number
}

export interface ShoppingReceipt {
  id: string
  session_id: string
  image_url?: string | null
  storage_path?: string | null
  extracted_total: number
  extracted_date: string
  processing_status: string
  created_at: string
}

// --- 4. AGENDA & EMPRESA (NAIL DESIGN INCLUÍDO) ---
export interface ClientAppointment {
  id: string
  user_id: string
  workspace_id?: string | null
  client_name: string
  client_email?: string
  service: string
  value: number
  date: string
  time?: string
  status: string
  caixa_percentage?: number 
  invite_sent?: boolean
  invite_status?: 'pending' | 'sent' | 'failed'
  invite_error?: string | null
  invite_sent_at?: string | null
  idempotency_key?: string | null
  created_at?: string
}

export type ActiveTab =
  | 'dashboard'
  | 'compras inteligentes'
  | 'transações'
  | 'orçamento'
  | 'metas'
  | 'cérebro'
  | 'investimentos'
  | 'minha carteira'
  | 'central de dividas'
  | 'visão do negócio'
  | 'caixa empresarial'
  | 'agenda smart'
  | 'meu perfil'
  | 'admin'

export interface NotificationItem {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'alert'
  read: boolean
  created_at: string
}
