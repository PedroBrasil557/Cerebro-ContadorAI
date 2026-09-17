export type PlanCode = 'free' | 'pro' | 'premium'
export type ProductCode = 'personal' | 'professional'
export type SystemRole = 'user' | 'admin' | 'founder'

export interface Entitlements {
  dashboard: boolean
  transactions: boolean
  wallet: boolean
  smartShopping: boolean
  investments: boolean
  debtCenter: boolean
  /** @deprecated Use product access instead. */
  professional: boolean
  aiMessagesPerDay: number
  ocrPerMonth: number
  maxCards: number | null
  maxGoals: number | null
}

export interface ProductAccess {
  product: ProductCode
  canAccessPersonal: boolean
  canAccessProfessional: boolean
  canAccessAdmin: boolean
  canSwitchProducts: boolean
}

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'unpaid'

export const PAID_SUBSCRIPTION_STATUSES = new Set<SubscriptionStatus>(['active', 'trialing'])

export const PRODUCT_BY_PLAN: Record<PlanCode, ProductCode> = {
  free: 'personal',
  pro: 'personal',
  premium: 'professional',
}

export const PLAN_ENTITLEMENTS: Record<PlanCode, Entitlements> = {
  free: {
    dashboard: true, transactions: true, wallet: true, smartShopping: true,
    investments: false, debtCenter: false, professional: false,
    aiMessagesPerDay: 5, ocrPerMonth: 3, maxCards: 3, maxGoals: 3,
  },
  pro: {
    dashboard: true, transactions: true, wallet: true, smartShopping: true,
    investments: true, debtCenter: true, professional: false,
    aiMessagesPerDay: 50, ocrPerMonth: 50, maxCards: null, maxGoals: null,
  },
  premium: {
    dashboard: false, transactions: false, wallet: false, smartShopping: false,
    investments: false, debtCenter: false, professional: true,
    aiMessagesPerDay: 100, ocrPerMonth: 100, maxCards: null, maxGoals: null,
  },
}

export function getEntitlementsForPlan(plan: PlanCode): Entitlements {
  return PLAN_ENTITLEMENTS[plan]
}

export function productForPlan(plan: PlanCode): ProductCode {
  return PRODUCT_BY_PLAN[plan]
}

export function hasCurrentPaidSubscription(
  status: SubscriptionStatus | null | undefined,
  currentPeriodEnd?: string | null,
) {
  if (!status || !PAID_SUBSCRIPTION_STATUSES.has(status)) return false
  if (!currentPeriodEnd) return true
  return new Date(currentPeriodEnd).getTime() > Date.now()
}

export function resolveProductAccess({
  plan,
  product,
  status,
  systemRole = 'user',
  currentPeriodEnd,
}: {
  plan?: PlanCode | null
  product?: ProductCode | null
  status?: SubscriptionStatus | null
  systemRole?: SystemRole
  currentPeriodEnd?: string | null
}): { plan: PlanCode; access: ProductAccess } {
  const elevated = systemRole === 'admin' || systemRole === 'founder'
  const paid = Boolean(plan) && hasCurrentPaidSubscription(status, currentPeriodEnd)
  const effectivePlan: PlanCode = paid && plan ? plan : 'free'
  const effectiveProduct = paid && plan ? (product ?? productForPlan(plan)) : 'personal'

  return {
    plan: effectivePlan,
    access: {
      product: effectiveProduct,
      canAccessPersonal: elevated || effectiveProduct === 'personal',
      canAccessProfessional: elevated || effectiveProduct === 'professional',
      canAccessAdmin: elevated,
      canSwitchProducts: elevated,
    },
  }
}

export const canAccessPersonal = (access: ProductAccess) => access.canAccessPersonal
export const canAccessProfessional = (access: ProductAccess) => access.canAccessProfessional
export const canAccessAdmin = (access: ProductAccess) => access.canAccessAdmin
