'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TeamRoster from '@/components/roster/roster-list'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import type { Database } from '@/lib/types/database-types'

interface TeamPageContentProps {
  teamId: string
}

type Team = Database['public']['Tables']['teams']['Row'] & {
  coach_teams: Array<{
    role: string;
    users: {
      email: string;
      user_metadata: {
        full_name?: string;
      };
    };
  }>;
}

export default function TeamPageContent({ teamId }: TeamPageContentProps) {
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTeam() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          router.push('/login')
          return
        }

        const { data, error: teamError } = await supabase
          .from('teams')
          .select(`
            *,
            coach_teams!inner (
              role,
              users:auth.users (
                email,
                user_metadata
              )
            )
          `)
          .eq('id', teamId)
          .single()

        if (teamError) {
          console.error('Error fetching team:', teamError)
          setError('Unable to load team data')
          return
        }

        if (!data) {
          setError('Team not found')
          return
        }

        setTeam(data as unknown as Team)
      } catch (err) {
        console.error('Error in loadTeam:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    loadTeam()
  }, [teamId, supabase, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!team) {
    return null
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
          <TeamRoster 
            teamId={teamId} 
            teamName={team.name}
            coachName={team.coach_teams?.[0]?.users?.user_metadata?.full_name || 
                    team.coach_teams?.[0]?.users?.email || 'Coach'}
          />
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