'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react'
import { Toaster } from 'sonner'
import { isCerebroTheme, THEME_STORAGE_KEY, type CerebroTheme } from '@/core/theme/theme'

interface CerebroThemeContextValue {
  theme: CerebroTheme
  setTheme: (theme: CerebroTheme) => void
  toggleTheme: () => void
}

const THEME_CHANGE_EVENT = 'cerebro:theme-change'
const CerebroThemeContext = createContext<CerebroThemeContextValue | null>(null)

function readTheme(): CerebroTheme {
  const current = document.documentElement.dataset.theme
  return isCerebroTheme(current) ? current : 'light'
}

function subscribeTheme(onStoreChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange)
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange)
}

function applyTheme(theme: CerebroTheme) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
}

export function CerebroThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => 'light')

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
      if (isCerebroTheme(stored)) return
      applyTheme(event.matches ? 'dark' : 'light')
    }

    media.addEventListener('change', handleSystemThemeChange)
    return () => media.removeEventListener('change', handleSystemThemeChange)
  }, [])

  const setTheme = useCallback((nextTheme: CerebroTheme) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    applyTheme(nextTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [setTheme, theme])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [setTheme, theme, toggleTheme])

  return (
    <CerebroThemeContext.Provider value={value}>
      {children}
      <Toaster position="top-center" richColors theme={theme} />
    </CerebroThemeContext.Provider>
  )
}

export function useCerebroTheme() {
  const context = useContext(CerebroThemeContext)
  if (!context) throw new Error('useCerebroTheme must be used inside CerebroThemeProvider')
  return context
}
