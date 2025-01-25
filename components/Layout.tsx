import type React from "react"
import Link from "next/link"
import { useAuth } from "../lib/contexts/AuthContext"
import RoleBasedAccess from "./RoleBasedAccess"

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userRole } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card shadow-sm">{/* Navigation content */}</nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}

export default Layout

