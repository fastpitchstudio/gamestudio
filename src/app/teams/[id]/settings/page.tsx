// src/app/teams/[id]/settings/page.tsx
import React from 'react'
import { getInitialTeam } from '../actions'
import { TeamSettings } from '@/components/shared/team-settings'
//import type { Team } from '@/lib/types'

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
  const team = await getInitialTeam(id)

  return (
    <TeamSettings 
      teamId={team.id}
      teamName={team.name}
      teamColor={team.team_color}
      logoUrl={team.logo_url}
      division={team.division}
      season={team.season}
    />
  )
}