// src/lib/supabase/lineups.ts
import { supabase } from './index'
import type { 
  GameLineup, 
  InsertGameLineup, 
  UpdateGameLineup, 
  Player 
} from '@/lib/types'

// Define specific types for nested queries
interface LineupWithPlayer extends GameLineup {
  players: Player
}

/**
 * Get full lineup for a game with player details
 */
export async function getGameLineup(gameId: string): Promise<LineupWithPlayer[]> {
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
): Promise<LineupWithPlayer[]> {
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
export async function updateLineup(lineup: InsertGameLineup[]): Promise<GameLineup[]> {
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
): Promise<GameLineup> {
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
 * Delete a player from the lineup for a specific inning
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
): Promise<GameLineup[]> {
  // Get source inning lineup
  const sourceLineup = await getInningLineup(gameId, fromInning)
  
  // Create new lineup entries for target inning
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

export function validateLineup(lineup: GameLineup[]): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const positions = new Map<string, number>() // Maps position to count of active players
    const battingOrders = new Set<number>()
  
    lineup.forEach(entry => {
      // Check for duplicate positions (excluding SUB and null positions)
      if (entry.position && entry.position !== 'SUB') {
        const count = positions.get(entry.position) || 0
        positions.set(entry.position, count + 1)
        
        if (count > 0) {
          errors.push(`Multiple active players in position: ${entry.position}`)
        }
      }
  
      // Check for duplicate batting order (excluding null orders)
      if (entry.batting_order !== null) {
        if (battingOrders.has(entry.batting_order)) {
          errors.push(`Duplicate batting order: ${entry.batting_order}`)
        }
        battingOrders.add(entry.batting_order)
      }
    })
  
    // Check maximum number of active players (9 or 10 depending on rules)
    const activePositions = Array.from(positions.values()).reduce((sum, count) => sum + count, 0)
    if (activePositions > 10) { // Adjust number based on league rules
      errors.push('Too many active players in lineup')
    }
  
    return {
      valid: errors.length === 0,
      errors
    }
}

// Helper to get a formatted display name for a position
export function getPositionDisplay(position: string | null): string {
    if (!position) return 'Not Set'
    
    const positionMap: Record<string, string> = {
      'P': 'Pitcher',
      'C': 'Catcher',
      '1B': 'First Base',
      '2B': 'Second Base',
      '3B': 'Third Base',
      'SS': 'Shortstop',
      'LF': 'Left Field',
      'CF': 'Center Field',
      'RF': 'Right Field',
      'DP': 'Designated Player',
      'FLEX': 'Flex',
      'TWIN': 'Twin Player',
      'EP': 'Extra Player',
      'EH': 'Extra Hitter',
      'SUB': 'Substitute'
    }
  
    return positionMap[position] || position
  }
  
  // Helper to check if position is a substitute
  export function isSubstitute(position: string | null): boolean {
    return position === 'SUB'
  }
  
  // Helper to get valid positions for substitutions
  export function getValidSubstitutionPositions(originalPosition: string | null): string[] {
    if (!originalPosition || originalPosition === 'SUB') {
      return ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DP', 'FLEX', 'SUB']
    }
    
    // If player is in a specific position, they can only be substituted
    // or return to their original position
    return ['SUB', originalPosition]
  }