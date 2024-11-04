'use client'

// src/components/roster/roster-list.tsx
import { useState, useEffect, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table'
import { 
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog"
import LineupPDFManager from '@/components/game/lineup/lineup-pdf-manager'
import { UserPlus, PencilIcon, Save, X, Search, ArrowUpDown, Trash2, ClipboardList } from 'lucide-react'
import type { Database } from '@/lib/types/database-types'

type Player = Database['public']['Tables']['players']['Row']
type PlayerInsert = Database['public']['Tables']['players']['Insert']

type SortField = 'name' | 'number'
type SortDirection = 'asc' | 'desc'

interface NewPlayerData {
  number: string
  first_name: string
  last_name: string
  preferred_positions: string[]
}

interface ActionButtonsProps {
    player: Player;
    onDelete: (playerId: string) => Promise<void>;
    onEdit: (player: Player) => void;
  }

const POSITIONS = [
  'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'
] as const

const RosterSkeleton = () => {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Team Roster</CardTitle>
            <Skeleton className="h-10 w-[120px]" /> {/* Add Player button */}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex gap-4 items-center">
              <Skeleton className="h-10 flex-1" /> {/* Search bar */}
              <Skeleton className="h-10 w-[140px]" /> {/* Filter button */}
            </div>
          </div>
  
          <div className="border rounded-lg">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50">
              <Skeleton className="h-6 w-12" /> {/* # column */}
              <Skeleton className="h-6 w-32" /> {/* Name column */}
              <Skeleton className="h-6 w-24" /> {/* Positions column */}
              <Skeleton className="h-6 w-20" /> {/* Actions column */}
            </div>
  
            {/* Table Rows */}
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                className="grid grid-cols-4 gap-4 p-4 border-t"
              >
                <Skeleton className="h-6 w-8" /> {/* Player number */}
                <Skeleton className="h-6 w-48" /> {/* Player name */}
                <div className="flex gap-2"> {/* Positions */}
                  {[...Array(2)].map((_, j) => (
                    <Skeleton key={j} className="h-6 w-12" /> 
                  ))}
                </div>
                <Skeleton className="h-8 w-24" /> {/* Action button */}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const ActionButtons = ({ player, onDelete, onEdit }: ActionButtonsProps) => {
    return (
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEdit(player)}
                className="h-8 w-8"
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit player details</p>
            </TooltipContent>
          </Tooltip>
  
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Player</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove {player.first_name} {player.last_name} from the roster? 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(player.id)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TooltipTrigger>
            <TooltipContent>
              <p>Remove from roster</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  const NewPlayerRow = ({ onSave, onCancel }: { 
    onSave: (player: PlayerInsert) => void
    onCancel: () => void 
  }) => {
  const [newPlayer, setNewPlayer] = useState<NewPlayerData>({
    number: '',
    first_name: '',
    last_name: '',
    preferred_positions: []
  })

  const handlePositionChange = (value: string) => {
    if (!newPlayer.preferred_positions.includes(value)) {
      setNewPlayer(prev => ({
        ...prev,
        preferred_positions: [...prev.preferred_positions, value]
      }))
    }
  }


  return (
    <TableRow className="bg-muted/50">
      <TableCell className="w-24">
        <Input
          placeholder="#"
          value={newPlayer.number}
          onChange={(e) => setNewPlayer(prev => ({ ...prev, number: e.target.value }))}
          className="w-16"
        />
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Input
            placeholder="First Name"
            value={newPlayer.first_name}
            onChange={(e) => setNewPlayer(prev => ({ ...prev, first_name: e.target.value }))}
          />
          <Input
            placeholder="Last Name"
            value={newPlayer.last_name}
            onChange={(e) => setNewPlayer(prev => ({ ...prev, last_name: e.target.value }))}
          />
        </div>
      </TableCell>
      <TableCell>
        <Select onValueChange={handlePositionChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Position" />
          </SelectTrigger>
          <SelectContent>
            {POSITIONS.map(pos => (
              <SelectItem key={pos} value={pos}>{pos}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {newPlayer.preferred_positions.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {newPlayer.preferred_positions.map((pos, idx) => (
              <div 
                key={idx}
                className="bg-primary/10 px-2 py-1 rounded text-xs flex items-center gap-1"
              >
                {pos}
                <button
                  type="button"
                  onClick={() => setNewPlayer(prev => ({
                    ...prev,
                    preferred_positions: prev.preferred_positions.filter((_, i) => i !== idx)
                  }))}
                  className="text-muted-foreground hover:text-primary"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              if (newPlayer.first_name && newPlayer.last_name) {
                onSave(newPlayer as unknown as PlayerInsert)
              }
            }}
            disabled={!newPlayer.first_name || !newPlayer.last_name}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

interface TeamRosterProps {
    teamId: string;
    teamName?: string;
    coachName?: string;
  }
  
  export default function TeamRoster({ teamId, teamName, coachName }: TeamRosterProps) {
    const [isClient, setIsClient] = useState(false)
    const [players, setPlayers] = useState<Player[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showNewPlayer, setShowNewPlayer] = useState(false)
    const [sortField, setSortField] = useState<SortField>('name')
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedPositions, setSelectedPositions] = useState<string[]>([])
    const supabase = createClientComponentClient<Database>()
    const [lineupDialogOpen, setLineupDialogOpen] = useState(false)
  
// Handle client-side initialization
useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const fetchPlayers = async () => {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .eq('team_id', teamId)
          .order('last_name', { ascending: true })
        
        if (error) throw error
        setPlayers(data || [])
      } catch (err) {
        console.error('Error loading players:', err)
        setError('Failed to load roster')
      } finally {
        setLoading(false)
      }
    }

        fetchPlayers()
    }, [teamId, supabase, isClient])

    const handleAddPlayer = async (playerData: PlayerInsert) => {
        try {
        const { data, error } = await supabase
            .from('players')
            .insert([{ ...playerData, team_id: teamId }])
            .select()
            .single()

        if (error) throw error
        
        setPlayers(prev => [...prev, data])
        setShowNewPlayer(false)
        } catch (err) {
        console.error('Error adding player:', err)
        setError('Failed to add player')
        }
    }
    const handleDeletePlayer = async (playerId: string) => {
        try {
            const { error } = await supabase
            .from('players')
            .delete()
            .eq('id', playerId)

            if (error) throw error
            
            setPlayers(prev => prev.filter(p => p.id !== playerId))
        } catch (err) {
            console.error('Error deleting player:', err)
            // You might want to add a toast notification here
            setError('Failed to delete player')
        }
    }

    const handleSort = (field: SortField) => {
        if (sortField === field) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
        setSortField(field)
        setSortDirection('asc')
        }
    }

    // Memoize sorted players
    const sortedPlayers = useMemo(() => {
        return [...players].sort((a, b) => {
        if (sortField === 'name') {
            const nameA = `${a.first_name} ${a.last_name}`.toLowerCase()
            const nameB = `${b.first_name} ${b.last_name}`.toLowerCase()
            return sortDirection === 'asc' 
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA)
        } else {
            const numA = parseInt(a.number || '0')
            const numB = parseInt(b.number || '0')
            return sortDirection === 'asc' 
            ? numA - numB
            : numB - numA
        }
        })
    }, [players, sortField, sortDirection])

    // Memoize filtered players
    const filteredPlayers = useMemo(() => {
        return sortedPlayers.filter(player => {
        const matchesSearch = searchQuery.trim() === '' || 
            `${player.first_name} ${player.last_name} ${player.number || ''}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())

        const matchesPositions = selectedPositions.length === 0 ||
            player.preferred_positions?.some(pos => selectedPositions.includes(pos))

        return matchesSearch && matchesPositions
        })
    }, [sortedPlayers, searchQuery, selectedPositions])

    // Get unique positions from all players
    const availablePositions = useMemo(() => {
        return Array.from(
        new Set(
            players.flatMap(p => p.preferred_positions || [])
            .filter(Boolean)
        )
        ).sort()
    }, [players])

    const handlePositionToggle = (position: string) => {
        setSelectedPositions(prev =>
        prev.includes(position)
            ? prev.filter(p => p !== position)
            : [...prev, position]
        )
    }

    if (!isClient || loading) {
        return <RosterSkeleton />
      }
    
      if (error) {
        return <div className="text-red-500">{error}</div>
      }

    return (
        <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
            <CardTitle>Team Roster</CardTitle>
            <div className="flex gap-2">
                <Button
                variant="outline"
                onClick={() => setLineupDialogOpen(true)}
                disabled={players.length === 0}
                >
                <ClipboardList className="h-4 w-4 mr-2" />
                Generate Lineup
                </Button>
                <Button
                onClick={() => setShowNewPlayer(true)}
                disabled={showNewPlayer}
                >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Player
                </Button>
            </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="mb-4 space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search roster..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                />
                </div>
                
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                    Filter Positions
                    {selectedPositions.length > 0 && (
                        <Badge 
                        variant="secondary" 
                        className="ml-2"
                        >
                        {selectedPositions.length}
                        </Badge>
                    )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Positions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {availablePositions.map(position => (
                    <DropdownMenuCheckboxItem
                        key={position}
                        checked={selectedPositions.includes(position)}
                        onCheckedChange={() => handlePositionToggle(position)}
                    >
                        {position}
                    </DropdownMenuCheckboxItem>
                    ))}
                    {selectedPositions.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                        checked={false}
                        onCheckedChange={() => setSelectedPositions([])}
                        >
                        Clear all
                        </DropdownMenuCheckboxItem>
                    </>
                    )}
                </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Active Filters Display */}
            {selectedPositions.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                {selectedPositions.map(position => (
                    <Badge 
                    key={position}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handlePositionToggle(position)}
                    >
                    {position}
                    <X className="h-3 w-3 ml-1" />
                    </Badge>
                ))}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPositions([])}
                    className="h-6 px-2 text-xs"
                >
                    Clear all
                </Button>
                </div>
            )}

            {/* Results Count */}
            {searchQuery || selectedPositions.length > 0 ? (
                <div className="text-sm text-muted-foreground">
                Showing {filteredPlayers.length} of {players.length} players
                </div>
            ) : null}
            </div>

            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-24">
                    <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleSort('number')}
                    className="hover:bg-transparent"
                    >
                    #
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
                <TableHead>
                    <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleSort('name')}
                    className="hover:bg-transparent"
                    >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
                <TableHead>Positions</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {showNewPlayer && (
                <NewPlayerRow
                    onSave={handleAddPlayer}
                    onCancel={() => setShowNewPlayer(false)}
                />
                )}
                {filteredPlayers.map((player) => (
                <TableRow key={player.id}>
                    <TableCell>{player.number}</TableCell>
                    <TableCell>
                    {player.first_name} {player.last_name}
                    </TableCell>
                    <TableCell>
                    <div className="flex gap-1 flex-wrap">
                        {player.preferred_positions?.map((pos, idx) => (
                        <Badge 
                            key={idx}
                            variant={selectedPositions.includes(pos) ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => handlePositionToggle(pos)}
                        >
                            {pos}
                        </Badge>
                        ))}
                    </div>
                    </TableCell>
                    <TableCell>
                    <ActionButtons
                        player={player}
                        onDelete={handleDeletePlayer}
                        onEdit={() => {/* TODO: Open edit modal */}}
                    />
                    </TableCell>
                </TableRow>
                ))}
                {filteredPlayers.length === 0 && !showNewPlayer && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No players found{searchQuery || selectedPositions.length > 0 ? ' matching filters' : ''}
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
            <Dialog open={lineupDialogOpen} onOpenChange={setLineupDialogOpen}>
            <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Generate Lineup from Roster</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                <LineupPDFManager
                teamName={teamName || ""}
                coachName={coachName || ""}
                players={sortedPlayers
                    .filter(p => p.active)
                    .map((player, index) => ({
                    order: index + 1,
                    number: player.number || "",
                    name: `${player.first_name} ${player.last_name}`,
                    position: player.preferred_positions?.[0] || "DH"
                    }))}
                />
            </div>
            </DialogContent>
        </Dialog>
        </CardContent>
        </Card>
    )
  }