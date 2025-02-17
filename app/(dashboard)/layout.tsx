import { ReactNode } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopBar } from '@/components/dashboard/top-bar'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-gray-50 px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  )
} 