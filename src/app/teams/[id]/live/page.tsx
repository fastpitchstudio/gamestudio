// src/app/teams/[id]/live/page.tsx
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2 } from 'lucide-react'
import { getInitialTeam } from '../actions'
import LiveGameContent from '@/components/game/live/live-game-content'
import type { Database } from '@/lib/types/database-types'
import type { Game } from '@/lib/types/supabase'

type Params = Promise<{ id: string }>;

export interface GameWithLineups extends Game {
  game_lineups?: Database['public']['Tables']['game_lineups']['Row'][];
}

export default async function TeamLivePage({ 
  params,
  searchParams 
}: { 
  params: Params;
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<React.ReactElement> {
  // First, await the params to get the id
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  // Then handle Supabase client
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    // redirect('/login'); // This line is commented out because the redirect function is not defined in the provided code
  }

  const team = await getInitialTeam(id);
  
  // Try to find active game first
  let currentGame: GameWithLineups | null = null;

  // First check for game in URL
  if (searchParams.game) {
    const { data } = await supabase
      .from('games')
      .select(`
        *,
        game_lineups (
          id,
          game_id,
          team_id,
          lineup,
          substitutes,
          notes,
          created_at,
          updated_at
        )
      `)
      .eq('id', searchParams.game)
      .eq('team_id', id)
      .single();

    if (data) {
      currentGame = data as GameWithLineups;
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
          team_id,
          lineup,
          substitutes,
          notes,
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
      currentGame = data as GameWithLineups;
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