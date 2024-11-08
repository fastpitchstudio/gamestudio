// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from './lib/types/database-types'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })
  
  // Refresh session if it exists
  const { data: { session } } = await supabase.auth.getSession()
  
  // Handle auth routes
  if (req.nextUrl.pathname.startsWith('/login') || 
      req.nextUrl.pathname.startsWith('/signup')) {
    if (session) {
      return NextResponse.redirect(new URL('/teams', req.url))
    }
    return res
  }

  // Protect application routes
  if (!session) {
    // Redirect unauthenticated requests to login
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // For authenticated users accessing root or dashboard
  if (req.nextUrl.pathname === '/' || req.nextUrl.pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/teams', req.url))
  }

  // For team-specific routes, verify team access
  if (req.nextUrl.pathname.startsWith('/teams/') && req.nextUrl.pathname !== '/teams/new') {
    const teamId = req.nextUrl.pathname.split('/')[2]
    if (teamId && teamId !== 'new') {
      const { data: teamAccess, error: teamError } = await supabase
        .from('coach_teams')
        .select('team_id')
        .eq('coach_id', session.user.id)
        .eq('team_id', teamId)
        .single()

      if (teamError || !teamAccess) {
        // If no access to team, redirect to teams list
        return NextResponse.redirect(new URL('/teams', req.url))
      }
    }
  }

  return res
}

// Specify which routes should trigger the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}