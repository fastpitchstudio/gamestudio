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

// Interface for game with all relations
interface GameWithRelations extends Game {
  game_lineups: LineupWithPlayer[]
  game_highlights: GameHighlight[]
}

// Interface for lineup with player data
interface LineupWithPlayer extends GameLineup {
  players: Player
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
 * Create a game from a template
 */
export async function createGameFromTemplate(
  templateGameId: string, 
  newGameData: Omit<InsertGame, 'id' | 'created_at' | 'updated_at'>
): Promise<Game> {
  const template = await getGame(templateGameId)
  
  // Create new game
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
 * Delete a game
 */
export async function deleteGame(gameId: string): Promise<void> {
  const { error } = await supabase
    .from('games')
    .delete()
    .eq('id', gameId)

  if (error) throw error
}