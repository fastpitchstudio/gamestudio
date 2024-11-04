import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import TeamPageContent from './team-page-content'
import { getInitialTeam } from './actions'

export default async function Page({ 
  // @ts-expect-error - Next.js App Router type issue with params type
  params 
}: { 
  params: { id: string } 
}) {
  const initialTeam = await getInitialTeam(params.id)

  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <TeamPageContent 
        teamId={params.id} 
        initialTeam={initialTeam} 
      />
    </Suspense>
  )
}