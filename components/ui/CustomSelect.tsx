// components/ui/CustomSelect.tsx
'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronsUpDown, Check } from 'lucide-react'

type CustomSelectProps = {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (option: string) => {
    onChange(option)
    setIsOpen(false)
  }

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-gray-50 p-2 text-left text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      >
        {value || placeholder}
        <ChevronsUpDown className="h-4 w-4 text-gray-500" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-700"
          >
            {options.map((option) => (
              <li
                key={option}
                onClick={() => handleSelect(option)}
                className="flex cursor-pointer items-center justify-between px-3 py-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-600"
              >
                {option}
                {value === option && <Check className="h-4 w-4 text-violet-600" />}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}