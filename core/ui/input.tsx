import * as React from "react"
import { cn } from "@/lib/utils"

type InputStatus = "default" | "error" | "success"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  status?: InputStatus
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, status = "default", disabled, ...props }, ref) => (
    <input
      ref={ref}
      disabled={disabled}
      aria-invalid={status === "error" || props["aria-invalid"] || undefined}
      className={cn(
        "h-11 w-full rounded-[var(--radius-md)] border px-3 text-sm",
        "bg-[var(--color-field-fill)] text-[var(--color-text-primary)]",
        "placeholder:text-[var(--color-text-placeholder)]",
        "transition-colors duration-[var(--motion-duration-fast)]",
        "border-[var(--color-field-border)] hover:border-[var(--color-field-border-hover)]",
        "focus:border-[var(--color-field-border-focus)] focus:outline-none",
        "focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:ring-offset-2",
        "focus:ring-offset-[var(--color-bg-canvas)]",
        status === "error" && "border-[var(--color-field-border-error)]",
        status === "success" && "border-[var(--color-field-border-success)]",
        "disabled:cursor-not-allowed disabled:border-[var(--color-field-border)]",
        "disabled:bg-[var(--color-field-fill-disabled)] disabled:text-[var(--color-text-disabled)]",
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = "Input"

export { Input }
export type { InputStatus }
