//src/app/teams/[id]/team-page-content.tsx

'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import TeamRoster from '@/components/roster/roster-client'
import { TeamSettings } from '@/components/shared/team-settings'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from "lucide-react"
import type { Database } from '@/lib/types/database-types'
import type { Team } from './types'

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
  const [activeTab, setActiveTab] = useState('roster')

  const loadTeam = useCallback(async () => {
    setLoading(true)
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
          coach_teams!inner (
            id,
            team_id,
            role
          )
        `)
        .eq('id', teamId)
        .eq('coach_teams.coach_id', user.id)
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

      // Transform the data to include user information
      const transformedTeam: Team = {
        ...teamData,
        coach_teams: teamData.coach_teams.map(ct => ({
          id: ct.id,
          team_id: ct.team_id,
          role: ct.role,
          users: {
            email: user.email || '',
            user_metadata: {
              full_name: user.user_metadata?.full_name
            }
          }
        }))
      }

      setTeam(transformedTeam)
    } catch (err) {
      console.error('Error in loadTeam:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [teamId, supabase, router])

  useEffect(() => {
    loadTeam()
  }, [loadTeam])

  if (loading && !team) { // Only show loading state on initial load
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

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="space-y-4"
      >
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
          <TeamSettings 
            teamId={team.id}
            teamName={team.name}
            teamColor={team.team_color}
            logoUrl={team.logo_url}
            division={team.division}
            season={team.season}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}