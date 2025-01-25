import React from 'react'
import { useAuth } from '../contexts/AuthContext'

interface RoleBasedAccessProps {
  allowedRoles: ('admin' | 'provider' | 'billing_staff')[]
  children: React.ReactNode
}

const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({ allowedRoles, children }) => {
  const { user, userRole } = useAuth()

  if (!user || !userRole || !allowedRoles.includes(userRole)) {
    return null
  }

  return <>{children}</>
}

export default RoleBasedAccess
