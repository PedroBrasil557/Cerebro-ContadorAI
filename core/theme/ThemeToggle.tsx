'use client'

import { Moon, Sun } from 'lucide-react'
import { useCerebroTheme } from '@/core/theme/CerebroThemeProvider'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useCerebroTheme()
  const isDark = theme === 'dark'
  const label = isDark ? 'Ativar tema claro' : 'Ativar tema escuro'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      data-testid="theme-toggle"
      data-theme-value={theme}
      className={cn(
        'group relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full',
        'border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]',
        'shadow-[0_3px_10px_rgba(15,23,42,0.08)] transition-[background-color,border-color,color,transform,box-shadow] duration-200',
        'hover:-translate-y-px hover:border-[var(--color-card-accent-border)] hover:text-[var(--color-nav-active-text)] hover:shadow-[0_5px_16px_rgba(79,70,229,0.14)]',
        'active:translate-y-0 md:h-10 md:w-10',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-1 rounded-full bg-[var(--color-card-accent-fill)] opacity-0 transition-opacity duration-200',
          'group-hover:opacity-100',
        )}
      />
      <Sun
        aria-hidden="true"
        className={cn(
          'relative h-[17px] w-[17px] transition-all duration-200',
          isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-90 opacity-0',
        )}
      />
      <Moon
        aria-hidden="true"
        className={cn(
          'absolute h-[17px] w-[17px] transition-all duration-200',
          isDark ? 'scale-50 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100',
        )}
      />
    </button>
  )
}
