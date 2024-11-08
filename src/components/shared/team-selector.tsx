'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { TeamLogo } from '@/components/shared/team-logo'
import { ChevronDown, Plus } from 'lucide-react'
import type { Database } from '@/lib/types/database-types'

interface TeamSelectorProps {
  currentTeamId: string
  currentTeamName: string
  currentTeamLogo?: string | null
}

export function TeamSelector({ 
  currentTeamId, 
  currentTeamName,
  currentTeamLogo 
}: TeamSelectorProps) {
  const [teams, setTeams] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  React.useEffect(() => {
    async function loadTeams() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: teams } = await supabase
          .from('teams')
          .select(`
            *,
            coach_teams!inner (
              role
            )
          `)
          .eq('coach_teams.coach_id', user.id)
          .order('name')

        if (teams) {
          setTeams(teams)
        }
      } catch (error) {
        console.error('Error loading teams:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTeams()
  }, [supabase])

  const handleTeamSelect = (teamId: string) => {
    router.push(`/teams/${teamId}/live`)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="lg"
          className="gap-2 px-2 hover:bg-accent"
        >
          <div className="flex items-center gap-2">
            {currentTeamLogo && (
              <TeamLogo 
                logoUrl={currentTeamLogo} 
                teamName={currentTeamName} 
                size="sm" 
              />
            )}
            <span className="font-semibold">{currentTeamName}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2">
          <div className="text-sm font-medium text-muted-foreground px-2 py-1.5">
            Your Teams
          </div>
          {loading ? (
            <div className="text-sm text-muted-foreground p-2">
              Loading teams...
            </div>
          ) : teams.length === 0 ? (
            <div className="text-sm text-muted-foreground p-2">
              No teams found
            </div>
          ) : (
            <div className="grid gap-0.5">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => handleTeamSelect(team.id)}
                  className={`
                    flex items-center gap-2 p-2 rounded-sm w-full text-left
                    hover:bg-accent transition-colors
                    ${team.id === currentTeamId ? 'bg-accent' : ''}
                  `}
                >
                  <TeamLogo
                    logoUrl={team.logo_url}
                    teamName={team.name}
                    size="sm"
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{team.name}</span>
                    {team.coach_teams[0]?.role === 'head' && (
                      <span className="text-xs text-muted-foreground">
                        Head Coach
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="border-t mt-2 pt-2">
            <Link href="/teams/new">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
              >
                <Plus className="h-4 w-4" />
                Create New Team
              </Button>
            </Link>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}