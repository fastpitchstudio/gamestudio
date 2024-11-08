// src/app/teams/page.tsx
import { Suspense } from 'react'
import { headers } from 'next/headers'
import { getCoachTeams } from '@/lib/supabase/teams-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { redirect } from 'next/navigation'
import { TeamLogo } from '@/components/shared/team-logo'
import type { Database } from '@/lib/types/database-types'

function TeamCard({ team }: { team: any }): JSX.Element {
  return (
    <Link 
      href={`/teams/${team.id}/live`}
      className="block"
    >
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TeamLogo 
              logoUrl={team.logo_url} 
              teamName={team.name}
              size="sm"
            />
            <span className="ml-2">{team.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            {team.division && (
              <p>Division: {team.division}</p>
            )}
            {team.season && (
              <p>Season: {team.season}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

async function TeamsList(): Promise<JSX.Element> {
  const cookieStore = cookies()
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore
  })

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/login')
  }

  const teams = await getCoachTeams(user.id)

  if (teams.length === 0) {
    return (
      <div className="text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          You haven't created any teams yet
        </p>
        <Link href="/teams/new">
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            Create Your First Team
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  )
}

export default async function Page(): Promise<JSX.Element> {
  // Force this to be treated as a Server Component
  headers()

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Teams</h1>
        <Link href="/teams/new">
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            New Team
          </Button>
        </Link>
      </div>
      <Suspense fallback={<div>Loading teams...</div>}>
        <TeamsList />
      </Suspense>
    </div>
  )
}