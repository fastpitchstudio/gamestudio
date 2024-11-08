// src/app/page.tsx
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database-types'

export default async function Page(): Promise<never> {
  const cookieStore = cookies()
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })
  
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Try to find the user's most recent team
  const { data: recentTeam } = await supabase
    .from('coach_teams')
    .select('team_id')
    .eq('coach_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // If user has a team, redirect to that team's live page
  if (recentTeam) {
    redirect(`/teams/${recentTeam.team_id}/live`)
  }

  // If no teams, redirect to teams list
  redirect('/teams')
}