'use client'

import React from 'react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to an error reporting service
    console.error('Component Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{this.state.error?.message || 'An unexpected error occurred'}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="ml-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )
    }

    return this.props.children
  }
} 