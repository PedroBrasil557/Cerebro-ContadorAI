export type PlanCode = 'free' | 'pro' | 'premium'

export interface Entitlements {
  dashboard: boolean
  transactions: boolean
  wallet: boolean
  smartShopping: boolean
  investments: boolean
  debtCenter: boolean
  professional: boolean
  aiMessagesPerDay: number
  ocrPerMonth: number
  maxCards: number | null
  maxGoals: number | null
}

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'unpaid'

export const PLAN_ENTITLEMENTS: Record<PlanCode, Entitlements> = {
  free: {
    dashboard: true,
    transactions: true,
    wallet: true,
    smartShopping: true,
    investments: false,
    debtCenter: false,
    professional: false,
    aiMessagesPerDay: 5,
    ocrPerMonth: 3,
    maxCards: 3,
    maxGoals: 3,
  },
  pro: {
    dashboard: true,
    transactions: true,
    wallet: true,
    smartShopping: true,
    investments: true,
    debtCenter: true,
    professional: false,
    aiMessagesPerDay: 50,
    ocrPerMonth: 50,
    maxCards: null,
    maxGoals: null,
  },
  premium: {
    dashboard: true,
    transactions: true,
    wallet: true,
    smartShopping: true,
    investments: true,
    debtCenter: true,
    professional: true,
    aiMessagesPerDay: 100,
    ocrPerMonth: 100,
    maxCards: null,
    maxGoals: null,
  },
}

export const PAID_SUBSCRIPTION_STATUSES = new Set<SubscriptionStatus>([
  'active',
  'trialing',
])

export function getEntitlementsForPlan(plan: PlanCode): Entitlements {
  return PLAN_ENTITLEMENTS[plan]
}
