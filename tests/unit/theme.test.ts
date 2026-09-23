import { describe, expect, it } from 'vitest'
import { getSystemTheme, isCerebroTheme, resolveThemePreference } from '../../core/theme/theme'

describe('theme preference', () => {
  it('accepts only supported persisted values', () => {
    expect(isCerebroTheme('light')).toBe(true)
    expect(isCerebroTheme('dark')).toBe(true)
    expect(isCerebroTheme('system')).toBe(false)
    expect(isCerebroTheme(null)).toBe(false)
  })

  it('maps the system preference when there is no explicit choice', () => {
    expect(getSystemTheme(true)).toBe('dark')
    expect(getSystemTheme(false)).toBe('light')
    expect(resolveThemePreference(null, true)).toBe('dark')
    expect(resolveThemePreference(null, false)).toBe('light')
  })

  it('keeps the explicit user choice above the system preference', () => {
    expect(resolveThemePreference('light', true)).toBe('light')
    expect(resolveThemePreference('dark', false)).toBe('dark')
  })

  it('ignores stale or invalid stored values', () => {
    expect(resolveThemePreference('legacy-dark', false)).toBe('light')
    expect(resolveThemePreference('legacy-dark', true)).toBe('dark')
  })
})
