'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type CustomSelectProps = {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  disabled?: boolean
  id?: string
  name?: string
  className?: string
  'aria-label'?: string
}

/**
 * Backwards-compatible Select primitive.
 *
 * Uses the native select interaction model for keyboard/screen-reader support
 * while the product migrates toward the audited Cérebro Select component.
 */
export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  disabled = false,
  id,
  name,
  className,
  'aria-label': ariaLabel,
}: CustomSelectProps) {
  return (
    <div className={cn('relative w-full', className)}>
      <select
        id={id}
        name={name}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'h-11 w-full appearance-none rounded-[var(--radius-md)] border px-3 pr-10 text-sm',
          'border-[var(--color-field-border)] bg-[var(--color-field-fill)] text-[var(--color-text-primary)]',
          'transition-colors duration-[var(--motion-duration-fast)]',
          'hover:border-[var(--color-field-border-hover)]',
          'focus:border-[var(--color-field-border-focus)] focus:outline-none',
          'focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:ring-offset-2',
          'focus:ring-offset-[var(--color-bg-canvas)]',
          'disabled:cursor-not-allowed disabled:border-[var(--color-field-border)]',
          'disabled:bg-[var(--color-field-fill-disabled)] disabled:text-[var(--color-text-disabled)]',
          !value && 'text-[var(--color-text-placeholder)]',
        )}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]"
      />
    </div>
  )
}
