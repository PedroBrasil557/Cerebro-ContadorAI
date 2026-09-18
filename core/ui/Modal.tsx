'use client'

import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

/**
 * Backwards-compatible Modal API powered by Radix Dialog.
 *
 * This preserves existing consumers while adding focus trapping, Escape close,
 * accessible labelling and predictable focus restoration.
 */
export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-[var(--neutral-950)] opacity-70" />
        <Dialog.Content
          className={[
            'fixed left-1/2 top-1/2 z-[61] w-[calc(100%-2rem)] max-w-lg',
            '-translate-x-1/2 -translate-y-1/2',
            'rounded-[var(--radius-lg)] border border-[var(--color-card-border)]',
            'bg-[var(--color-bg-elevated)] p-6 text-[var(--color-text-primary)] shadow-2xl',
            'focus:outline-none',
          ].join(' ')}
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <Dialog.Title className="text-xl font-semibold leading-7 text-[var(--color-text-primary)]">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Fechar"
                className={[
                  'inline-flex h-9 w-9 shrink-0 items-center justify-center',
                  'rounded-[var(--radius-sm)] text-[var(--color-text-secondary)]',
                  'transition-colors duration-[var(--motion-duration-fast)]',
                  'hover:bg-[var(--color-action-ghost-hover)] hover:text-[var(--color-text-primary)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]',
                ].join(' ')}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
