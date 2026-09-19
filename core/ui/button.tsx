import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Cérebro Button
 *
 * Figma mapping:
 * - default     -> Type=Primary
 * - secondary   -> Type=Secondary
 * - ghost       -> Type=Ghost
 * - destructive -> Type=Destructive
 * - ai          -> Type=AI
 *
 * `outline` and `link` remain as backwards-compatible product aliases while
 * legacy screens migrate to the audited Design System.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center whitespace-nowrap font-medium",
    "transition-colors",
    "duration-[var(--motion-duration-fast)]",
    "focus-visible:outline-none focus-visible:ring-2",
    "focus-visible:ring-[var(--color-focus-ring)]",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-canvas)]",
    "disabled:pointer-events-none disabled:bg-[var(--color-action-disabled-fill)]",
    "disabled:text-[var(--color-text-disabled)] disabled:opacity-100",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-[var(--color-action-primary)] text-[var(--color-text-on-action)]",
          "hover:bg-[var(--color-action-primary-hover)]",
          "active:bg-[var(--color-action-primary-pressed)]",
        ].join(" "),
        secondary: [
          "border border-[var(--color-action-secondary-border)]",
          "bg-[var(--color-action-secondary-fill)] text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-action-secondary-hover)]",
          "active:bg-[var(--color-action-secondary-pressed)]",
        ].join(" "),
        outline: [
          "border border-[var(--color-action-secondary-border)] bg-transparent",
          "text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-action-secondary-hover)]",
          "active:bg-[var(--color-action-secondary-pressed)]",
        ].join(" "),
        ghost: [
          "bg-transparent text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-action-ghost-hover)]",
          "active:bg-[var(--color-action-ghost-pressed)]",
        ].join(" "),
        destructive: [
          "bg-[var(--color-action-destructive)] text-[var(--color-text-on-action)]",
          "hover:bg-[var(--color-action-destructive-hover)]",
          "active:bg-[var(--color-action-destructive-pressed)]",
        ].join(" "),
        ai: [
          "bg-[var(--color-action-ai)] text-[var(--color-text-on-action)]",
          "hover:bg-[var(--color-action-ai-hover)]",
          "active:bg-[var(--color-action-ai-pressed)]",
        ].join(" "),
        link: [
          "h-auto bg-transparent p-0 text-[var(--color-nav-active-text)]",
          "underline-offset-4 hover:underline",
          "disabled:bg-transparent",
        ].join(" "),
      },
      size: {
        default: "h-11 rounded-[var(--radius-md)] px-4 text-sm",
        sm: "h-9 rounded-[var(--radius-sm)] px-3 text-[13px]",
        lg: "h-[52px] rounded-[var(--radius-lg)] px-5 text-[15px]",
        icon: "h-11 w-11 rounded-[var(--radius-md)] p-0",
        "icon-sm": "h-9 w-9 rounded-[var(--radius-sm)] p-0",
        "icon-lg": "h-[52px] w-[52px] rounded-[var(--radius-lg)] p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
