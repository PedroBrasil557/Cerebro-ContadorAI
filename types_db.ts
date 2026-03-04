// ============================================================================
// types_db.ts - CÉREBRO.OS Global Type Definitions
// ============================================================================

export type SystemRole = 'user' | 'admin' | 'founder'
export type AccountMode = 'personal' | 'professional'
export type PlanTier = 'free' | 'basic' | 'pro' | 'premium' | 'professional_full'
export type TransactionType = 'receita' | 'despesa_fixa' | 'despesa_variavel' | 'transferencia'

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
  created_at: string
}

// --- 2. FINANCEIRO CORE ---
export interface Transaction {
  id: string
  user_id: string
  business_id?: string
  description: string
  amount: number | string
  type: TransactionType
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
  image_url: string
  extracted_total: number
  extracted_date: string
  processing_status: string
  created_at: string
}

// --- 4. AGENDA & EMPRESA (NAIL DESIGN INCLUÍDO) ---
export interface ClientAppointment {
  id: string
  user_id: string
  client_name: string
  client_email?: string
  service: string
  value: number
  date: string
  time?: string
  status: string
  caixa_percentage?: number 
  invite_sent?: boolean
  created_at?: string
}

export interface NailService {
  id: string;
  name: string;
  category: 'Alongamento' | 'Manutenção' | 'Esmaltação' | 'Extras';
  price: number;
  duration: number; // em minutos
}

export interface NailProfessional {
  id: string;
  name: string;
  specialty: string;
  active: boolean;
}

export interface NailAppointment extends ClientAppointment {
  service_id: string;
  professional_id: string;
  payment_method: string;
  payment_status: 'pago' | 'pendente';
  extra_services?: string[];
}

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

// --- 5. SISTEMA & OUTROS ---
export interface NotificationItem {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'alert'
  read: boolean
  created_at: string
}

export interface PatrimonyHistory {
  id: string
  user_id: string
  total_balance: number
  record_date: string
  created_at?: string
}

export interface EmergencyFund {
  current_amount: number
  monthly_expenses: number
  months_covered: number
  target_months: number 
  status: 'safe' | 'warning' | 'danger'
}

export type ActiveTab = 
  | 'dashboard' 
  | 'agenda' 
  | 'transacoes' 
  | 'investimentos' 
  | 'carteira' 
  | 'caixa' 
  | 'meu perfil'
  | 'central_dividas';
  // --- ENGENHARIA DE CUSTOS ---
export interface NailProduct {
  id: string;
  user_id: string;
  name: string; // Ex: Gel Vòlia Classic Blank
  category: 'gel' | 'fibra' | 'prep' | 'esmalte' | 'descartavel';
  purchase_price: number;
  quantity_ml_g: number;
  estimated_yield: number; // Quantas clientes atende (ex: 30)
  cost_per_application: number; // Calculado: purchase_price / estimated_yield
  status: 'estoque_bom' | 'acabando' | 'critico';
}

export interface NailServiceEngineering {
  id: string;
  service_id: string; // Vincula ao serviço (Ex: Alongamento Fio a Fio)
  products_used: Array<{ product_id: string; usage_multiplier: number }>;
  time_cost_per_minute: number; // Baseado no custo fixo do estúdio
  total_material_cost: number;
  suggested_price: number;
  current_price: number;
  profit_margin_pct: number;
}

// --- INTELIGÊNCIA DE NEGÓCIO ---
export interface BusinessHealthSnapshot {
  id: string;
  month: string;
  gross_revenue: number;
  net_profit: number;
  total_material_costs: number;
  average_ticket: number;
  safe_pro_labore: number; // O que ela pode sacar sem quebrar a empresa
  stability_index: number; // 0-100 (A Jóia da Coroa)
  ai_diagnostic_summary: string;
}