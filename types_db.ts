export type TransactionType = 'receita' | 'despesa_fixa' | 'despesa_variavel';

export interface Transaction {
  id: string;
  user_id?: string; // <--- ADICIONADO
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  location?: string;
}

export type NewTransaction = Omit<Transaction, 'id'>;

export interface ClientAppointment {
  id: string;
  user_id?: string; // <--- ADICIONADO
  clientName: string;
  service: string;
  value: number;
  date: string;
  time: string;
  status: 'agendado' | 'concluido' | 'faltou' | 'remarcar';
  caixaPercentage: number;
}

export interface CreditCard {
  id: string;
  user_id?: string; // <--- ADICIONADO (Corrige o erro atual)
  name: string;
  type: 'credito' | 'debito';
  limitOrBalance: number;
  color?: string;
  limit?: number; 
  due_day?: number;
}

export interface CaixaData {
  currentBalance: number;
  monthlyGoal: number;
  entries: { date: string; amount: number; source: string }[];
}

export interface Goal {
  id: string;
  user_id?: string; // <--- ADICIONADO
  title: string;
  target_amount: number;
  current_amount: number;
  created_at?: string;
}

export interface NewGoal {
  title: string;
  target_amount: number;
}

export interface EmergencyFund {
  id: string;
  user_id?: string; // <--- ADICIONADO
  current_amount: number;
  goal_amount: number;
}