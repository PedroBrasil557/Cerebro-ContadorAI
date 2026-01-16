export type TransactionType = 'receita' | 'despesa_fixa' | 'despesa_variavel';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  location?: string;
}

export interface ClientAppointment {
  id: string;
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
  name: string;
  type: 'credito' | 'debito';
  limitOrBalance: number;
  color?: string;
  limit?: number; // Compatibilidade
}

export interface CaixaData {
  currentBalance: number;
  monthlyGoal: number;
  entries: { date: string; amount: number; source: string }[];
}

export interface Goal {
  id: string;
  user_id?: string;
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
  current_amount: number;
  goal_amount: number;
}