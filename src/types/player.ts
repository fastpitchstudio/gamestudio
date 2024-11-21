export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  number?: string | number | null;
  primaryPosition?: string | null;
  secondaryPositions?: string[] | null;
  teamId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Database schema type (snake_case)
export interface PlayerSchema {
  id: string;
  first_name: string;
  last_name: string;
  number?: string | number | null;
  primary_position?: string | null;
  secondary_positions?: string[] | null;
  team_id?: string;
  created_at?: string;
  updated_at?: string;
}

export function transformPlayerFromSchema(player: PlayerSchema): Player {
  return {
    id: player.id,
    firstName: player.first_name,
    lastName: player.last_name,
    number: player.number,
    primaryPosition: player.primary_position,
    secondaryPositions: player.secondary_positions,
    teamId: player.team_id,
    createdAt: player.created_at,
    updatedAt: player.updated_at,
  };
}
