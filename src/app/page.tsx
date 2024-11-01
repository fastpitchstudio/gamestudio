import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function RootPage() {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      redirect('/dashboard')
    } else {
      redirect('/login')
    }
  } catch (error) {
    console.error('Root page error:', error)
    redirect('/login')
  }
}