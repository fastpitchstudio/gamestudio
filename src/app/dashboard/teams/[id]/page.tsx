
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import TeamPageContent from './team-page-content'
import type { Database } from '@/lib/types/database-types'

interface TeamPageProps {
  params: {
    id: string
  }
}

export default async function TeamPage({ params }: TeamPageProps) {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  // Verify auth
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Unauthorized')
  }

  // Verify team access
  const { data: teamAccess } = await supabase
    .from('coach_teams')
    .select('team_id')
    .eq('team_id', params.id)
    .eq('coach_id', user.id)
    .single()

  if (!teamAccess) {
    notFound()
  }

  return <TeamPageContent teamId={params.id} />
}