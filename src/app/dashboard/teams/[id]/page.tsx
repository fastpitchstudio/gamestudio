import { notFound } from 'next/navigation'
import { getTeamWithCoaches } from '@/lib/supabase/teams'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Users, CalendarDays, Settings } from 'lucide-react'
import Link from 'next/link'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface TeamPageProps {
  params: {
    id: string
  }
}

export default async function TeamPage({ params }: TeamPageProps) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({
    cookies: () => cookieStore
  })

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    notFound()
  }

  let team
  try {
    team = await getTeamWithCoaches(params.id)
  } catch (error) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/teams">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{team.name}</h1>
          {team.division && (
            <p className="text-sm text-slate-500">
              {team.division} • {team.season || 'No season set'}
            </p>
          )}
        </div>
      </div>

      <Tabs defaultValue="roster" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roster" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Roster
          </TabsTrigger>
          <TabsTrigger value="games" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Games
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Team Roster</h2>
            <Link href={`/dashboard/teams/${team.id}/players/new`}>
              <Button>Add Player</Button>
            </Link>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-slate-500">No players added yet</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="games" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Games</h2>
            <Link href={`/dashboard/teams/${team.id}/games/new`}>
              <Button>New Game</Button>
            </Link>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-slate-500">No games scheduled</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Team Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Team Information</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-slate-500">Name</span>
                    <span>{team.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-slate-500">Division</span>
                    <span>{team.division || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-slate-500">Season</span>
                    <span>{team.season || 'Not set'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Coaches</h3>
                <div className="space-y-2">
                  {team.coaches.map((coach) => (
                    <div key={coach.coach_id} className="flex items-center gap-2">
                      {coach.avatar_url ? (
                        <img 
                          src={coach.avatar_url} 
                          alt={coach.display_name || ''} 
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                          {(coach.first_name?.[0] || '').toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">
                          {coach.display_name || `${coach.first_name} ${coach.last_name}`}
                        </p>
                        <p className="text-sm text-slate-500 capitalize">
                          {coach.role} Coach
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button variant="destructive">Delete Team</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
