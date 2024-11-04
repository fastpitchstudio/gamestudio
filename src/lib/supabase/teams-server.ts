// lib/supabase/teams-server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database-types'
import type { Team } from './teams-client'

/**
 * Get all teams for a coach - Server Component
 */
export async function getCoachTeams(coachId: string): Promise<Team[]> {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  const { data, error } = await supabase
    .from('teams')
    .select('*, coach_teams!inner(*)')
    .eq('coach_teams.coach_id', coachId)

  if (error) {
    console.error('Error fetching teams:', error)
    throw error
  }

  return data?.map(({ coach_teams, ...team }) => team as Team) ?? []
}

/**
 * Get a single team by ID - Server Component
 */
export async function getTeamById(teamId: string): Promise<Team | null> {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single()

  if (error) {
    console.error('Error fetching team:', error)
    throw error
  }

  return data
}