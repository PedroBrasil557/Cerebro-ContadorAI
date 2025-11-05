// lib/constants.ts
'use client'

import React from 'react'; 
import { Home, Repeat, TrendingUp, Calendar, Wallet } from 'lucide-react'

// --- 1. Tipos de Navegação ---

export type NavItem = {
  id: 'dashboard' | 'transacoes' | 'investimentos' | 'calendario' | 'emergencia';
  label: string;
  icon: React.ElementType; 
};

// --- 2. Constantes de Navegação ---

export const navItems: readonly NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'transacoes', label: 'Transações', icon: Repeat },
  { id: 'investimentos', label: 'Investir', icon: TrendingUp },
  { id: 'calendario', label: 'Calendário', icon: Calendar },
  { id: 'emergencia', label: 'Reserva', icon: Wallet },
] as const;

// --- 3. Constantes de Categorias ---

export const CATEGORIES = {
  expense: [
    'Alimentação',
    'Transporte',
    'Moradia',
    'Saúde',
    'Educação',
    'Lazer',
    'Contas',
    'Compras',
    'Outros',
    'Aporte Emergência', // Usado para ligar transações ao Fundo de Emergência
  ],
  income: [
    'Salário',
    'Investimentos',
    'Freelance',
    'Presente',
    'Outros',
  ],
} as const;

// --- 4. Constantes de Cores de Gráficos ---

export const PIE_CHART_COLORS = [
  '#6C63FF', // brand-violet (Principal)
  '#4ECDC4', // Verde Água
  '#FF6B6B', // Vermelho Claro
  '#FFC107', // Amarelo
  '#007BFF', // Azul
  '#82ca9d',
  '#ffc658',
  '#a4de6c',
] as const;

// --- 5. Constantes de Cores de Status (Orçamento) ---

export const STATUS_COLORS = {
  success: '#10B981', // Verde: Gasto < 70% do Orçamento
  warning: '#F59E0B', // Amarelo: Gasto 70-99% do Orçamento
  danger: '#EF4444',  // Vermelho: Gasto > 100% do Orçamento
  neutral: '#D1D5DB', // Cinza
} as const;