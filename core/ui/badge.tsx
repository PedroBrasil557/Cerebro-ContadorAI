import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-[var(--radius-full)] font-medium",
  {
    variants: {
      tone: {
        success: "bg-[var(--color-status-success-surface)] text-[var(--color-status-success)]",
        danger: "bg-[var(--color-status-danger-surface)] text-[var(--color-status-danger)]",
        warning: "bg-[var(--color-status-warning-surface)] text-[var(--color-status-warning)]",
        info: "bg-[var(--color-status-info-surface)] text-[var(--color-status-info)]",
        neutral: "bg-[var(--color-status-neutral-surface)] text-[var(--color-status-neutral)]",
        ai: "bg-[var(--color-status-ai-surface)] text-[var(--color-status-ai)]",
      },
      size: {
        sm: "min-h-[22px] px-2 py-0.5 text-[11px] leading-4",
        md: "min-h-7 px-2.5 py-1 text-xs leading-4",
      },
    },
    defaultVariants: {
      tone: "neutral",
      size: "sm",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, tone, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
