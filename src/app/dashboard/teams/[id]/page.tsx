import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import TeamPageContent from './team-page-content'
import { getInitialTeam } from './actions'

type Params = Promise<{ id: string }>;

export default async function Page({ 
  params 
}: { 
  params: Params
}) {
  // Await the params before using them
  const { id } = await params
  const initialTeam = await getInitialTeam(id)

  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <TeamPageContent 
        teamId={id} 
        initialTeam={initialTeam} 
      />
    </Suspense>
  )
}