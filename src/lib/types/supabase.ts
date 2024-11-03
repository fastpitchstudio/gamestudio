// src/lib/types/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { PostgrestError } from '@supabase/supabase-js'
import { Database } from './database-types'

// Export types from supabase-js for convenience
export type SupabaseClient = ReturnType<typeof createClient<Database>>
export type DbError = PostgrestError

// Convenient type extractions
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Common table types
export type Team = Tables<'teams'>
export type Player = Tables<'players'>
export type Position = Tables<'positions'>
export type Game = Tables<'games'>
export type GameLineup = Tables<'game_lineups'>
export type GameHighlight = Tables<'game_highlights'>
export type CoachProfile = Tables<'coach_profiles'>
export type CoachSettings = Tables<'coach_settings'>
export type CoachInvitation = Tables<'coach_invitations'>

// Insert types
export type InsertTeam = InsertTables<'teams'>
export type InsertPlayer = InsertTables<'players'>
export type InsertGame = InsertTables<'games'>
export type InsertGameLineup = InsertTables<'game_lineups'>
export type InsertGameHighlight = InsertTables<'game_highlights'>
export type InsertCoachProfile = InsertTables<'coach_profiles'>
export type InsertCoachSettings = InsertTables<'coach_settings'>
export type InsertCoachInvitation = InsertTables<'coach_invitations'>

// Update types
export type UpdateTeam = UpdateTables<'teams'>
export type UpdatePlayer = UpdateTables<'players'>
export type UpdateGame = UpdateTables<'games'>
export type UpdateGameLineup = UpdateTables<'game_lineups'>
export type UpdateGameHighlight = UpdateTables<'game_highlights'>
export type UpdateCoachProfile = UpdateTables<'coach_profiles'>
export type UpdateCoachSettings = UpdateTables<'coach_settings'>
export type UpdateCoachInvitation = UpdateTables<'coach_invitations'>

// Add utility types for common patterns
export type WithTimestamps = {
  created_at: string
  updated_at: string
}

export type WithCreatedAt = {
  created_at: string
}

// Relationship types (only export the ones we actually use)
export interface WithPlayers<T> {
  players: Player
}

// You can uncomment these if you need them in other files
// export interface WithTeam<T> {
//   teams: Team
// }

// Function return types
export type QueryResult<T> = Promise<T>
export type QueryArrayResult<T> = Promise<T[]>
export type MutationResult<T> = Promise<T>