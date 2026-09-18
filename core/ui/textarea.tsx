import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  status?: "default" | "error"
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, status = "default", disabled, ...props }, ref) => (
    <textarea
      ref={ref}
      disabled={disabled}
      aria-invalid={status === "error" || props["aria-invalid"] || undefined}
      className={cn(
        "min-h-28 w-full resize-y rounded-[var(--radius-md)] border px-3 py-3 text-sm leading-5",
        "bg-[var(--color-field-fill)] text-[var(--color-text-primary)]",
        "placeholder:text-[var(--color-text-placeholder)]",
        "transition-colors duration-[var(--motion-duration-fast)]",
        "border-[var(--color-field-border)] hover:border-[var(--color-field-border-hover)]",
        "focus:border-[var(--color-field-border-focus)] focus:outline-none",
        "focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:ring-offset-2",
        "focus:ring-offset-[var(--color-bg-canvas)]",
        status === "error" && "border-[var(--color-field-border-error)]",
        "disabled:cursor-not-allowed disabled:border-[var(--color-field-border)]",
        "disabled:bg-[var(--color-field-fill-disabled)] disabled:text-[var(--color-text-disabled)]",
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = "Textarea"

export { Textarea }
