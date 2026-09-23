'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Toaster } from 'sonner'
import { isCerebroTheme, THEME_STORAGE_KEY, type CerebroTheme } from '@/core/theme/theme'

interface CerebroThemeContextValue {
  theme: CerebroTheme
  setTheme: (theme: CerebroTheme) => void
  toggleTheme: () => void
  mounted: boolean
}

const CerebroThemeContext = createContext<CerebroThemeContextValue | null>(null)

function applyTheme(theme: CerebroTheme) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
}

export function CerebroThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<CerebroTheme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const current = document.documentElement.dataset.theme
    if (isCerebroTheme(current)) setThemeState(current)
    setMounted(true)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
      if (isCerebroTheme(stored)) return
      const nextTheme: CerebroTheme = event.matches ? 'dark' : 'light'
      applyTheme(nextTheme)
      setThemeState(nextTheme)
    }

    media.addEventListener('change', handleSystemThemeChange)
    return () => media.removeEventListener('change', handleSystemThemeChange)
  }, [])

  const setTheme = useCallback((nextTheme: CerebroTheme) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    applyTheme(nextTheme)
    setThemeState(nextTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [setTheme, theme])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme, mounted }), [mounted, setTheme, theme, toggleTheme])

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
