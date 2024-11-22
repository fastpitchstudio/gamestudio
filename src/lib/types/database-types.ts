// src/lib/types/database.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string
          name: string
          division: string | null
          season: string | null
          team_color: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          division?: string | null
          season?: string | null
          team_color?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          division?: string | null
          season?: string | null
          team_color?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      positions: {
        Row: {
          id: string
          code: string
          name: string
          numeric_reference: number | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          numeric_reference?: number | null
          display_order: number
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          numeric_reference?: number | null
          display_order?: number
          created_at?: string
        }
      }
      players: {
        Row: {
          id: string
          team_id: string
          number: string | null
          first_name: string
          last_name: string
          jersey_size: string | null
          birth_date: string | null
          email: string | null
          phone: string | null
          parent_name: string | null
          parent_email: string | null
          parent_phone: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          photo_url: string | null
          bats: string | null
          throws: string | null
          school: string | null
          primary_position: string | null
          preferred_positions: string[] | null
          notes: string | null
          active: boolean
          available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          number?: string | null
          first_name: string
          last_name: string
          jersey_size?: string | null
          birth_date?: string | null
          email?: string | null
          phone?: string | null
          parent_name?: string | null
          parent_email?: string | null
          parent_phone?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          photo_url?: string | null
          bats?: string | null
          throws?: string | null
          school?: string | null
          primary_position?: string | null
          preferred_positions?: string[] | null
          notes?: string | null
          active?: boolean
          available?: boolean  // Optional in Insert since it has a default
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          number?: string | null
          first_name?: string
          last_name?: string
          jersey_size?: string | null
          birth_date?: string | null
          email?: string | null
          phone?: string | null
          parent_name?: string | null
          parent_email?: string | null
          parent_phone?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          photo_url?: string | null
          bats?: string | null
          throws?: string | null
          school?: string | null
          primary_position?: string | null
          preferred_positions?: string[] | null
          notes?: string | null
          active?: boolean
          available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      coach_profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          display_name: string | null
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      coach_teams: {
        Row: {
          id: string
          coach_id: string
          team_id: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          team_id: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          team_id?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      coach_settings: {
        Row: {
          id: string
          coach_id: string
          theme: string
          default_game_duration: string | null
          preferred_printer_type: string | null
          current_page_state: Json | null
          additional_settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          theme?: string
          default_game_duration?: string | null
          preferred_printer_type?: string | null
          current_page_state?: Json | null
          additional_settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          theme?: string
          default_game_duration?: string | null
          preferred_printer_type?: string | null
          current_page_state?: Json | null
          additional_settings?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      coach_invitations: {
        Row: {
          id: string
          team_id: string
          invited_email: string
          invited_by: string
          role: string
          expires_at: string
          accepted_at: string | null
          created_at: string
          status: string
        }
        Insert: {
          id?: string
          team_id: string
          invited_email: string
          invited_by: string
          role?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
          status?: string
        }
        Update: {
          id?: string
          team_id?: string
          invited_email?: string
          invited_by?: string
          role?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
          status?: string
        }
      }
      games: {
        Row: {
          id: string
          team_id: string
          opponent: string | null
          game_date: string
          location: string | null
          game_type: string | null
          notes: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          opponent?: string | null
          game_date: string
          location?: string | null
          game_type?: string | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          opponent?: string | null
          game_date?: string
          location?: string | null
          game_type?: string | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      game_lineups: {
        Row: {
          id: string
          game_id: string
          player_id: string
          position: string | null
          batting_order: number | null
          inning: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          player_id: string
          position?: string | null
          batting_order?: number | null
          inning?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          player_id?: string
          position?: string | null
          batting_order?: number | null
          inning?: number
          created_at?: string
          updated_at?: string
        }
      }
      game_player_availability: {
        Row: {
          id: string
          game_id: string
          player_id: string
          is_available: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          player_id: string
          is_available?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          player_id?: string
          is_available?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      game_highlights: {
        Row: {
          id: string
          game_id: string
          timestamp: string
          description: string
          player_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          timestamp: string
          description: string
          player_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          timestamp?: string
          description?: string
          player_id?: string | null
          created_at?: string
        }
      }
      game_substitutes: {
        Row: {
          id: string
          game_id: string
          team_id: string
          substitutes: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          team_id: string
          substitutes: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          team_id?: string
          substitutes?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
