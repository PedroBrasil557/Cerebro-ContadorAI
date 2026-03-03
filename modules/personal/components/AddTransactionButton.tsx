// components/AddTransactionButton.tsx
'use client'

import React from 'react'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AddTransactionButton({
  onClick,
}: {
  onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg transition-colors hover:bg-violet-700 md:bottom-8 md:right-8"
      aria-label="Adicionar nova transação"
    >
      <Plus className="h-7 w-7" />
    </motion.button>
  )
}