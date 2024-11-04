import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import TeamPageContent from './team-page-content'
import type { Database } from '@/lib/types/database-types'

export default async function TeamPage({
  params,
}: {
  params: { id: string };
}) {
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
    .eq('id', params.id)
    .eq('coach_teams.coach_id', user.id)
    .single()

  if (teamError || !team) {
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

  return <TeamPageContent teamId={params.id} initialTeam={transformedTeam} />
}