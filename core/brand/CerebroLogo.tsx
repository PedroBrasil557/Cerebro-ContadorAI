import Image from 'next/image'
import { BRAND } from '@/lib/branding'
import { cn } from '@/lib/utils'

type CerebroLogoVariant = 'mark' | 'lockup' | 'app-icon'
type CerebroLogoTheme = 'auto' | 'light' | 'dark'

interface CerebroLogoProps {
  variant?: CerebroLogoVariant
  theme?: CerebroLogoTheme
  height?: number
  className?: string
  label?: string
  priority?: boolean
}

const VARIANT_ASSET = {
  mark: BRAND.assets.mark,
  lockup: BRAND.assets.lockup,
  'app-icon': BRAND.assets.appIcon,
} as const

export function CerebroLogo({
  variant = 'mark',
  theme = 'auto',
  height,
  className,
  label = BRAND.shortName,
  priority = false,
}: CerebroLogoProps) {
  const asset = VARIANT_ASSET[variant]
  const renderedHeight = height ?? asset.height
  const renderedWidth = Math.round((asset.width / asset.height) * renderedHeight)

  const image = (src: string, imageClassName?: string) => (
    <Image
      src={src}
      alt=""
      width={renderedWidth}
      height={renderedHeight}
      unoptimized
      priority={priority}
      className={cn('h-full w-full object-contain', imageClassName)}
    />
  )

  return (
    <span
      role="img"
      aria-label={label}
      className={cn('relative inline-flex shrink-0', className)}
      style={{ width: renderedWidth, height: renderedHeight }}
    >
      {theme === 'light' ? image(asset.light) : null}
      {theme === 'dark' ? image(asset.dark) : null}
      {theme === 'auto' ? (
        <>
          {image(asset.light, 'dark:hidden')}
          {image(asset.dark, 'hidden dark:block')}
        </>
      ) : null}
    </span>
  )
}
