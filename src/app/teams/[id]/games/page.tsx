// src/app/teams/[id]/games/page.tsx
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { getInitialTeam } from '../actions'

type Params = Promise<{ id: string }>;

export default async function TeamGamesPage({ 
  params 
}: { 
  params: Params 
}) {
  const { id } = await params
  const team = await getInitialTeam(id)

  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      {/* TODO: Add GamesList component */}
      <div>Games List for {team.name}</div>
    </Suspense>
  )
}