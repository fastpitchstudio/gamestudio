import type { Database } from '@/lib/types/database-types'

type TeamRow = Database['public']['Tables']['teams']['Row']

export interface Team extends TeamRow {
  id: string;
  name: string;
  division: string | null;
  season: string | null;
  team_color: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
  coach_teams: Array<{
    id: string;
    team_id: string;
    role: string;
    users: {
      email: string;
      user_metadata: {
        full_name?: string;
      };
    };
  }>;
  players?: Array<Database['public']['Tables']['players']['Row']>;
}

// For backwards compatibility
export type TeamWithCoach = Team;