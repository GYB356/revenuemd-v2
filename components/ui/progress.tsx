"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number
  max?: number
  showValue?: boolean
  variant?: "default" | "success" | "warning" | "destructive" | "info"
}

const variantStyles = {
  default: "bg-primary",
  success: "bg-green-600",
  warning: "bg-yellow-600",
  destructive: "bg-destructive",
  info: "bg-blue-600",
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, max = 100, variant = "default", showValue = false, ...props }, ref) => {
  const percentage = value ? (value / max) * 100 : 0

  return (
    <div className="relative w-full">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        {...props}
        value={value}
        max={max}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all duration-300 ease-in-out",
            variantStyles[variant]
          )}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </ProgressPrimitive.Root>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  )
})
Progress.displayName = "Progress"

export { Progress } 