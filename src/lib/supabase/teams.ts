// src/lib/supabase/teams.ts
import { supabase } from './index'
import type { 
  Team, 
  InsertTeam, 
  UpdateTeam,
  CoachProfile,
  QueryResult,
  QueryArrayResult
} from '@/lib/types'

// Interface for transformed coach data
interface TeamCoach {
  first_name: string | null
  last_name: string | null
  display_name: string | null
  avatar_url: string | null
  phone: string | null
  coach_id: string
  role: string
}

// Interface for team with nested coach data
interface TeamWithCoaches extends Team {
  coaches: TeamCoach[]
}

// Type for the raw database response
interface RawTeamResponse extends Team {
  coach_teams: {
    coach_id: string
    role: string
    coach_profiles: CoachProfile
  }[]
}

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
 * Create a new team and add the creating coach as head coach
 */
export async function createTeam(team: InsertTeam): QueryResult<Team> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Start a Supabase transaction
  const { data: newTeam, error: teamError } = await supabase
    .from('teams')
    .insert(team)
    .select()
    .single()

  if (teamError) throw teamError
  if (!newTeam) throw new Error('Failed to create team')

  // Add the creating coach as head coach
  const { error: coachError } = await supabase
    .from('coach_teams')
    .insert({
      team_id: newTeam.id,
      coach_id: user.id,
      role: 'head'
    })

  if (coachError) {
    // If adding coach fails, attempt to delete the team
    await supabase.from('teams').delete().eq('id', newTeam.id)
    throw coachError
  }
  
  return newTeam
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
export async function getTeamWithCoaches(teamId: string): QueryResult<TeamWithCoaches> {
  const { data: teamData, error } = await supabase
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
  if (!teamData) throw new Error('Team not found')

  // Transform the nested data structure
  const rawTeam = teamData as unknown as RawTeamResponse
  const coaches = rawTeam.coach_teams.map(ct => ({
    coach_id: ct.coach_id,
    role: ct.role,
    first_name: ct.coach_profiles.first_name,
    last_name: ct.coach_profiles.last_name,
    display_name: ct.coach_profiles.display_name,
    avatar_url: ct.coach_profiles.avatar_url,
    phone: ct.coach_profiles.phone
  }))

  return {
    ...rawTeam,
    coaches
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
