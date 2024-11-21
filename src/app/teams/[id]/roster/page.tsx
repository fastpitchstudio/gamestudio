// src/app/teams/[id]/roster/page.tsx
import React from 'react'
import { getInitialTeam } from '../actions'
import TeamRosterClient from '@/components/roster/roster-client'
import type { Team } from '../types'

/***********************
// Next.js 15+ Dynamic Route Params Handling
// Params must be treated as a Promise and awaited before use
// This ensures proper TypeScript checks and runtime behavior
***********************/

type Params = Promise<{ id: string }>;

export default async function Page({ 
  params 
}: { 
  params: Params 
}): Promise<React.ReactElement> {
  const { id } = await params
  const team = await getInitialTeam(id) as Team
  
  const coachName = team.coach_teams?.[0]?.users?.user_metadata?.full_name || 
                   team.coach_teams?.[0]?.users?.email || 
                   'Coach'

  return (
    <TeamRosterClient 
      teamId={id}
      teamName={team.name}
      coachName={coachName}
    />
  )
}