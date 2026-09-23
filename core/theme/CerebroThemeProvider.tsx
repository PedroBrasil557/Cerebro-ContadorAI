'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Toaster } from 'sonner'

export type CerebroTheme = 'light' | 'dark'

const STORAGE_KEY = 'cerebro-theme'

interface CerebroThemeContextValue {
  theme: CerebroTheme
  preference: CerebroTheme
  mounted: boolean
  setTheme: (theme: CerebroTheme) => void
  toggleTheme: () => void
  setThemeOverride: (theme: CerebroTheme | null) => void
}

const CerebroThemeContext = createContext<CerebroThemeContextValue | null>(null)

function applyTheme(theme: CerebroTheme) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
}

function persistedTheme(): CerebroTheme | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function browserTheme(): CerebroTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function CerebroThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<CerebroTheme>('light')
  const [themeOverride, setThemeOverrideState] = useState<CerebroTheme | null>(null)
  const [mounted, setMounted] = useState(false)
  const theme = themeOverride ?? preference

  useEffect(() => {
    const rootTheme = document.documentElement.dataset.theme
    const initialTheme: CerebroTheme = rootTheme === 'dark'
      ? 'dark'
      : rootTheme === 'light'
        ? 'light'
        : persistedTheme() ?? browserTheme()

    applyTheme(initialTheme)
    setPreference(initialTheme)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    applyTheme(theme)
  }, [mounted, theme])

  const setTheme = useCallback((nextTheme: CerebroTheme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme)
    } catch {
      // The visual preference still applies for the current session when storage is unavailable.
    }
    setPreference(nextTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(preference === 'dark' ? 'light' : 'dark')
  }, [preference, setTheme])

  const setThemeOverride = useCallback((nextTheme: CerebroTheme | null) => {
    setThemeOverrideState(nextTheme)
  }, [])

  const value = useMemo<CerebroThemeContextValue>(() => ({
    theme,
    preference,
    mounted,
    setTheme,
    toggleTheme,
    setThemeOverride,
  }), [mounted, preference, setTheme, setThemeOverride, theme, toggleTheme])

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

export const CEREBRO_THEME_STORAGE_KEY = STORAGE_KEY
