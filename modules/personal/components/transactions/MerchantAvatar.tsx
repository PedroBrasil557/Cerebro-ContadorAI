'use client'

import React, { useState } from 'react'
import { ShoppingBag } from 'lucide-react'

type MerchantProps = {
  name: string
  category?: string
}

export default function MerchantAvatar({ name, category }: MerchantProps) {
  const [imageError, setImageError] = useState(false)

  // Limpa o nome para tentar achar o domínio (ex: "Uber*BR" -> "uber")
  const cleanName = name.split('*')[0].split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Tenta buscar o logo da Clearbit (API pública gratuita para logos)
  const logoUrl = `https://logo.clearbit.com/${cleanName}.com`

  if (imageError || !cleanName) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <ShoppingBag className="h-5 w-5 text-gray-500" />
      </div>
    )
  }

  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gray-200 dark:border-gray-700 bg-white">
      <img
        src={logoUrl}
        alt={name}
        className="h-full w-full object-contain p-1"
        onError={() => setImageError(true)}
      />
    </div>
  )
}