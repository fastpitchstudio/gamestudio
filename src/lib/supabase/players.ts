// src/lib/supabase/players.ts
import { supabase } from './index'

import type { Player, InsertPlayer, UpdatePlayer } from '../types/supabase'

export async function getTeamPlayers(teamId: string) {
  const { data, error } = await supabase
    .from('players')
    .select(`
      *,
      positions (
        code,
        name
      )
    `)
    .eq('team_id', teamId)
    .eq('active', true)
    .order('number')

  if (error) throw error
  return data as Player[]
}

export async function getPlayer(playerId: string) {
  const { data, error } = await supabase
    .from('players')
    .select(`
      *,
      positions (
        code,
        name
      )
    `)
    .eq('id', playerId)
    .single()

  if (error) throw error
  return data as Player
}

export async function createPlayer(player: InsertPlayer) {
  const { data, error } = await supabase
    .from('players')
    .insert(player)
    .select()
    .single()

  if (error) throw error
  return data as Player
}

export async function updatePlayer(playerId: string, updates: UpdatePlayer) {
  const { data, error } = await supabase
    .from('players')
    .update(updates)
    .eq('id', playerId)
    .select()
    .single()

  if (error) throw error
  return data as Player
}

