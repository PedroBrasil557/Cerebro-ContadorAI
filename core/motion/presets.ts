import type { Transition, Variants } from 'framer-motion'

/**
 * Cérebro.IA motion language.
 *
 * Keep motion calm and informative: small distances, short durations and no
 * decorative movement that competes with financial information.
 * Durations mirror the audited CSS motion tokens in app/globals.css.
 */
export const motionDuration = {
  instant: 0.1,
  fast: 0.16,
  normal: 0.24,
  slow: 0.36,
} as const

const calmEase: [number, number, number, number] = [0.16, 1, 0.3, 1]
const calmExitEase: [number, number, number, number] = [0.4, 0, 1, 1]

export const motionTransition = {
  instant: {
    duration: motionDuration.instant,
    ease: calmEase,
  },
  fast: {
    duration: motionDuration.fast,
    ease: calmEase,
  },
  standard: {
    duration: motionDuration.normal,
    ease: calmEase,
  },
  slow: {
    duration: motionDuration.slow,
    ease: calmEase,
  },
  exit: {
    duration: motionDuration.fast,
    ease: calmExitEase,
  },
  gentleSpring: {
    type: 'spring',
    stiffness: 340,
    damping: 32,
    mass: 0.8,
  },
} satisfies Record<string, Transition>

/** Page changes should feel continuous, never like zooming between screens. */
export const pageMotionVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
}

/** Suitable for cards/list rows that are inserted or removed from a collection. */
export const listItemMotionVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, height: 0, marginTop: 0, marginBottom: 0 },
}

/** Modal/dialog surfaces: restrained scale plus opacity. */
export const dialogMotionVariants: Variants = {
  initial: { opacity: 0, scale: 0.98, y: 6 },
  enter: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.99, y: 4 },
}
