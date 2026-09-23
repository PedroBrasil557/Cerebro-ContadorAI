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
  mounted: boolean
  setTheme: (theme: CerebroTheme) => void
  toggleTheme: () => void
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
  const [theme, setThemeState] = useState<CerebroTheme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const rootTheme = document.documentElement.dataset.theme
    const initialTheme: CerebroTheme = rootTheme === 'dark'
      ? 'dark'
      : rootTheme === 'light'
        ? 'light'
        : persistedTheme() ?? browserTheme()

    applyTheme(initialTheme)
    setThemeState(initialTheme)
    setMounted(true)
  }, [])

  const setTheme = useCallback((nextTheme: CerebroTheme) => {
    applyTheme(nextTheme)
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme)
    } catch {
      // The visual preference still applies for the current session when storage is unavailable.
    }
    setThemeState(nextTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [setTheme, theme])

  const value = useMemo<CerebroThemeContextValue>(() => ({
    theme,
    mounted,
    setTheme,
    toggleTheme,
  }), [mounted, setTheme, theme, toggleTheme])

  return (
    <CerebroThemeContext.Provider value={value}>
      {children}
      <Toaster position="top-center" richColors theme={theme} />
    </CerebroThemeContext.Provider>
  )
}

export function useCerebroTheme() {
  const context = useContext(CerebroThemeContext)
  if (!context) {
    throw new Error('useCerebroTheme must be used inside CerebroThemeProvider')
  }
  return context
}

export const CEREBRO_THEME_STORAGE_KEY = STORAGE_KEY
