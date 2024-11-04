import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import TeamPageContent from './team-page-content'
import type { Database } from '@/lib/types/database-types'

type PageParams = {
  params: { id: string }
} & Record<string, any>

async function TeamPage(props: PageParams) {
  const supabase = createServerComponentClient<Database>({ cookies })

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Unauthorized')
  }

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select(`
      *,
      coach_teams (
        role,
        coach_id
      )
    `)
    .eq('id', props.params.id)
    .eq('coach_teams.coach_id', user.id)
    .single()

  if (teamError || !team) {
    notFound()
  }

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

  return <TeamPageContent teamId={props.params.id} initialTeam={transformedTeam} />
}

export default TeamPage