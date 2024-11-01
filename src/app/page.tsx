import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export default async function RootPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name)
          return cookie?.value
        },
        set(name: string, value: string, options: any) {
          // Next.js cookies() doesn't support setting cookies in Server Components
          // This is handled by the middleware
        },
        remove(name: string, options: any) {
          // Next.js cookies() doesn't support removing cookies in Server Components
          // This is handled by the middleware
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  console.log('Root page - Auth check:', { hasUser: !!user, email: user?.email })

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}