// src/app/teams/[id]/live/page.tsx
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { getInitialTeam } from '../actions'

type Params = Promise<{ id: string }>;

export default async function TeamLivePage({ 
  params 
}: { 
  params: Params 
}) {
  // Await params before use
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
      {/* TODO: Add LiveGameContent component */}
      <div>Live Game Content for {team.name}</div>
    </Suspense>
  )
}