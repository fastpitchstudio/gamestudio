// src/app/teams/[id]/games/[gameId]/page.tsx
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { getInitialTeam } from '../../actions'

type Params = Promise<{ 
  id: string;
  gameId: string;
}>;

export default async function GamePage({ 
  params 
}: { 
  params: Params 
}) {
  // Await both team ID and game ID
  const { id, gameId } = await params
  const team = await getInitialTeam(id)

  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      {/* TODO: Add GameDetails component */}
      <div>Game {gameId} for {team.name}</div>
    </Suspense>
  )
}