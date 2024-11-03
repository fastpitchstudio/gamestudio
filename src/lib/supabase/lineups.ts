// src/lib/supabase/lineups.ts
import { supabase } from './index'
import type { 
  GameLineup, 
  InsertGameLineup, 
  UpdateGameLineup,
  Player,
  QueryResult,
  QueryArrayResult
} from '@/lib/types'

// Interface for lineup with player data
interface LineupWithPlayer extends GameLineup {
  players: Player
}

/**
 * Get full lineup for a game with player details
 */
export async function getGameLineup(gameId: string): QueryArrayResult<LineupWithPlayer> {
  const { data, error } = await supabase
    .from('game_lineups')
    .select(`
      *,
      players (*)
    `)
    .eq('game_id', gameId)
    .order('inning', { ascending: true })
    .order('batting_order', { ascending: true })

  if (error) throw error
  return (data || []) as unknown as LineupWithPlayer[]
}

/**
 * Get lineup for a specific inning
 */
export async function getInningLineup(
  gameId: string, 
  inning: number
): QueryArrayResult<LineupWithPlayer> {
  const { data, error } = await supabase
    .from('game_lineups')
    .select(`
      *,
      players (*)
    `)
    .eq('game_id', gameId)
    .eq('inning', inning)
    .order('batting_order', { ascending: true })

  if (error) throw error
  return (data || []) as unknown as LineupWithPlayer[]
}

/**
 * Update or create multiple lineup entries
 */
export async function updateLineup(lineup: InsertGameLineup[]): QueryArrayResult<GameLineup> {
  const { data, error } = await supabase
    .from('game_lineups')
    .upsert(lineup, {
      onConflict: 'game_id,player_id,inning'
    })
    .select()

  if (error) throw error
  if (!data) throw new Error('Failed to update lineup')
  
  return data
}

/**
 * Update a single player's position in the lineup
 */
export async function updateLineupPosition(
  gameId: string,
  playerId: string,
  inning: number,
  updates: UpdateGameLineup
): QueryResult<GameLineup> {
  const { data, error } = await supabase
    .from('game_lineups')
    .update(updates)
    .eq('game_id', gameId)
    .eq('player_id', playerId)
    .eq('inning', inning)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Lineup entry not found')
  
  return data
}

/**
 * Remove a player from the lineup for a specific inning
 */
export async function removeFromLineup(
  gameId: string,
  playerId: string,
  inning: number
): Promise<void> {
  const { error } = await supabase
    .from('game_lineups')
    .delete()
    .eq('game_id', gameId)
    .eq('player_id', playerId)
    .eq('inning', inning)

  if (error) throw error
}

/**
 * Copy lineup from one inning to another
 */
export async function copyInningLineup(
  gameId: string,
  fromInning: number,
  toInning: number
): QueryArrayResult<GameLineup> {
  const sourceLineup = await getInningLineup(gameId, fromInning)
  
  const newLineup: InsertGameLineup[] = sourceLineup.map(entry => ({
    game_id: gameId,
    player_id: entry.player_id,
    batting_order: entry.batting_order,
    position: entry.position,
    inning: toInning
  }))

  const { data, error } = await supabase
    .from('game_lineups')
    .insert(newLineup)
    .select()

  if (error) throw error
  if (!data) throw new Error('Failed to copy lineup')
  
  return data
}

interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate lineup for errors
 */
export function validateLineup(lineup: GameLineup[]): ValidationResult {
  const errors: string[] = []
  const positions = new Set<string>()
  const battingOrders = new Set<number>()

  lineup.forEach(entry => {
    // Check for duplicate positions (excluding SUB and null positions)
    if (entry.position && entry.position !== 'SUB') {
      if (positions.has(entry.position)) {
        errors.push(`Multiple active players in position: ${entry.position}`)
      }
      positions.add(entry.position)
    }

    // Check for duplicate batting order
    if (entry.batting_order !== null) {
      if (battingOrders.has(entry.batting_order)) {
        errors.push(`Duplicate batting order: ${entry.batting_order}`)
      }
      battingOrders.add(entry.batting_order)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get valid positions for a player
 */
export function getAvailablePositions(
  currentLineup: GameLineup[],
  playerId: string,
  inning: number
): string[] {
  const takenPositions = new Set(
    currentLineup
      .filter(entry => 
        entry.player_id !== playerId && 
        entry.inning === inning && 
        entry.position !== 'SUB' &&
        entry.position !== null
      )
      .map(entry => entry.position)
  )

  const allPositions = [
    'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF',
    'DP', 'FLEX', 'TWIN', 'EP', 'EH', 'SUB'
  ]

  return allPositions.filter(pos => !takenPositions.has(pos))
}