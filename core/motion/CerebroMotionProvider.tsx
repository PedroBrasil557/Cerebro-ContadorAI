'use client'

import type { ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'
import { motionTransition } from '@/core/motion/presets'

/**
 * Global motion policy for Cérebro.IA.
 *
 * `reducedMotion="user"` delegates accessibility to the user's operating-system
 * preference while preserving opacity transitions where Motion supports them.
 */
export function CerebroMotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={motionTransition.standard}>
      {children}
    </MotionConfig>
  )
}
