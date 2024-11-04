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

type Team = {
  id: string;
  name: string;
  division: string | null;
  season: string | null;
  team_color: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
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

interface TeamPageContentProps {
  teamId: string;
  initialTeam: Team;
}

export default function TeamPageContent({ teamId, initialTeam }: TeamPageContentProps) {
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()
  const [team, setTeam] = useState<Team>(initialTeam)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTeam() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          router.push('/login')
          return
        }

        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select(`
            *,
            coach_teams (
              role,
              coach_id
            )
          `)
          .eq('id', teamId)
          .single()

        if (teamError) {
          console.error('Error fetching team:', teamError)
          setError('Unable to load team data')
          return
        }

        if (!teamData) {
          setError('Team not found')
          return
        }

        // Transform the data to match the Team type
        const transformedData = {
          ...teamData,
          coach_teams: teamData.coach_teams.map(ct => ({
            role: ct.role,
            users: {
              email: user.email || '',
              user_metadata: {
                full_name: user.user_metadata?.full_name
              }
            }
          }))
        }

        setTeam(transformedData as Team)
      } catch (err) {
        console.error('Error in loadTeam:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    // Only reload if needed
    if (!team) {
      setLoading(true)
      loadTeam()
    }
  }, [teamId, supabase, router, team])

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
