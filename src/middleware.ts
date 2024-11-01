import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const requestHeaders = new Headers(request.headers)
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    // Create a Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Get the user from Supabase
    const { data: { user } } = await supabase.auth.getUser()  // Removed unused 'error'
    const path = request.nextUrl.pathname

    // Log for debugging
    console.log(`Path: ${path}, User: ${user?.email ?? 'none'}`)

    // Protected routes
    if (path.startsWith('/dashboard')) {
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    // Auth routes - redirect to dashboard if already authenticated
    if (user && (
      path === '/login' ||
      path === '/signup' ||
      path === '/'
    )) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    
    // On error, redirect to login for protected routes, otherwise continue
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}