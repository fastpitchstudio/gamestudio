// src/app/teams/[id]/live/page.tsx
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2 } from 'lucide-react'
import { getInitialTeam } from '../actions'
import LiveGameContent from '@/components/game/live/live-game-content'
import type { Database } from '@/lib/types/database-types'
import type { Game, Player, GameLineup } from '@/lib/types/supabase'

type Params = Promise<{ id: string }>;

interface SearchParams {
  game?: string;
}

export interface GameWithLineups extends Game {
  game_lineups?: GameLineup[];
}

export default async function TeamLivePage({ 
  params,
  searchParams 
}: { 
  params: Params;
  searchParams: SearchParams;
}) {
  // Await params before use
  const { id } = await params;
  const team = await getInitialTeam(id);

  // Get current game data if game ID is provided
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });

  let currentGame: GameWithLineups | null = null;
  if (searchParams.game) {
    const { data } = await supabase
      .from('games')
      .select(`
        *,
        game_lineups (
          id,
          player_id,
          batting_order,
          position,
          inning
        )
      `)
      .eq('id', searchParams.game)
      .eq('team_id', id)
      .single();

    if (data) {
      currentGame = data as GameWithLineups;
    }
  }

  // Load team roster
  const { data: players } = await supabase
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
          initialPlayers={players || []}
        />
      </Suspense>
    </div>
  );
}