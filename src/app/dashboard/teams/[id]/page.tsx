import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import TeamPageContent from './team-page-content'
import { getInitialTeam } from './actions'

// Minimal page component with no type annotations
export default function Page(props: any) {
  return <TeamPage {...props} />
}

// Helper component with proper typing
async function TeamPage({ params }: { params: { id: string } }) {
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