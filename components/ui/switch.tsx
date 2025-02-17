"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const switchVariants = cva(
  "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
  {
    variants: {
      variant: {
        default: "data-[state=checked]:bg-primary",
        success: "data-[state=checked]:bg-green-600",
        warning: "data-[state=checked]:bg-yellow-600",
        destructive: "data-[state=checked]:bg-destructive",
        info: "data-[state=checked]:bg-blue-600",
      },
      size: {
        sm: "h-4 w-7",
        default: "h-6 w-11",
        lg: "h-8 w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const thumbVariants = cva(
  "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
  {
    variants: {
      size: {
        sm: "h-3 w-3 data-[state=checked]:translate-x-3",
        default: "h-5 w-5 data-[state=checked]:translate-x-5",
        lg: "h-7 w-7 data-[state=checked]:translate-x-6",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
    VariantProps<typeof switchVariants> {
  thumbClassName?: string
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, variant, size, thumbClassName, ...props }, ref) => (
  <SwitchPrimitive.Root
    className={cn(switchVariants({ variant, size }), className)}
    {...props}
    ref={ref}
  >
    <SwitchPrimitive.Thumb
      className={cn(thumbVariants({ size }), thumbClassName)}
    />
  </SwitchPrimitive.Root>
))
Switch.displayName = "Switch"

export { Switch } 