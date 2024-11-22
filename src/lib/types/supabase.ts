// src/lib/types/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { PostgrestError } from '@supabase/supabase-js'
import type { Database } from './database-types'

// Export types from supabase-js for convenience
export type SupabaseClient = ReturnType<typeof createClient<Database>>
export type DbError = PostgrestError

// Convenient type extractions
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Common table types
export type Team = Database['public']['Tables']['teams']['Row']
export type Player = Database['public']['Tables']['players']['Row']
export type DbPosition = Tables<'positions'>
export type Game = Database['public']['Tables']['games']['Row']
export type GameLineup = Database['public']['Tables']['game_lineups']['Row']
export type GameHighlight = Tables<'game_highlights'>
export type CoachProfile = Tables<'coach_profiles'>
export type CoachSettings = Tables<'coach_settings'>
export type CoachInvitation = Tables<'coach_invitations'>

// Insert types
export type InsertTeam = InsertTables<'teams'>
export type InsertPlayer = InsertTables<'players'>
export type InsertGame = InsertTables<'games'>
export type DbInsertGameLineup = InsertTables<'game_lineups'>
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

// Function return types
export type QueryResult<T> = Promise<T>
export type QueryArrayResult<T> = Promise<T[]>
export type MutationResult<T> = Promise<T>