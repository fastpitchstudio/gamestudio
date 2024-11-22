// src/lib/supabase/players.ts
import { supabase } from './index'
import type { 
  Player, 
  DbPosition,
  InsertPlayer, 
  UpdatePlayer,
} from '@/lib/types'

interface PlayerWithPosition extends Player {
  positions: DbPosition
}

interface PlayerStats {
  playerId: string
  gamesPlayed: number
  positionsPlayed: string[]
}

/**
 * Get all players for a team
 */
export async function getTeamPlayers(teamId: string): Promise<PlayerWithPosition[]> {
  const { data, error } = await supabase
    .from('players')
    .select(`
      *,
      positions (*)
    `)
    .eq('team_id', teamId)
    .eq('active', true)
    .order('number')

  if (error) throw error
  return (data || []) as unknown as PlayerWithPosition[]
}

/**
 * Get a single player
 */
export async function getPlayer(playerId: string): Promise<PlayerWithPosition> {
  const { data, error } = await supabase
    .from('players')
    .select(`
      *,
      positions (*)
    `)
    .eq('id', playerId)
    .single()

  if (error) throw error
  if (!data) throw new Error('Player not found')
  
  return data as unknown as PlayerWithPosition
}

/**
 * Create a new player
 */
export async function createPlayer(player: InsertPlayer): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .insert(player)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to create player')
  
  return data
}

/**
 * Update a player
 */
export async function updatePlayer(
  playerId: string, 
  updates: UpdatePlayer
): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .update(updates)
    .eq('id', playerId)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Player not found')
  
  return data
}

/**
 * Deactivate a player
 */
export async function deactivatePlayer(playerId: string): Promise<void> {
  const { error } = await supabase
    .from('players')
    .update({ active: false })
    .eq('id', playerId)

  if (error) throw error
}

/**
 * Get player statistics
 */
export async function getPlayerStats(playerId: string): Promise<PlayerStats> {
  const { data: gameLineups, error } = await supabase
    .from('game_lineups')
    .select(`
      game_id,
      position
    `)
    .eq('player_id', playerId)

  if (error) throw error
  if (!gameLineups) return {
    playerId,
    gamesPlayed: 0,
    positionsPlayed: []
  }

  const uniqueGames = new Set(gameLineups.map(gl => gl.game_id))
  const uniquePositions = new Set(
    gameLineups
      .map(gl => gl.position)
      .filter((pos): pos is string => pos !== null)
  )

  return {
    playerId,
    gamesPlayed: uniqueGames.size,
    positionsPlayed: Array.from(uniquePositions)
  }
}

/**
 * Format player name
 */
export function formatPlayerName(player: Player, includeNumber = false): string {
  const name = `${player.first_name} ${player.last_name}`
  return includeNumber && player.number 
    ? `#${player.number} ${name}`
    : name
}

/**
 * Check if jersey number is available
 */
export async function isJerseyNumberAvailable(
  teamId: string, 
  number: string, 
  excludePlayerId?: string
): Promise<boolean> {
  const query = supabase
    .from('players')
    .select('id')
    .eq('team_id', teamId)
    .eq('number', number)
    .eq('active', true)

  if (excludePlayerId) {
    query.neq('id', excludePlayerId)
  }

  const { data, error } = await query.single()

  if (error) {
    if (error.code === 'PGRST116') return true // No rows returned means number is available
    throw error
  }

  return !data
}