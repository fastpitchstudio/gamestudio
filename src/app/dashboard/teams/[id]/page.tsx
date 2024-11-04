import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import TeamPageContent from './team-page-content'
import { getInitialTeam } from './actions'

interface PageParams {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}

// Both components use the same type
export default function Page(props: PageParams) {
  return <TeamPage {...props} />
}

async function TeamPage({ params }: PageParams) {
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