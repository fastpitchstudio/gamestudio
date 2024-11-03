// src/lib/supabase/teams.ts
import { supabase } from './index'
import type { 
  Team, 
  InsertTeam, 
  UpdateTeam,
  QueryResult,
  QueryArrayResult
} from '@/lib/types'

/**
 * Get a single team by ID
 */
export async function getTeam(teamId: string): QueryResult<Team> {
  const { data, error } = await supabase
    .from('teams')
    .select()
    .eq('id', teamId)
    .single()

  if (error) throw error
  if (!data) throw new Error('Team not found')
  
  return data
}

/**
 * Get all teams for a coach
 */
export async function getCoachTeams(coachId: string): QueryArrayResult<Team> {
  const { data, error } = await supabase
    .from('coach_teams')
    .select(`
      teams (*)
    `)
    .eq('coach_id', coachId)

  if (error) throw error
  if (!data) return []
  
  return data.map(item => item.teams as unknown as Team)
}

/**
 * Create a new team
 */
export async function createTeam(team: InsertTeam): QueryResult<Team> {
  const { data, error } = await supabase
    .from('teams')
    .insert(team)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to create team')
  
  return data
}

/**
 * Update an existing team
 */
export async function updateTeam(teamId: string, updates: UpdateTeam): QueryResult<Team> {
  const { data, error } = await supabase
    .from('teams')
    .update(updates)
    .eq('id', teamId)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Team not found')
  
  return data
}

/**
 * Delete a team
 */
export async function deleteTeam(teamId: string): Promise<void> {
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId)

  if (error) throw error
}

/**
 * Add a coach to a team
 */
export async function addCoachToTeam(
  teamId: string, 
  coachId: string, 
  role: string = 'assistant'
): Promise<void> {
  const { error } = await supabase
    .from('coach_teams')
    .insert({
      team_id: teamId,
      coach_id: coachId,
      role
    })

  if (error) throw error
}

/**
 * Remove a coach from a team
 */
export async function removeCoachFromTeam(
  teamId: string, 
  coachId: string
): Promise<void> {
  const { error } = await supabase
    .from('coach_teams')
    .delete()
    .eq('team_id', teamId)
    .eq('coach_id', coachId)

  if (error) throw error
}

/**
 * Get team with coaches
 */
export async function getTeamWithCoaches(teamId: string): QueryResult<Team & { coaches: any[] }> {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      coach_teams (
        coach_id,
        role,
        coach_profiles (*)
      )
    `)
    .eq('id', teamId)
    .single()

  if (error) throw error
  if (!data) throw new Error('Team not found')

  return {
    ...data,
    coaches: data.coach_teams.map((ct: any) => ({
      id: ct.coach_id,
      role: ct.role,
      ...ct.coach_profiles
    }))
  }
}

/**
 * Check if user is a coach for a team
 */
export async function isCoachOfTeam(teamId: string, coachId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('coach_teams')
    .select()
    .eq('team_id', teamId)
    .eq('coach_id', coachId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return false // No rows returned
    throw error
  }

  return !!data
}