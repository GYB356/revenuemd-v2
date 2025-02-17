'use client'

import * as React from "react"
import { Loader2 } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const spinnerVariants = cva(
  "animate-spin",
  {
    variants: {
      variant: {
        default: "text-primary",
        secondary: "text-secondary",
        destructive: "text-destructive",
        muted: "text-muted-foreground",
        success: "text-green-600",
        warning: "text-yellow-600",
        info: "text-blue-600",
      },
      size: {
        sm: "h-3 w-3",
        default: "h-4 w-4",
        lg: "h-6 w-6",
        xl: "h-8 w-8",
        "2xl": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string
}

export function Spinner({
  className,
  variant,
  size,
  label = "Loading...",
  ...props
}: SpinnerProps): JSX.Element {
  return (
    <div role="status" className={cn("inline-flex items-center gap-2", className)} {...props}>
      <Loader2 className={cn(spinnerVariants({ variant, size }))} />
      <span className="sr-only">{label}</span>
    </div>
  )
} 