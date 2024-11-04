'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Database } from '@/lib/types/database-types'
import type { Team } from './types'

export async function getInitialTeam(teamId: string): Promise<Team> {
  const cookieStore = cookies()
  const supabase = createServerComponentClient<Database>({ 
    cookies: () => cookieStore
  })
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Unauthorized')
  }

  const { data, error: teamError } = await supabase
    .from('teams')
    .select(`
      *,
      coach_teams (
        id,
        team_id,
        role
      )
    `)
    .eq('id', teamId)
    .eq('coach_teams.coach_id', user.id)
    .single()

  if (teamError || !data) {
    notFound()
  }

  const baseTeam = data as Database['public']['Tables']['teams']['Row'] & {
    coach_teams: Array<{
      id: string;
      team_id: string;
      role: string;
    }>;
  };

  // Transform the data to include user information
  const transformedTeam: Team = {
    ...baseTeam,
    coach_teams: baseTeam.coach_teams.map(ct => ({
      id: ct.id,
      team_id: ct.team_id,
      role: ct.role,
      users: {
        email: user.email || '',
        user_metadata: {
          full_name: user.user_metadata?.full_name
        }
      }
    }))
  }

  return transformedTeam
}