import React from "react"
import Link from "next/link"
import { useAuth } from "../contexts/AuthContext"
import RoleBasedAccess from "./RoleBasedAccess"

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userRole } = useAuth()

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        {/* ... (existing navigation items) */}
        <RoleBasedAccess allowedRoles={['admin']}>
          <Link
            href="/admin/users"
            className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
          >
            User Management
          </Link>
        </RoleBasedAccess>
        {/* ... (rest of the component) */}
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}

export default Layout
