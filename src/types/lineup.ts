import { Player } from './player';

export type Position = 
  | 'P'  // Pitcher
  | 'C'  // Catcher
  | '1B' // First Base
  | '2B' // Second Base
  | '3B' // Third Base
  | 'SS' // Shortstop
  | 'LF' // Left Field
  | 'CF' // Center Field
  | 'RF' // Right Field
  | 'DH' // Designated Hitter
  | 'EH' // Extra Hitter
  | 'FLEX' // Flex Player
  | 'DP'; // Designated Player

export interface LineupPlayer extends Player {
  position?: Position | null;
  batting_order?: number;
}

export interface LineupSlot {
  id: string;  // Required id for drag and drop functionality
  player: Player;
  position: Position | null;
  battingOrder?: number;
  inning?: number;
}

export interface LineupPreviewSlot extends LineupSlot {
  firstName: string;
  lastName: string;
}

export interface SubstitutePlayer {
  id: string;
  playerId: string;
  replacedPlayerId?: string;
  inningNumber?: number;
}

export interface PreviousGameLineup {
  id: string;
  gameId: string;
  teamId: string;
  opponent?: string | null;
  gameDate: string;
  lineup: LineupPreviewSlot[];
  substitutes: SubstitutePlayer[];
  notes?: string;
  createdAt: string;
}

export interface LineupState {
  lineup: LineupSlot[];
  substitutes: SubstitutePlayer[];
  availability: PlayerAvailability[];
}

export interface PlayerAvailability {
  playerId: string;
  isAvailable: boolean;
  notes?: string | null;
}

// Position configuration for visual representation
export const STANDARD_POSITIONS: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
export const SPECIAL_POSITIONS: Position[] = ['DH', 'EH', 'FLEX', 'DP'];

// Position labels for display
export const POSITION_LABELS: Record<Position, string> = {
  'P': 'Pitcher',
  'C': 'Catcher',
  '1B': 'First Base',
  '2B': 'Second Base',
  '3B': 'Third Base',
  'SS': 'Shortstop',
  'LF': 'Left Field',
  'CF': 'Center Field',
  'RF': 'Right Field',
  'DH': 'Designated Hitter',
  'EH': 'Extra Hitter',
  'FLEX': 'Flex Player',
  'DP': 'Designated Player'
};

// Field position coordinates for visual representation
export const FIELD_POSITIONS = {
  'P': { x: 50, y: 65 },
  'C': { x: 50, y: 90 },
  '1B': { x: 70, y: 65 },
  '2B': { x: 65, y: 45 },
  '3B': { x: 30, y: 65 },
  'SS': { x: 35, y: 45 },
  'LF': { x: 25, y: 20 },
  'CF': { x: 50, y: 10 },
  'RF': { x: 75, y: 20 },
} as const;

// Add a type guard to validate positions
export function isValidPosition(position: string | null | undefined): position is Position | null {
  if (position === null || position === undefined) return true;
  return [...STANDARD_POSITIONS, ...SPECIAL_POSITIONS].includes(position as Position);
}

// Add a helper to safely convert string positions
export function toPosition(position: string | null | undefined): Position | null {
  if (!position) return null;
  return isValidPosition(position) ? position as Position : null;
}
