import * as React from "react"
import { Button, type ButtonProps } from "@/core/ui/button"
import { cn } from "@/lib/utils"

type IconButtonSize = "sm" | "md" | "lg"

type IconButtonProps = Omit<ButtonProps, "size" | "aria-label"> & {
  label: string
  size?: IconButtonSize
}

const sizeMap: Record<IconButtonSize, ButtonProps["size"]> = {
  sm: "icon-sm",
  md: "icon",
  lg: "icon-lg",
}

/**
 * Icon-only action with an accessible name enforced by the API.
 */
const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, size = "md", className, children, ...props }, ref) => (
    <Button
      ref={ref}
      size={sizeMap[size]}
      aria-label={label}
      className={cn("shrink-0", className)}
      {...props}
    >
      {children}
    </Button>
  ),
)
IconButton.displayName = "IconButton"

export { IconButton }
export type { IconButtonProps, IconButtonSize }
