export const THEME_STORAGE_KEY = 'cerebro-theme'

export type CerebroTheme = 'light' | 'dark'

export function isCerebroTheme(value: unknown): value is CerebroTheme {
  return value === 'light' || value === 'dark'
}

export function getSystemTheme(matchesDark: boolean): CerebroTheme {
  return matchesDark ? 'dark' : 'light'
}

export function resolveThemePreference(
  storedTheme: string | null,
  systemPrefersDark: boolean,
): CerebroTheme {
  return isCerebroTheme(storedTheme)
    ? storedTheme
    : getSystemTheme(systemPrefersDark)
}
