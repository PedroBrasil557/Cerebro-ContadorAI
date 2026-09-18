import * as React from "react"
import { cn } from "@/lib/utils"

type FieldProps = React.HTMLAttributes<HTMLDivElement> & {
  label?: React.ReactNode
  htmlFor?: string
  helperText?: React.ReactNode
  error?: React.ReactNode
  success?: React.ReactNode
  required?: boolean
}

/**
 * Field owns the semantic relationship around form controls.
 * Validation/help belongs next to the control rather than only in a toast.
 */
function Field({
  label,
  htmlFor,
  helperText,
  error,
  success,
  required,
  className,
  children,
  ...props
}: FieldProps) {
  const message = error ?? success ?? helperText

  return (
    <div className={cn("flex w-full flex-col gap-2", className)} {...props}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="text-[13px] font-medium leading-[18px] text-[var(--color-text-primary)]"
        >
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </label>
      ) : null}
      {children}
      {message ? (
        <p
          className={cn(
            "text-xs leading-[18px]",
            error && "text-[var(--color-text-error)]",
            success && !error && "text-[var(--color-text-success)]",
            !error && !success && "text-[var(--color-text-helper)]",
          )}
          role={error ? "alert" : undefined}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}

export { Field }
export type { FieldProps }
