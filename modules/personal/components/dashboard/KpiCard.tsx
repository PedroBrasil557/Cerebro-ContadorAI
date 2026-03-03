"use client"

import React from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Info, LucideIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/core/ui/tooltip"

export interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  tooltipText?: string;
}

export function KpiCard({ title, value, icon: Icon, trend, trendValue, tooltipText }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative p-6 rounded-3xl bg-[#09090b] border border-white/5 shadow-2xl overflow-hidden group hover:border-white/10 transition-colors"
    >
      {/* Premium Background Glow - Invisível, ativa no hover para dar vida ao CÉREBRO.OS */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-all group-hover:bg-indigo-500/10" />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/5 text-gray-400 group-hover:text-indigo-400 transition-colors">
            <Icon size={16} strokeWidth={2.5} />
          </div>
          <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{title}</h3>
        </div>

        {/* Integração perfeita com o Tooltip que criamos no Passo 1 */}
        {tooltipText && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-gray-600 hover:text-indigo-400 transition-colors focus:outline-none">
                  <Info size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-[200px] text-center leading-relaxed">{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className="relative z-10">
        <h2 className="text-3xl font-black text-white tracking-tight">{value}</h2>

        {trendValue && (
          <div className="mt-3 flex items-center gap-1.5">
            {trend === 'up' && <TrendingUp size={14} className="text-emerald-400" />}
            {trend === 'down' && <TrendingDown size={14} className="text-rose-400" />}
            <span
              className={`text-xs font-bold ${
                trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-gray-500'
              }`}
            >
              {trendValue}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}