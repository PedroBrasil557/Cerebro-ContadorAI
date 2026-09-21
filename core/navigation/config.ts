import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  BriefcaseBusiness,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  PieChart,
  ShieldAlert,
  ShoppingCart,
  Target,
} from 'lucide-react'
import type { ActiveTab, AccountMode } from '@/types_db'
import type { Entitlements, ProductAccess } from '@/lib/billing/plans'

export type NavigationSection = 'primary' | 'secondary' | 'global'

export interface AppNavigationItem {
  id: ActiveTab
  label: string
  shortLabel?: string
  icon: LucideIcon
  section: NavigationSection
  /** Primary destinations shown directly in responsive product navigation. */
  mobilePrimary?: boolean
  entitlement?: keyof Pick<Entitlements, 'investments' | 'debtCenter'>
}

const PERSONAL_ITEMS: AppNavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Visão geral',
    icon: LayoutDashboard,
    section: 'primary',
    mobilePrimary: true,
  },
  {
    id: 'transações',
    label: 'Transações',
    icon: ArrowLeftRight,
    section: 'primary',
    mobilePrimary: true,
  },
  {
    id: 'orçamento',
    label: 'Orçamento',
    icon: CircleDollarSign,
    section: 'primary',
    mobilePrimary: true,
  },
  {
    id: 'metas',
    label: 'Metas',
    icon: Target,
    section: 'primary',
    mobilePrimary: true,
  },
  {
    id: 'compras inteligentes',
    label: 'Smart Shopping',
    shortLabel: 'Compras',
    icon: ShoppingCart,
    section: 'secondary',
  },
  {
    id: 'minha carteira',
    label: 'Carteira de Cartões',
    shortLabel: 'Cartões',
    icon: CreditCard,
    section: 'secondary',
  },
  {
    id: 'investimentos',
    label: 'Patrimônio',
    icon: PieChart,
    section: 'secondary',
    entitlement: 'investments',
  },
  {
    id: 'central de dividas',
    label: 'Central de Dívidas',
    shortLabel: 'Dívidas',
    icon: ShieldAlert,
    section: 'secondary',
    entitlement: 'debtCenter',
  },
]

const PROFESSIONAL_ITEMS: AppNavigationItem[] = [
  {
    id: 'visão do negócio',
    label: 'Visão geral',
    icon: LayoutDashboard,
    section: 'primary',
    mobilePrimary: true,
  },
  {
    id: 'caixa empresarial',
    label: 'Financeiro',
    icon: BriefcaseBusiness,
    section: 'primary',
    mobilePrimary: true,
  },
]

const ADMIN_ITEM: AppNavigationItem = {
  id: 'admin',
  label: 'Administração',
  shortLabel: 'Admin',
  icon: ShieldAlert,
  section: 'global',
}

export function resolveAccountMode({
  preferred,
  product,
  canSwitchProducts,
}: {
  preferred: AccountMode
  product: AccountMode
  canSwitchProducts: boolean
}): AccountMode {
  return canSwitchProducts ? preferred : product
}

export function getNavigationItems(
  accountMode: AccountMode,
  access: ProductAccess,
): AppNavigationItem[] {
  const productItems = accountMode === 'personal' ? PERSONAL_ITEMS : PROFESSIONAL_ITEMS
  return access.canAccessAdmin ? [...productItems, ADMIN_ITEM] : productItems
}

export function getPrimaryNavigationItems(
  accountMode: AccountMode,
  access: ProductAccess,
): AppNavigationItem[] {
  return getNavigationItems(accountMode, access).filter((item) => item.section === 'primary')
}

export function getSecondaryNavigationItems(
  accountMode: AccountMode,
  access: ProductAccess,
): AppNavigationItem[] {
  return getNavigationItems(accountMode, access).filter((item) => item.section !== 'primary')
}

export function getMobilePrimaryItems(
  accountMode: AccountMode,
  access: ProductAccess,
): AppNavigationItem[] {
  return getNavigationItems(accountMode, access).filter((item) => item.mobilePrimary)
}

export function isNavigationItemLocked(
  item: AppNavigationItem,
  entitlements: Entitlements,
): boolean {
  if (!item.entitlement) return false
  return !entitlements[item.entitlement]
}
