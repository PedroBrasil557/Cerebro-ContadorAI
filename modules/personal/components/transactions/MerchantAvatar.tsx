'use client'

import { resolveMerchantBrand } from '@/core/brand/merchantBrandRegistry'
import { MerchantBrandAvatar } from '@/core/ui/merchant-brand-avatar'

type MerchantProps = {
  name: string
  category?: string
  source?: string
}

export default function MerchantAvatar({ name, category, source }: MerchantProps) {
  const brand = resolveMerchantBrand({ description: name, source })
  return <MerchantBrandAvatar brand={brand} label={name} category={category} className="rounded-full" />
}
