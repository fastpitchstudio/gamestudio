import type { Database } from '@/lib/types/database-types'

export interface Team extends Database['public']['Tables']['teams']['Row'] {
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