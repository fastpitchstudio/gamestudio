'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { TeamSelector } from '@/components/shared/team-selector'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bell, Moon, Sun } from 'lucide-react'
import { useTheme } from "next-themes"

interface TopNavProps {
  teamId?: string;
  teamName?: string;
  teamLogoUrl?: string | null;
  onSignOut?: () => void;
}

export function TopNav({ 
  teamId, 
  teamName, 
  teamLogoUrl, 
  onSignOut 
}: TopNavProps) {
  const pathname = usePathname()
  const { setTheme } = useTheme()

  // Get routes based on context
  const routes = teamId ? [
    {
      label: 'Live',
      href: `/teams/${teamId}/live`,
    },
    {
      label: 'Games',
      href: `/teams/${teamId}/games`,
    },
    {
      label: 'Roster',
      href: `/teams/${teamId}/roster`,
    },
    {
      label: 'Settings',
      href: `/teams/${teamId}/settings`,
    }
  ] : []

  return (
    <div className="border-b sticky top-0 z-50 bg-background">
      <div className="flex h-16 items-center px-4">
        {teamId ? (
          /* Team Context */
          <TeamSelector
            currentTeamId={teamId}
            currentTeamName={teamName || 'Select Team'}
            currentTeamLogo={teamLogoUrl}
          />
        ) : (
          /* Non-Team Context */
          <Link href="/teams" className="text-xl font-semibold">
            Game Studio
          </Link>
        )}

        {/* Navigation Tabs - Only shown in team context */}
        {routes.length > 0 && (
          <nav className="flex items-center ml-8 gap-6">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === route.href 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-muted-foreground'
                )}
              >
                {route.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right Side Actions */}
        <div className="ml-auto flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>

          {/* Theme Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder-avatar.jpg" alt="Profile" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Team</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}