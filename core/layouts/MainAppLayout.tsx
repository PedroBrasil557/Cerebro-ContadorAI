'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { financeService } from '@/services/financeService'
import { goalsService } from '@/services/goalsService'
import AppLoadingScreen from '@/core/ui/AppLoadingScreen'
import ViewContainer from '@/core/components/ViewContainer'
import Navigation from '@/core/components/Navigation'
import AIAssistant from '@/core/components/ai/AIAssistant'
import { AppTopBar } from '@/core/navigation/AppTopBar'
import { resolveAccountMode } from '@/core/navigation/config'
import { checkAndTriggerSystemNotifications } from '@/core/action/notifications'
import {
  calculateRealizedBalance,
  calculateRealizedExpenses,
  calculateRealizedIncome,
} from '@/core/finance/transactionMath'
import type { ActiveTab } from '@/types'
import type {
  AccountMode,
  Goal,
  Investment,
  NotificationItem,
  Transaction,
  UserProfile,
} from '@/types_db'
import { useEntitlements } from '@/core/hooks/useEntitlements'

const PROFESSIONAL_TABS = new Set<ActiveTab>(['visão do negócio', 'caixa empresarial'])

export default function MainAppLayout({ user }: { user: User }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const billing = useEntitlements()

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')
  const [accountMode, setAccountMode] = useState<AccountMode>('personal')
  const [isSwitchingProduct, setIsSwitchingProduct] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  useEffect(() => {
    async function loadData() {
      if (billing.loading) return
      try {
        await checkAndTriggerSystemNotifications()

        const [dbProfile, dbNotifs] = await Promise.all([
          financeService.getProfile(),
          financeService.getNotifications(),
        ])
        const [dbTrans, dbGoals, dbInvests] = billing.access.canAccessPersonal
          ? await Promise.all([
              financeService.getTransactions(),
              financeService.getGoals(),
              financeService.getInvestments(),
            ])
          : [[], [], []]

        if (dbProfile) {
          setUserProfile(dbProfile)
          const resolvedMode = resolveAccountMode({
            preferred: dbProfile.account_mode,
            product: billing.product,
            canSwitchProducts: billing.access.canSwitchProducts,
          })

          setAccountMode(resolvedMode)
          setActiveTab((current) => {
            if (current === 'admin' || current === 'meu perfil') return current
            if (resolvedMode === 'professional' && !PROFESSIONAL_TABS.has(current)) return 'visão do negócio'
            if (resolvedMode === 'personal' && PROFESSIONAL_TABS.has(current)) return 'dashboard'
            return current
          })
        }
        if (dbTrans) setTransactions(dbTrans)
        if (dbGoals) setGoals(dbGoals)
        if (dbNotifs) setNotifications(dbNotifs)
        if (dbInvests) setInvestments(dbInvests)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
        console.error('Erro crítico de sincronização:', error)
        toast.error('Não foi possível carregar todos os dados.')
      } finally {
        setIsLoading(false)
      }
    }
    void loadData()
  }, [
    billing.access.canAccessPersonal,
    billing.access.canSwitchProducts,
    billing.loading,
    billing.product,
    user.id,
  ])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleProductSwitch = async () => {
    if (!billing.access.canSwitchProducts || isSwitchingProduct) return

    const newMode: AccountMode = accountMode === 'personal' ? 'professional' : 'personal'
    setIsSwitchingProduct(true)
    try {
      const response = await fetch('/api/account/mode', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      })
      if (!response.ok) throw new Error('Mode switch rejected')

      setAccountMode(newMode)
      setActiveTab(newMode === 'personal' ? 'dashboard' : 'visão do negócio')
      await billing.refresh()
      toast.success(`Cérebro ${newMode === 'personal' ? 'Personal' : 'Professional'} ativado.`)
      router.refresh()
    } catch {
      toast.error('Erro ao alternar produto.')
    } finally {
      setIsSwitchingProduct(false)
    }
  }

  const handleMarkNotificationAsRead = (id: string) => {
    void financeService.markNotificationAsRead(id).then(() => {
      setNotifications((current) => current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ))
    })
  }

  const financialSummary = useMemo(() => {
    const income = calculateRealizedIncome(transactions)
    const expense = calculateRealizedExpenses(transactions)
    return {
      balance: calculateRealizedBalance(transactions),
      income,
      expense,
      emergencyTotal: 0,
    }
  }, [transactions])

  const displayName = userProfile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário'

  return (
    <div className="relative flex h-dvh overflow-hidden bg-[var(--color-bg-canvas)] font-sans text-[var(--color-text-primary)]">
      <AppLoadingScreen isLoading={isLoading || billing.loading} />

      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={handleLogout}
        accountMode={accountMode}
        plan={billing.plan}
        access={billing.access}
        entitlements={billing.entitlements}
        profile={userProfile}
        refreshEntitlements={billing.refresh}
        isSwitchingProduct={isSwitchingProduct}
        onSwitchProduct={handleProductSwitch}
      />

      <main className="relative flex min-w-0 flex-1 flex-col">
        <AppTopBar
          user={user}
          profile={userProfile}
          notifications={notifications}
          activeTab={activeTab}
          accountMode={accountMode}
          access={billing.access}
          entitlements={billing.entitlements}
          isSwitchingProduct={isSwitchingProduct}
          onSwitchProduct={handleProductSwitch}
          onMarkAsRead={handleMarkNotificationAsRead}
          onNavigate={setActiveTab}
          onLogout={handleLogout}
        />

        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-[var(--color-bg-canvas)] pb-[72px] md:pb-0">
          <ViewContainer
            activeTab={activeTab}
            handleRedirect={setActiveTab}
            summary={financialSummary}
            goals={goals}
            transactions={transactions}
            investments={investments}
            access={billing.access}
            accountMode={accountMode}
            displayName={displayName}
            onAddGoal={(goal) =>
              goalsService.createGoal(goal).then((createdGoal) =>
                setGoals((current) => [...current, createdGoal]),
              )
            }
            onAdjustGoal={(id, delta) =>
              goalsService.adjustAmount(id, delta).then((updated) =>
                setGoals((current) => current.map((goal) => goal.id === id ? updated : goal)),
              )
            }
            onUpdateGoal={(id, updates) =>
              goalsService.updateGoal(id, updates).then((updated) =>
                setGoals((current) => current.map((goal) => goal.id === id ? updated : goal)),
              )
            }
            onDeleteGoal={(id) =>
              goalsService.deleteGoal(id).then(() =>
                setGoals((current) => current.filter((goal) => goal.id !== id)),
              )
            }
          />
          <div className="h-24 md:h-8" aria-hidden="true" />
        </div>

        {accountMode === 'personal' && billing.access.canAccessPersonal ? <AIAssistant user={user} /> : null}
      </main>
    </div>
  )
}
