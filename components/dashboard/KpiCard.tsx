// components/dashboard/KpiCard.tsx
'use client'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Info, LucideIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface KpiCardProps {
  title: string;
  value: number;
  change: number; // Porcentagem de mudança
  icon: LucideIcon;
  color: 'indigo' | 'emerald' | 'red' | 'amber';
  description: string;
}

export default function KpiCard({ title, value, change, icon: Icon, color, description }: KpiCardProps) {
  const isPositive = change >= 0;
  const colorSchema = {
    indigo: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400',
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
    red: 'border-red-500/20 bg-red-500/5 text-red-400',
    amber: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`p-5 rounded-2xl border backdrop-blur-md transition-all ${colorSchema[color]}`}
    >
      <div className="flex justify-between items-start">
        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
          <Icon size={20} />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger><Info size={14} className="opacity-40 hover:opacity-100" /></TooltipTrigger>
            <TooltipContent><p className="w-48 text-xs">{description}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-black text-white">
            R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(value)}
          </h3>
          <span className={`text-[10px] font-bold flex items-center ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(change)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}