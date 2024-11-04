import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import TeamPageContent from './team-page-content'
import { getInitialTeam } from './actions'

export default async function Page({ 
  params 
}: { 
  params: { id: string } 
}) {
  const teamId = params.id
  const initialTeam = await getInitialTeam(teamId)

  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <TeamPageContent 
        teamId={teamId} 
        initialTeam={initialTeam} 
      />
    </Suspense>
  )
}