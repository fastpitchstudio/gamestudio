// src/lib/supabase/games.ts
import { supabase } from './index'
import type { 
  Game, 
  InsertGame, 
  UpdateGame, 
  GameLineup,
  GameHighlight,
  Player
} from '@/lib/types'

// Define specific types for the Supabase response structure
interface GameLineupWithPlayer extends GameLineup {
  players: Player
}

interface GameWithRelations extends Game {
  game_lineups: GameLineupWithPlayer[]
  game_highlights: GameHighlight[]
}

/**
 * Get a single game with all related data
 */
export async function getGame(gameId: string): Promise<GameWithRelations> {
  const { data, error } = await supabase
    .from('games')
    .select(`
      *,
      game_lineups (
        *,
        players (*)
      ),
      game_highlights (*)
    `)
    .eq('id', gameId)
    .single()

  if (error) throw error
  if (!data) throw new Error('Game not found')
  
  return data as unknown as GameWithRelations
}

/**
 * Get current game lineup with player details
 */
export async function getCurrentGameLineup(
  gameId: string, 
  inning: number
): Promise<GameLineupWithPlayer[]> {
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
  return data as unknown as GameLineupWithPlayer[]
}

/**
 * Create a new game
 */
export async function createGame(game: InsertGame): Promise<Game> {
  const { data, error } = await supabase
    .from('games')
    .insert(game)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to create game')
  
  return data
}

/**
 * Create a game from a template (copy from existing game)
 */
export async function createGameFromTemplate(
    templateGameId: string, 
    newGameData: Omit<InsertGame, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Game> {
    // First get the template game
    const template = await getGame(templateGameId)
    
    // Create new game ensuring all required fields are present
    const newGame = await createGame({
      team_id: newGameData.team_id || template.team_id,
      game_date: newGameData.game_date || template.game_date,
      opponent: newGameData.opponent ?? template.opponent,
      location: newGameData.location ?? template.location,
      game_type: newGameData.game_type ?? template.game_type,
      notes: newGameData.notes ?? template.notes,
      status: 'pending' // Always start as pending
    })
  
    // Copy lineup if it exists
    if (template.game_lineups?.length > 0) {
      const lineups = template.game_lineups.map(lineup => ({
        game_id: newGame.id,
        player_id: lineup.player_id,
        batting_order: lineup.batting_order,
        position: lineup.position,
        inning: lineup.inning
      }))
  
      await supabase.from('game_lineups').insert(lineups)
    }
  
    return newGame
  }
  
  // Example usage:
  // const newGame = await createGameFromTemplate('template-id', {
  //   team_id: 'team-123',
  //   game_date: '2024-03-15T18:00:00Z',
  //   opponent: 'New Team'
  // })

/**
 * Update an existing game
 */
export async function updateGame(gameId: string, updates: UpdateGame): Promise<Game> {
  const { data, error } = await supabase
    .from('games')
    .update(updates)
    .eq('id', gameId)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Game not found')
  
  return data
}

/**
 * Delete a game and all related data
 */
export async function deleteGame(gameId: string): Promise<void> {
  const { error } = await supabase
    .from('games')
    .delete()
    .eq('id', gameId)

  if (error) throw error
}

/**
 * Get all games for a team
 */
export async function getTeamGames(teamId: string): Promise<Game[]> {
  const { data, error } = await supabase
    .from('games')
    .select()
    .eq('team_id', teamId)
    .order('game_date', { ascending: false })

  if (error) throw error
  return data || []
}