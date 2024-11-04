import type { Database } from '@/lib/types/database-types'

type BaseTeam = Database['public']['Tables']['teams']['Row']

export type Team = BaseTeam & {
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
};

// For backwards compatibility
export type TeamWithCoach = Team;