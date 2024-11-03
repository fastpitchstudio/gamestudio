// src/lib/supabase/teams.ts
import { supabase } from './index'
import type { 
  Team, 
  InsertTeam, 
  UpdateTeam, 
  CoachTeam,
  WithTeam,
  DbResultOk 
} from '@/lib/types'

export async function getTeam(teamId: string) {
  const { data, error } = await supabase
    .from('teams')
    .select()
    .eq('id', teamId)
    .single()

  if (error) throw error
  return data as Team
}

export async function getCoachTeams(coachId: string) {
  const { data, error } = await supabase
    .from('coach_teams')
    .select(`
      team_id,
      role,
      teams (*)
    `)
    .eq('coach_id', coachId)

  if (error) throw error
  return data
}

export async function createTeam(team: InsertTeam) {
  const { data, error } = await supabase
    .from('teams')
    .insert(team)
    .select()
    .single()

  if (error) throw error
  return data as Team
}

export async function updateTeam(teamId: string, updates: UpdateTeam) {
  const { data, error } = await supabase
    .from('teams')
    .update(updates)
    .eq('id', teamId)
    .select()
    .single()

  if (error) throw error
  return data as Team
}
