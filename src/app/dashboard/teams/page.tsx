// app/dashboard/teams/page.tsx
import { Suspense } from 'react'
import { getCoachTeams } from '@/lib/supabase/teams-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/types/database-types'

async function TeamsList() {
  const supabase = createServerComponentClient<Database>({ cookies })

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/login')
  }

  try {
    const teams = await getCoachTeams(user.id)

    if (teams.length === 0) {
      return (
        <div className="text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            You haven&apos;t created any teams yet
          </p>
          <Link href="/dashboard/teams/new">
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
          <Link key={team.id} href={`/dashboard/teams/${team.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {team.logo_url && (
                    <img 
                      src={team.logo_url} 
                      alt={team.name} 
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  {team.name}
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
        ))}
      </div>
    )
  } catch (error) {
    console.error('Error fetching teams:', error)
    return (
      <div className="text-center text-red-500">
        <p>Error loading teams. Please try again.</p>
      </div>
    )
  }
}

export default function TeamsPage() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Teams</h1>
        <Link href="/dashboard/teams/new">
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