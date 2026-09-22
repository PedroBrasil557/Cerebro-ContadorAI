import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BRAND } from '@/lib/branding'

describe('Cérebro brand assets', () => {
  it('points every official variant to a persistent local SVG', () => {
    const paths = [
      BRAND.assets.mark.light,
      BRAND.assets.mark.dark,
      BRAND.assets.lockup.light,
      BRAND.assets.lockup.dark,
      BRAND.assets.appIcon.light,
      BRAND.assets.appIcon.dark,
    ]

    expect(new Set(paths).size).toBe(6)

    for (const assetPath of paths) {
      expect(assetPath).toMatch(/^\/brand\/cerebro-.+\.svg$/)
      expect(assetPath).not.toContain('figma.com')

      const svg = readFileSync(join(process.cwd(), 'public', assetPath), 'utf8')
      expect(svg).toContain('<svg')
      expect(svg).toContain('#7C3AED')
    }
  })

  it('preserves the audited Figma dimensions', () => {
    expect(BRAND.assets.mark).toMatchObject({ width: 84, height: 76 })
    expect(BRAND.assets.lockup).toMatchObject({ width: 250, height: 76 })
    expect(BRAND.assets.appIcon).toMatchObject({ width: 72, height: 72 })
  })
})
