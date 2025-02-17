'use client'

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorBoundary({
  error,
  reset,
}: ErrorBoundaryProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          Something went wrong!
        </h2>
        <p className="text-muted-foreground">
          {error.message || "An unexpected error occurred"}
        </p>
        {error.digest && (
          <p className="text-sm text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => window.location.href = "/dashboard"}
          >
            Go to Dashboard
          </Button>
          <Button onClick={reset}>Try again</Button>
        </div>
      </div>
    </div>
  )
} 