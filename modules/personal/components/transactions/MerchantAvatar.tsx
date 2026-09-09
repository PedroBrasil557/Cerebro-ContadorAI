'use client'

import React from 'react'
import { ShoppingBag } from 'lucide-react'

type MerchantProps = {
  name: string
  category?: string
}

export default function MerchantAvatar({ name, category }: MerchantProps) {
  const initial = name.trim().charAt(0).toUpperCase()

  return (
    <div title={category || name} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 font-bold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
      {initial || <ShoppingBag className="h-5 w-5 text-gray-500" />}
    </div>
  )
}
