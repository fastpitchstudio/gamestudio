// src/app/teams/[id]/live/page.tsx
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2 } from 'lucide-react';
import { getInitialTeam } from '../actions';
import LiveGameContent from '@/components/game/live/live-game-content';
import type { Database } from '@/lib/types/database-types';
import type { Game, GameLineup } from '@/lib/types/supabase';

/***********************
// Next.js 15+ Dynamic Route Params Handling
// Params must be treated as a Promise and awaited before use
// This ensures proper TypeScript checks and runtime behavior
***********************/
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export interface GameWithLineups extends Game {
  game_lineups?: GameLineup[];
  homeTeamName: string;
  awayTeamName: string;
}

export default async function TeamLivePage({ 
  params,
  searchParams 
}: PageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const searchParamsResolved = await searchParams;
  const gameId = typeof searchParamsResolved.game === 'string' ? searchParamsResolved.game : undefined;
  
  // Then handle Supabase client
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Authentication required');
  }

  const team = await getInitialTeam(id);
  if (!team) {
    throw new Error('Team not found');
  }
  
  // Try to find active game first
  let currentGame: GameWithLineups | null = null;

  // First check for game in URL
  if (gameId) {
    const { data } = await supabase
      .from('games')
      .select(`
        *,
        game_lineups (
          id,
          game_id,
          player_id,
          position,
          batting_order,
          inning,
          created_at,
          updated_at
        )
      `)
      .eq('id', gameId)
      .eq('team_id', id)
      .single();

    if (data) {
      currentGame = {
        ...data,
        game_lineups: data.game_lineups || [],
        homeTeamName: team.name,
        awayTeamName: data.opponent || 'TBD'
      };
    }
  }

  // If no game in URL, look for most recent active game
  if (!currentGame) {
    const { data } = await supabase
      .from('games')
      .select(`
        *,
        game_lineups (
          id,
          game_id,
          player_id,
          position,
          batting_order,
          inning,
          created_at,
          updated_at
        )
      `)
      .eq('team_id', id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      currentGame = {
        ...data,
        game_lineups: data.game_lineups || [],
        homeTeamName: team.name,
        awayTeamName: data.opponent || 'TBD'
      };
    }
  }

  // Load team roster
  const { data: rosterData } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', id)
    .eq('active', true)
    .order('number');

  return (
    <div className="container mx-auto p-6">
      <Suspense 
        fallback={
          <div className="flex items-center justify-center h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }
      >
        <LiveGameContent 
          team={team}
          initialGame={currentGame}
          initialPlayers={rosterData || []}
        />
      </Suspense>
    </div>
  );
}