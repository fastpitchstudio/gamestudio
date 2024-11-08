'use client'

// src/components/shared/team-settings.tsx
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { TeamLogo } from '@/components/shared/team-logo'
import { TeamColorPicker } from '@/components/shared/team-color-picker'
import { uploadTeamLogo } from '@/lib/supabase/storage'
import { logoCacheService } from '@/lib/cache/logo-cache'
import { Loader2, Upload, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import type { Database } from '@/lib/types/database-types'

interface TeamSettingsProps {
  teamId: string;
  teamName: string;
  teamColor: string | null;
  logoUrl: string | null;
  division: string | null;
  season: string | null;
}

export function TeamSettings({ 
  teamId, 
  teamName: initialTeamName, 
  teamColor, 
  logoUrl: initialLogoUrl,
  division: initialDivision,
  season: initialSeason,
}: TeamSettingsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedColor, setSelectedColor] = useState(teamColor || '#1e3a8a')
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl)
  const [teamName, setTeamName] = useState(initialTeamName)
  const [division, setDivision] = useState(initialDivision ?? '')
  const [season, setSeason] = useState(initialSeason ?? '')
  const supabase = createClientComponentClient<Database>()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log('selectedFile:', selectedFile)
      console.log('file:', file)
      setSelectedFile(file)
      handleUpdateLogo(file)
    }
  }

  const handleRemoveLogo = async () => {
    setIsLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('teams')
        .update({ logo_url: null })
        .eq('id', teamId)

      if (error) throw error

      logoCacheService.clearCache()
      setLogoUrl(null)
      setSelectedFile(null)
    } catch (err) {
      console.error('Error removing logo:', err)
      setError('Failed to remove logo')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateLogo = async (file: File) => {
    setIsLoading(true)
    setError('')

    try {
      const newLogoUrl = await uploadTeamLogo(file)
      
      if (newLogoUrl) {
        const { error } = await supabase
          .from('teams')
          .update({ logo_url: newLogoUrl })
          .eq('id', teamId)

        if (error) throw error

        logoCacheService.clearCache()
        setLogoUrl(newLogoUrl)
      }
    } catch (err) {
      console.error('Error updating logo:', err)
      setError('Failed to update logo')
    } finally {
      setIsLoading(false)
      setSelectedFile(null)
    }
  }

  const handleUpdateTeamInfo = async () => {
    setIsLoading(true)
    setError('')

    try {
      const updates = {
        name: teamName.trim(),
        division: division.trim() || null,
        season: season.trim() || null,
      }

      const { error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId)

      if (error) throw error
    } catch (err) {
      console.error('Error updating team info:', err)
      setError('Failed to update team information')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateTeamColor = async () => {
    setIsLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('teams')
        .update({ team_color: selectedColor })
        .eq('id', teamId)

      if (error) throw error
    } catch (err) {
      console.error('Error updating team color:', err)
      setError('Failed to update team color')
    } finally {
      setIsLoading(false)
    }
  }

  const hasInfoChanges = 
    teamName !== initialTeamName || 
    division !== (initialDivision ?? '') || 
    season !== (initialSeason ?? '')

  const hasColorChanges = selectedColor !== teamColor

  return (
    <div className="space-y-6">
      {/* Team Information */}
      <Card>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
          <CardDescription>
            Update your team's basic information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name</Label>
            <Input
              id="name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="division">Division</Label>
            <Input
              id="division"
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              placeholder="e.g., 12U, 14U, 16U"
              className="max-w-md"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="season">Season</Label>
            <Input
              id="season"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="e.g., Spring 2024"
              className="max-w-md"
            />
          </div>

          {hasInfoChanges && (
            <Button
              onClick={handleUpdateTeamInfo}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Team Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Team Appearance</CardTitle>
          <CardDescription>
            Customize your team's colors and logo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Team Color Section */}
          <div className="space-y-2">
            <Label>Team Color</Label>
            <TeamColorPicker
              value={selectedColor}
              onChange={setSelectedColor}
            />
            <div 
              className="mt-2 h-8 w-full rounded-md border"
              style={{ backgroundColor: selectedColor }}
            />
            {hasColorChanges && (
              <Button
                onClick={handleUpdateTeamColor}
                disabled={isLoading}
                className="mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Save Color'
                )}
              </Button>
            )}
          </div>

          <Separator />

          {/* Team Logo Section */}
          <div className="space-y-2">
            <Label>Team Logo</Label>
            <div className="flex items-start gap-4">
              {logoUrl ? (
                <div className="relative">
                  <TeamLogo 
                    logoUrl={logoUrl} 
                    teamName={teamName}
                    size="lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
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
                    disabled={isLoading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}