// app/dashboard/teams/[id]/page.tsx
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import TeamPageContent from './team-page-content'
import { getInitialTeam } from './actions'

/***********************

// For dynamic routes like [id], [slug], etc., in Next.js 15+
// DO NOT use this:
export default async function Page({ 
  params 
}: { 
  params: { id: string } 
}) {
  // This will fail TypeScript checks because params is now a Promise
}

// DO USE this:
type Params = Promise<{ id: string }>;  // Define params as Promise
export default async function Page({ 
  params 
}: { 
  params: Params 
}) {
  const { id } = await params  // Await the params before use
  // ... rest of the code
}

***********************/

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