'use client'

import type { CSSProperties } from 'react'
import {
  CarFront,
  Gamepad2,
  Landmark,
  MonitorSmartphone,
  PlayCircle,
  ShoppingBag,
  Store,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import type { MerchantBrand, MerchantBrandCategory } from '@/core/brand/merchantBrandRegistry'
import { cn } from '@/lib/utils'

type MerchantBrandAvatarProps = {
  brand?: MerchantBrand | null
  label: string
  category?: string | null
  className?: string
}

const FALLBACK_ICONS: Record<MerchantBrandCategory | 'default', LucideIcon> = {
  finance: Landmark,
  retail: ShoppingBag,
  food: UtensilsCrossed,
  mobility: CarFront,
  entertainment: PlayCircle,
  technology: MonitorSmartphone,
  gaming: Gamepad2,
  default: Store,
}

function inferFallbackCategory(category?: string | null): MerchantBrandCategory | 'default' {
  const normalized = (category ?? '').toLowerCase()
  if (/banco|finance|pagamento|cart[aã]o/.test(normalized)) return 'finance'
  if (/mercado|compra|shopping|varejo/.test(normalized)) return 'retail'
  if (/aliment|restaurante|delivery|comida/.test(normalized)) return 'food'
  if (/transport|mobilidade|viagem/.test(normalized)) return 'mobility'
  if (/stream|entretenimento|assinatura/.test(normalized)) return 'entertainment'
  if (/tecnologia|software|app/.test(normalized)) return 'technology'
  if (/game|jogo/.test(normalized)) return 'gaming'
  return 'default'
}

export function MerchantBrandAvatar({ brand, label, category, className }: MerchantBrandAvatarProps) {
  if (brand) {
    const markStyle: CSSProperties = {
      WebkitMaskImage: `url("${brand.assetPath}")`,
      maskImage: `url("${brand.assetPath}")`,
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center',
      maskPosition: 'center',
      WebkitMaskSize: 'contain',
      maskSize: 'contain',
      backgroundColor: 'var(--neutral-950)',
    }

    return (
      <span
        aria-hidden="true"
        title={brand.label}
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border',
          'border-[var(--neutral-200)] bg-[var(--neutral-0)] shadow-[var(--shadow-surface)]',
          className,
        )}
      >
        <span className="h-[22px] w-[22px]" style={markStyle} />
      </span>
    )
  }

  const initial = label.trim().charAt(0).toUpperCase()
  const fallbackCategory = inferFallbackCategory(category)
  const FallbackIcon = FALLBACK_ICONS[fallbackCategory]

  return (
    <span
      aria-hidden="true"
      title={category || label}
      className={cn(
        'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border',
        'border-[var(--color-card-border)] bg-[var(--color-status-neutral-surface)]',
        'text-sm font-semibold text-[var(--color-text-secondary)]',
        className,
      )}
    >
      {initial || <FallbackIcon className="h-[18px] w-[18px]" />}
      {initial ? (
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-[var(--color-card-border)] bg-[var(--color-card-fill)] text-[var(--color-text-helper)]">
          <FallbackIcon className="h-2.5 w-2.5" />
        </span>
      ) : null}
    </span>
  )
}
