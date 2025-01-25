import React, { createContext, useState, useEffect, useContext } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, getCurrentUserRole } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  userRole: 'admin' | 'provider' | 'billing_staff' | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, userRole: null, loading: true })

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<'admin' | 'provider' | 'billing_staff' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = supabase.auth.session()
    setUser(session?.user ?? null)
    if (session?.user) {
      getCurrentUserRole().then(setUserRole)
    }
    setLoading(false)

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const role = await getCurrentUserRole()
        setUserRole(role)
      } else {
        setUserRole(null)
      }
      setLoading(false)
    })

    return () => {
      authListener?.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={{ user, userRole, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
