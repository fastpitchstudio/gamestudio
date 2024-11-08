// src/lib/types/index.ts
import type { Database } from './database-types'
export * from './supabase'

export type Team = Database['public']['Tables']['teams']['Row'] & {
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
  
  export type TeamUpdate = {
    name?: string;
    division?: string | null;
    season?: string | null;
    team_color?: string | null;
    logo_url?: string | null;
  };