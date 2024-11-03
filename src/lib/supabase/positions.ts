// src/lib/supabase/positions.ts
import { supabase } from './index'
import type { 
  Position,
  QueryResult,
  QueryArrayResult
} from '@/lib/types'

interface PositionDisplayMap {
  [key: string]: string
}

const positionDisplayMap: PositionDisplayMap = {
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

/**
 * Get all positions ordered by display order
 */
export async function getPositions(): QueryArrayResult<Position> {
  const { data, error } = await supabase
    .from('positions')
    .select()
    .order('display_order', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Get position by code
 */
export async function getPosition(code: string): QueryResult<Position> {
  const { data, error } = await supabase
    .from('positions')
    .select()
    .eq('code', code)
    .single()

  if (error) throw error
  if (!data) throw new Error('Position not found')
  
  return data
}

/**
 * Get position display name
 */
export function getPositionDisplay(code: string | null): string {
  if (!code) return 'Not Set'
  return positionDisplayMap[code] || code
}

/**
 * Get positions by numeric reference
 */
export async function getPositionsByNumericRef(
  numericRef: number
): QueryArrayResult<Position> {
  const { data, error } = await supabase
    .from('positions')
    .select()
    .eq('numeric_reference', numericRef)
    .order('display_order', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Get all field positions (excluding special positions)
 */
export async function getFieldPositions(): QueryArrayResult<Position> {
  const { data, error } = await supabase
    .from('positions')
    .select()
    .not('numeric_reference', 'is', null)
    .order('numeric_reference', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Check if position is a substitute
 */
export function isSubstitutePosition(position: string | null): boolean {
  return position === 'SUB'
}

/**
 * Get valid substitution positions
 */
export function getValidSubstitutionPositions(originalPosition: string | null): string[] {
  if (!originalPosition || originalPosition === 'SUB') {
    return ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DP', 'FLEX', 'SUB']
  }
  
  return ['SUB', originalPosition]
}