import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })
    
    // Refresh the session
    await supabase.auth.getSession()

    const { data: { user } } = await supabase.auth.getUser()
    const path = request.nextUrl.pathname

    console.log(`🚀 Middleware - Path: ${path}, User: ${user?.email ?? 'none'}`)

    // Protected routes
    if (path.startsWith('/dashboard')) {
      if (!user) {
        console.log('🔒 Redirecting to login - No user found')
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    // Auth routes - redirect to dashboard if already authenticated
    if (user && (
      path === '/login' ||
      path === '/signup' ||
      path === '/'
    )) {
      console.log('👉 Redirecting to dashboard - User is authenticated')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return res
  } catch (error) {
    console.error('❌ Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}