import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import TeamPageContent from './team-page-content'
import type { Database } from '@/lib/types/database-types'

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function TeamPage({ params }: Props) {
  console.log('TeamPage - Accessing team:', params.id) // Debug log
  
  const supabase = createServerComponentClient<Database>({ cookies })
  
  // Verify auth
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Unauthorized')
  }

  // Get team with coach access check
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select(`
      *,
      coach_teams (
        role,
        coach_id
      )
    `)
    .eq('id', params.id)
    .eq('coach_teams.coach_id', user.id)
    .single()

  if (teamError || !team) {
    console.log('TeamPage - No authorized team found:', { teamError }) // Debug log
    notFound()
  }

  // Transform the data to match the expected Team type
  const transformedTeam = {
    ...team,
    coach_teams: team.coach_teams.map(ct => ({
      role: ct.role,
      users: {
        email: user.email || '',
        user_metadata: {
          full_name: user.user_metadata?.full_name
        }
      }
    }))
  }

  console.log('TeamPage - Found team:', transformedTeam.id) // Debug log

  return <TeamPageContent teamId={params.id} initialTeam={transformedTeam} />
}
