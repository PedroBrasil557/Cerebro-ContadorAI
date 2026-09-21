import { describe, expect, it } from 'vitest'
import {
  dialogMotionVariants,
  listItemMotionVariants,
  motionDuration,
  motionTransition,
  pageMotionVariants,
} from '../../core/motion/presets'

describe('Cérebro motion system', () => {
  it('keeps JS durations aligned with the audited CSS motion scale', () => {
    expect(motionDuration).toEqual({
      instant: 0.1,
      fast: 0.16,
      normal: 0.24,
      slow: 0.36,
    })
  })

  it('uses restrained page motion instead of zoom-heavy navigation', () => {
    expect(pageMotionVariants.initial).toMatchObject({ opacity: 0, y: 6 })
    expect(pageMotionVariants.enter).toMatchObject({ opacity: 1, y: 0 })
    expect(pageMotionVariants.exit).toMatchObject({ opacity: 0, y: -4 })
    expect(motionTransition.standard.duration).toBe(motionDuration.normal)
  })

  it('keeps reusable presets for collection and dialog interactions', () => {
    expect(listItemMotionVariants.exit).toMatchObject({ opacity: 0, height: 0 })
    expect(dialogMotionVariants.initial).toMatchObject({ opacity: 0, scale: 0.98, y: 6 })
    expect(motionTransition.gentleSpring).toMatchObject({
      type: 'spring',
      stiffness: 340,
      damping: 32,
    })
  })
})
