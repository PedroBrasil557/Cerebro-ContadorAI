// types_db.ts
// (Idealmente, gere este arquivo com: npx supabase gen types typescript --project-id <your-project-id> > types_db.ts)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      credit_cards: {
        Row: {
          closing_day: number
          created_at: string
          due_day: number
          id: string
          limit: number
          name: string
          user_id: string
        }
        Insert: {
          closing_day: number
          created_at?: string
          due_day: number
          id?: string
          limit: number
          name: string
          user_id?: string
        }
        Update: {
          closing_day?: number
          created_at?: string
          due_day?: number
          id?: string
          limit?: number
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      emergency_fund: {
        Row: {
          created_at: string
          current_amount: number
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_amount?: number
          id?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_fund_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      goals: {
        Row: {
          created_at: string
          current_amount: number
          id: string
          target_amount: number
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_amount?: number
          id?: string
          target_amount: number
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          id?: string
          target_amount?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          credit_card_id: string | null
          date: string
          description: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          credit_card_id?: string | null
          date: string
          description: string
          id?: string
          type: string
          user_id?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          credit_card_id?: string | null
          date?: string
          description?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_credit_card_id_fkey"
            columns: ["credit_card_id"]
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Exportações de tipos para facilitar
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']
export type CreditCard = Database['public']['Tables']['credit_cards']['Row']
export type EmergencyFund = Database['public']['Tables']['emergency_fund']['Row']

export type NewTransaction = Database['public']['Tables']['transactions']['Insert']
export type NewGoal = Database['public']['Tables']['goals']['Insert']