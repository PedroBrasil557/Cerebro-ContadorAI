'use client'

import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { dialogMotionVariants, motionTransition } from '@/core/motion/presets'

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  role?: 'dialog' | 'alertdialog'
}

/**
 * Backwards-compatible Modal API powered by Radix Dialog.
 *
 * Radix keeps ownership of focus trapping, Escape handling, accessible naming
 * and focus restoration. Motion only animates the visual overlay/surface, so
 * animation never replaces dialog semantics.
 */
export const Modal = ({ isOpen, onClose, title, children, role = 'dialog' }: ModalProps) => {
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <AnimatePresence>
        {isOpen ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay forceMount asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                transition={motionTransition.fast}
                className="fixed inset-0 z-[60] bg-[var(--neutral-950)]"
              />
            </Dialog.Overlay>

            <Dialog.Content
              forceMount
              role={role}
              aria-describedby={undefined}
              className={[
                'fixed left-1/2 top-1/2 z-[61] w-[calc(100%-2rem)] max-w-lg',
                '-translate-x-1/2 -translate-y-1/2 focus:outline-none',
              ].join(' ')}
            >
              <motion.div
                variants={dialogMotionVariants}
                initial="initial"
                animate="enter"
                exit="exit"
                transition={motionTransition.standard}
                className={[
                  'rounded-[var(--radius-lg)] border border-[var(--color-card-border)]',
                  'bg-[var(--color-bg-elevated)] p-6 text-[var(--color-text-primary)] shadow-2xl',
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
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  )
}
