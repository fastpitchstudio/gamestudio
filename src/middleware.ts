// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  try {
    // Refresh session if expired
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Define protected and public paths
    const isAuthPath = req.nextUrl.pathname.startsWith('/(auth)') ||
                      req.nextUrl.pathname === '/login' ||
                      req.nextUrl.pathname === '/signup';
    
    const isProtectedPath = !isAuthPath && 
                           !req.nextUrl.pathname.startsWith('/_next') &&
                           !req.nextUrl.pathname.startsWith('/api/auth') &&
                           req.nextUrl.pathname !== '/';

    // Redirect logic
    if (!session && isProtectedPath) {
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (session && isAuthPath) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};