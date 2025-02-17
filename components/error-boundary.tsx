 'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { logger } from '@/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Error boundary caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex h-[400px] w-full flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <Icons.alertTriangle className="h-10 w-10 text-destructive" />
            <h3 className="mt-4 text-lg font-semibold">
              Something went wrong
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button
              className="mt-4"
              onClick={this.handleRetry}
            >
              Try again
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}