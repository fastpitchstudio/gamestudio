'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Home,
  Users,
  CalendarDays,
  Settings,
  PlusCircle,
} from 'lucide-react'

const routes = [
  {
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard',
    color: 'text-sky-500',
  },
  {
    label: 'Teams',
    icon: Users,
    href: '/dashboard/teams',
    color: 'text-violet-500',
  },
  {
    label: 'Games',
    icon: CalendarDays,
    href: '/dashboard/games',
    color: 'text-pink-500',
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
    color: 'text-orange-500',
  },
]

export function SideNav() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-slate-50 to-slate-100 border-r">
      <div className="p-6">
        <Link 
          href="/dashboard"
          className="flex items-center gap-2 font-semibold"
        >
          <span className="text-2xl">🥎</span>
          Game Studio
        </Link>
      </div>
      <div className="flex-1 px-4">
        <div className="space-y-2">
          <Button 
            variant="outline" 
            size="lg"
            className="w-full justify-start gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            New Game
          </Button>
        </div>
        <nav className="mt-8 space-y-1.5">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-slate-500 transition-all hover:text-slate-900 hover:bg-slate-200',
                pathname === route.href ? 'text-slate-900 bg-slate-200' : ''
              )}
            >
              <route.icon className={cn('h-5 w-5', route.color)} />
              {route.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}