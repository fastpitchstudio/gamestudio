// lib/supabase/teams-client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database-types'

export type Team = Database['public']['Tables']['teams']['Row']
export type TeamInsert = Database['public']['Tables']['teams']['Insert']

export async function createTeam(teamData: TeamInsert): Promise<Team> {
  const supabase = createClientComponentClient<Database>()
  
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      throw new Error('Authentication required')
    }

    // Start a "transaction" using multiple operations
    // 1. Create the team
    console.log('Creating team:', teamData)
    const { data: newTeam, error: teamError } = await supabase
      .from('teams')
      .insert(teamData)
      .select()
      .single()

    if (teamError) {
      console.error('Team creation error:', teamError)
      throw new Error(`Team creation failed: ${teamError.message}`)
    }

    if (!newTeam) {
      throw new Error('No team data returned')
    }

    // 2. Immediately create the coach relationship
    console.log('Creating coach relationship for team:', newTeam.id)
    const { error: coachError } = await supabase
      .from('coach_teams')
      .insert({
        team_id: newTeam.id,
        coach_id: user.id,
        role: 'head'
      })

    if (coachError) {
      console.error('Coach relationship error:', coachError)
      // Clean up the team if coach relationship fails
      const { error: deleteError } = await supabase
        .from('teams')
        .delete()
        .eq('id', newTeam.id)
      
      if (deleteError) {
        console.error('Cleanup error:', deleteError)
      }
      throw new Error(`Coach relationship failed: ${coachError.message}`)
    }

    // 3. Verify we can read the team back (confirms policies are working)
    const { data: verifiedTeam, error: verifyError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', newTeam.id)
      .single()

    if (verifyError || !verifiedTeam) {
      console.error('Verification error:', verifyError)
      throw new Error('Created team could not be verified')
    }

    console.log('Successfully created and verified team:', verifiedTeam)
    return verifiedTeam
  } catch (error) {
    console.error('Create team error:', error)
    throw error instanceof Error ? error : new Error('Unknown error occurred')
  }
}