import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  variant?: "default" | "circular" | "rectangular"
  width?: string | number
  height?: string | number
  animation?: "pulse" | "wave" | "none"
}

export function Skeleton({
  className,
  variant = "default",
  width,
  height,
  animation = "pulse",
  ...props
}: SkeletonProps): JSX.Element {
  const style = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  }

  return (
    <div
      className={cn(
        "bg-muted animate-pulse rounded-md",
        {
          "rounded-full": variant === "circular",
          "rounded-none": variant === "rectangular",
          "animate-pulse": animation === "pulse",
          "animate-shimmer": animation === "wave",
          "animate-none": animation === "none",
        },
        className
      )}
      style={style}
      {...props}
    />
  )
}

export function SkeletonText({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div
      className={cn("space-y-2", className)}
      {...props}
    >
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[150px]" />
    </div>
  )
}

export function SkeletonCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div
      className={cn("space-y-3", className)}
      {...props}
    >
      <Skeleton className="h-[200px] w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  )
}

export function SkeletonAvatar({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <Skeleton
      className={cn("h-12 w-12 rounded-full", className)}
      {...props}
    />
  )
} 