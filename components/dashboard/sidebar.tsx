import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Icons } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'

const sidebarLinks = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Icons.dashboard,
  },
  {
    title: 'Patients',
    href: '/dashboard/patients',
    icon: Icons.patients,
  },
  {
    title: 'Billing',
    href: '/dashboard/billing',
    icon: Icons.billing,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: Icons.analytics,
  },
  {
    title: 'Calendar',
    href: '/dashboard/calendar',
    icon: Icons.calendar,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Icons.settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center space-x-2">
          <Icons.logo className="h-6 w-6" />
          <span className="font-heading text-xl font-bold">RevenueMD</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {sidebarLinks.map((link) => {
          const Icon = link.icon
          return (
            <Link key={link.href} href={link.href}>
              <span
                className={cn(
                  'group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                  pathname === link.href
                    ? 'bg-accent text-accent-foreground'
                    : 'transparent'
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {link.title}
              </span>
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => {
            // Handle logout
          }}
        >
          <Icons.logout className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </aside>
  )
} 