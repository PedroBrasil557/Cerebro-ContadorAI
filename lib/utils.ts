import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina classes do Tailwind de forma inteligente (Shadcn UI Standard)
 * Resolve conflitos como 'bg-red-500' sobrescrevendo 'bg-blue-500'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata números para o padrão de moeda Real Brasileiro (BRL)
 * Ex: 1500.5 -> "R$ 1.500,50"
 */
export function formatCurrency(value: number | string | undefined | null): string {
  const amount = Number(value) || 0
  
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formata datas para o padrão brasileiro
 * Ex: "2026-01-20" -> "20/01/2026"
 */
export function formatDate(dateString: string | Date): string {
  if (!dateString) return ""
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("pt-BR").format(date)
}

/**
 * Formata data e hora para o padrão brasileiro
 * Ex: "20/01/2026 às 14:30"
 */
export function formatDateTime(dateString: string | Date): string {
  if (!dateString) return ""
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

/**
 * Utilitário para simular delay em requisições (útil para testes de loading)
 * Uso: await sleep(2000) // espera 2 segundos
 */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
