// lib/supabase/teams-server.ts
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database-types'

export async function getCoachTeams(userId: string) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore
  })

  const { data: teams, error } = await supabase
    .from('teams')
    .select(`
      *,
      coach_teams!inner (
        role
      )
    `)
    .eq('coach_teams.coach_id', userId)
    .order('name')

  if (error) {
    console.error('Error fetching teams:', error)
    throw error
  }

  return teams
}