'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { financeService } from '@/services/financeService'
import AppLoadingScreen from '@/core/ui/AppLoadingScreen'
import ViewContainer from '@/core/components/ViewContainer'
import Navigation from '@/core/components/Navigation'
import AIAssistant from '@/core/components/ai/AIAssistant'
import { AppTopBar } from '@/core/navigation/AppTopBar'
import { checkAndTriggerSystemNotifications } from '@/core/action/notifications'
import { calculateBalance, calculateExpenses, calculateIncome } from '@/core/finance/transactionMath'
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
          const preferred = dbProfile.account_mode
          setAccountMode(
            billing.access.canSwitchProducts && preferred === 'professional'
              ? 'professional'
              : billing.product,
          )
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
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification,
        ),
      )
    })
  }

  const financialSummary = useMemo(() => {
    const income = calculateIncome(transactions)
    const expense = calculateExpenses(transactions)
    return {
      balance: calculateBalance(transactions),
      income,
      expense,
      emergencyTotal: 0,
    }
  }, [transactions])

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
            onAddGoal={(goal) =>
              financeService.createGoal(goal).then((createdGoal) =>
                setGoals((current) => [...current, createdGoal]),
              )
            }
          />
          <div className="h-24 md:h-8" aria-hidden="true" />
        </div>

        {accountMode === 'personal' && billing.access.canAccessPersonal ? (
          <AIAssistant user={user} />
        ) : null}
      </main>
    </div>
  )
}
