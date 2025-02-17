import { useState, useEffect } from 'react'
import { User } from '@prisma/client'

interface AuthState {
  user: User | null
  loading: boolean
  error: Error | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session')
        if (!response.ok) {
          throw new Error('Failed to fetch session')
        }
        
        const data = await response.json()
        setState({
          user: data.user,
          loading: false,
          error: null,
        })
      } catch (error) {
        setState({
          user: null,
          loading: false,
          error: error instanceof Error ? error : new Error('Authentication failed'),
        })
      }
    }

    checkAuth()
  }, [])

  return state
} 