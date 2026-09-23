'use client'

import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCerebroTheme } from '@/core/theme/CerebroThemeProvider'

interface ThemeToggleProps {
  className?: string
  compact?: boolean
}

export function ThemeToggle({ className, compact = false }: ThemeToggleProps) {
  const { theme, mounted, toggleTheme } = useCerebroTheme()
  const isDark = theme === 'dark'
  const nextLabel = isDark ? 'Ativar tema claro' : 'Ativar tema escuro'

  return (
    <button
      type="button"
      aria-label={nextLabel}
      aria-pressed={isDark}
      title={nextLabel}
      onClick={toggleTheme}
      className={cn(
        'group relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-[var(--color-border-default)]',
        'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] shadow-[0_6px_18px_rgba(15,23,42,0.08)]',
        'transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--motion-duration-fast)]',
        'hover:border-[var(--color-card-accent-border)] hover:bg-[var(--color-action-ghost-hover)] hover:text-[var(--color-text-primary)]',
        'active:scale-95 disabled:pointer-events-none disabled:opacity-60',
        compact ? 'h-9 w-9 rounded-[18px]' : 'h-10 w-10 rounded-[20px]',
        className,
      )}
      disabled={!mounted}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-1 rounded-full bg-[var(--color-card-accent-fill)] opacity-0 transition-opacity duration-[var(--motion-duration-fast)]',
          'group-hover:opacity-100',
        )}
      />
      <span className="relative flex h-5 w-5 items-center justify-center">
        <Sun
          aria-hidden="true"
          className={cn(
            'absolute h-[18px] w-[18px] text-[var(--color-status-warning)] transition-all duration-[var(--motion-duration-normal)]',
            mounted && !isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-75 opacity-0',
          )}
        />
        <Moon
          aria-hidden="true"
          className={cn(
            'absolute h-[17px] w-[17px] text-[var(--color-status-ai)] transition-all duration-[var(--motion-duration-normal)]',
            mounted && isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-75 opacity-0',
          )}
        />
      </span>
    </button>
  )
}
