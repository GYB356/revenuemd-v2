import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Icons.menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Icons.notifications className="h-6 w-6" />
            <span className="sr-only">View notifications</span>
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              className="flex items-center space-x-2"
              onClick={() => {
                // Handle profile menu toggle
              }}
            >
              <div className="h-8 w-8 rounded-full bg-primary/10">
                <Icons.user className="h-8 w-8 p-2 text-primary" />
              </div>
              <span className="hidden text-sm font-medium md:inline-block">
                John Doe
              </span>
            </Button>
            {/* Profile dropdown menu would go here */}
          </div>
        </div>
      </div>
    </header>
  )
}