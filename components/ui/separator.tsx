"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const separatorVariants = cva(
  "shrink-0 bg-border",
  {
    variants: {
      variant: {
        default: "bg-border",
        muted: "bg-muted",
        primary: "bg-primary",
        secondary: "bg-secondary",
        destructive: "bg-destructive",
      },
      orientation: {
        horizontal: "h-[1px] w-full",
        vertical: "h-full w-[1px]",
      },
      size: {
        default: "[&[data-orientation=horizontal]]:h-[1px] [&[data-orientation=vertical]]:w-[1px]",
        sm: "[&[data-orientation=horizontal]]:h-[0.5px] [&[data-orientation=vertical]]:w-[0.5px]",
        lg: "[&[data-orientation=horizontal]]:h-[2px] [&[data-orientation=vertical]]:w-[2px]",
      },
    },
    defaultVariants: {
      variant: "default",
      orientation: "horizontal",
      size: "default",
    },
  }
)

export interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>,
    VariantProps<typeof separatorVariants> {
  decorative?: boolean
}

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(({
  className,
  orientation = "horizontal",
  variant,
  size,
  decorative = true,
  ...props
}, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(separatorVariants({ variant, orientation, size }), className)}
    {...props}
  />
))

Separator.displayName = "Separator"

export { Separator } 