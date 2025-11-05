// components/Navigation.tsx
'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Brain, X } from 'lucide-react'
import { ActiveTab } from '@/types' 
import { navItems, NavItem } from '../lib/constants' 

type NavigationProps = {
  activeTab: ActiveTab
  onSelectTab: (tab: ActiveTab) => void
  onLogout: () => void
  isOpen: boolean
  onClose: () => void
}

export default function Navigation({
  activeTab,
  onSelectTab,
  onLogout,
  isOpen,
  onClose,
}: NavigationProps) {
  
  const NavButton = ({ item }: { item: NavItem }) => {
    const isActive = activeTab === item.id
    return (
      <button
        onClick={() => {
          onSelectTab(item.id)
          onClose() 
        }}
        className={`flex w-full items-center gap-3 rounded-lg p-3 text-base font-medium transition-all duration-200 ease-in-out ${
          isActive
            ? 'bg-brand-violet text-white shadow-md' // Corrigido para roxo principal
            : 'text-text-secondary-dark hover:bg-card-dark/70' // Texto secundário e hover suave
        }`}
        aria-label={item.label}
      >
        <item.icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-text-secondary-dark'}`} />
        <span className={isActive ? 'font-semibold text-white' : 'text-text-secondary-dark'}>
          {item.label}
        </span>
      </button>
    )
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <nav
        className={`fixed left-0 top-0 z-40 flex h-full w-[240px] flex-col border-r border-gray-100 p-6 shadow-lg 
                   bg-sidebar-light dark:bg-card-dark 
                   dark:border-gray-700 transition-transform duration-300 ease-in-out
                   ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
                   md:translate-x-0`}
      >
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-violet text-white">
              <Brain className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-text-dark dark:text-text-light-dark">CÉREBRO</span>
          </div>
          <button onClick={onClose} className="text-gray-500 md:hidden" aria-label="Fechar menu">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </div>

        <div className="mt-4 md:hidden"> 
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg p-3 text-text-light dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-card-dark/70"
            aria-label="Sair"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-base font-medium">Sair</span>
          </button>
        </div>
      </nav>
    </>
  )
}