'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icons } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const routes = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: Icons.dashboard,
  },
  {
    href: '/patients',
    label: 'Patients',
    icon: Icons.patients,
  },
  {
    href: '/billing',
    label: 'Billing',
    icon: Icons.billing,
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: Icons.analytics,
  },
]

export function MainNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center">
      {/* Mobile Menu */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="ghost" size="icon" className="mr-2">
            <Icons.menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] p-0">
          <div className="flex flex-col space-y-4 p-4">
            {routes.map((route) => {
              const Icon = route.icon
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent',
                    pathname === route.href ? 'bg-accent' : 'transparent'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{route.label}</span>
                </Link>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Menu */}
      <nav className="hidden lg:flex lg:items-center lg:space-x-6">
        {routes.map((route) => {
          const Icon = route.icon
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                'flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent',
                pathname === route.href ? 'bg-accent' : 'transparent'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{route.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
} 