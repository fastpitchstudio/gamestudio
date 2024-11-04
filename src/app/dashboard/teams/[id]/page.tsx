// src/app/dashboard/teams/[id]/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import TeamRoster from '@/components/roster/roster-list'
import {  
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Database } from '@/lib/types/database-types'

type Props = {
    params: Promise<{ id: string }>
    searchParams: { [key: string]: string | string[] | undefined }
}

export default async function TeamPage({ params }: Props) {
  const resolvedParams = await params;
  const supabase = createServerComponentClient<Database>({ cookies })
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/login')
  }

  // Get team data
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select(`
      *,
      coach_teams!inner(role)
    `)
    .eq('id', resolvedParams.id)
    .single()

  if (teamError || !team) {
    console.error('Error fetching team:', teamError)
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
        <div className="text-sm text-muted-foreground">
          {team.division && <span className="mr-4">Division: {team.division}</span>}
          {team.season && <span>Season: {team.season}</span>}
        </div>
      </div>

      <Tabs defaultValue="roster" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="space-y-4">
          <TeamRoster teamId={resolvedParams.id} />
        </TabsContent>

        <TabsContent value="games">
          <Card>
            <CardHeader>
              <CardTitle>Games</CardTitle>
            </CardHeader>
            <CardContent>
              Games management coming soon...
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Team Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {team.team_color && (
                  <div className="flex items-center gap-2">
                    <span>Team Color:</span>
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: team.team_color }}
                    />
                  </div>
                )}
                {team.logo_url && (
                  <div>
                    <span>Team Logo:</span>
                    <img 
                      src={team.logo_url} 
                      alt={`${team.name} logo`}
                      className="mt-2 w-20 h-20 object-contain"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}