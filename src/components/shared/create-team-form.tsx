'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createTeam } from '@/lib/supabase/teams-client'
import { uploadTeamLogo } from '@/lib/supabase/storage'
import { debugPolicies } from '@/lib/supabase/debug'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Upload, X, Bug } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import type { Database } from '@/lib/types/database-types'

interface FormState {
  name: string
  division: string
  season: string
  team_color: string
  logo_file?: File | null
  logo_preview?: string
}
interface DebugResults {
  auth?: {
    user: string | undefined
    email: string | undefined
    sessionInfo: {
      accessToken: 'present' | 'missing'
      expiresAt: number | undefined
      tokenDetails: {
        length: number
        prefix: string
      } | null
    }
    metadata: Record<string, unknown>
    error: unknown
    timestamp: string
  }
  insertTest?: {
    success: boolean
    error: {
      message: string
      code: string
      details: string
      hint: string
    } | null
    data: unknown
  }
  finalCheck?: {
    hasValidSession: boolean
    tokenPresent: boolean
    timestamp: string
  }
  error?: string
  errorTimestamp?: string
}

const STORAGE_KEY = 'create_team_form_state'

export function CreateTeamForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isDebugging, setIsDebugging] = useState(false)
  const [error, setError] = useState('')
  const [debugResults, setDebugResults] = useState<DebugResults | null>(null)
  const supabase = createClientComponentClient<Database>()
  
  // Form state with persistence
  const [formState, setFormState] = useState<FormState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : {
        name: '',
        division: '',
        season: '',
        team_color: '#1e40af',
        logo_file: null,
        logo_preview: ''
      }
    }
    return {
      name: '',
      division: '',
      season: '',
      team_color: '#1e40af',
      logo_file: null,
      logo_preview: ''
    }
  })

  // Persist form state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formState))
  }, [formState])

  // Clear form state on successful submission
  const clearFormState = () => {
    localStorage.removeItem(STORAGE_KEY)
    setFormState({
      name: '',
      division: '',
      season: '',
      team_color: '#1e40af',
      logo_file: null,
      logo_preview: ''
    })
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setFormState(prev => ({
        ...prev,
        logo_file: file,
        logo_preview: previewUrl
      }))
    }
  }

  const removeLogo = () => {
    setFormState(prev => ({
      ...prev,
      logo_file: null,
      logo_preview: ''
    }))
  }

  const handleDebug = async () => {
    setIsDebugging(true)
    setDebugResults(null)
    setError('')

    try {
      const results = await debugPolicies()
      console.log('Debug results:', results)
      setDebugResults(results)
    } catch (err) {
      console.error('Debug error:', err)
      setError(err instanceof Error ? err.message : 'Debug failed')
    } finally {
      setIsDebugging(false)
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Verify authentication first
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('You must be logged in to create a team')
      }

      // Upload logo if present
      let logoUrl = null
      if (formState.logo_file) {
        logoUrl = await uploadTeamLogo(formState.logo_file)
      }

      const teamData = {
        name: formState.name,
        division: formState.division || null,
        season: formState.season || null,
        team_color: formState.team_color || null,
        logo_url: logoUrl
      }

      // Validate required fields
      if (!teamData.name?.trim()) {
        throw new Error('Team name is required')
      }

      console.log('Creating team with data:', teamData)
      const team = await createTeam(teamData)
      console.log('Team created:', team)

      clearFormState()
      router.push(`/dashboard/teams/${team.id}`)
      router.refresh()
    } catch (error) {
      console.error('Detailed form error:', error)
      setError(error instanceof Error ? error.message : 'Failed to create team. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Team</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name *</Label>
            <Input
              id="name"
              value={formState.name}
              onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter team name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="division">Division</Label>
            <Input
              id="division"
              value={formState.division}
              onChange={(e) => setFormState(prev => ({ ...prev, division: e.target.value }))}
              placeholder="e.g., 12U, 14U, 16U"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="season">Season</Label>
            <Input
              id="season"
              value={formState.season}
              onChange={(e) => setFormState(prev => ({ ...prev, season: e.target.value }))}
              placeholder="e.g., Spring 2024"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team_color">Team Color</Label>
            <div className="flex items-center gap-4">
              <Input
                id="team_color"
                type="color"
                value={formState.team_color}
                onChange={(e) => setFormState(prev => ({ ...prev, team_color: e.target.value }))}
                className="h-10 w-20"
              />
              <div 
                className="h-10 flex-1 rounded-md border"
                style={{ backgroundColor: formState.team_color }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Team Logo</Label>
            <div className="flex items-center gap-4">
              {formState.logo_preview ? (
                <div className="relative w-20 h-20">
                  <Image
                    src={formState.logo_preview}
                    alt="Logo preview"
                    fill
                    className="object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </Button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {debugResults && (
            <Alert variant={debugResults.error ? "destructive" : "default"}>
              <AlertTitle>Debug Results</AlertTitle>
              <AlertDescription>
                <pre className="mt-2 text-xs whitespace-pre-wrap">
                  {JSON.stringify(debugResults, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Team'}
            </Button>

            {process.env.NODE_ENV === 'development' && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleDebug}
                disabled={isDebugging}
              >
                <Bug className="w-4 h-4 mr-2" />
                {isDebugging ? 'Running Debug...' : 'Debug Policies'}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}