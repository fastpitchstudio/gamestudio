'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { LineupBuilder } from '@/components/game/lineup-v2/lineup-builder';
import RosterView from '@/components/game/roster/roster-view';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlusCircle, Timer, FileDown, Pencil } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import type { LineupSlot } from '@/types/lineup';
import type { Database } from '@/lib/types/database-types';
import type { 
  Game, 
  Player as DbPlayer,  
  Team
} from '@/lib/types/supabase';
import type { Player as FrontendPlayer } from '@/types/player';
import type { Player as RosterPlayer } from '@/lib/types';
import { toPosition } from '@/types/lineup';

// Transform database player to frontend player type
function toFrontendPlayer(dbPlayer: DbPlayer): FrontendPlayer {
  return {
    id: dbPlayer.id,
    firstName: dbPlayer.first_name,
    lastName: dbPlayer.last_name,
    number: dbPlayer.number,
    primaryPosition: dbPlayer.primary_position,
    teamId: dbPlayer.team_id,
    createdAt: dbPlayer.created_at,
    updatedAt: dbPlayer.updated_at
  };
}

// Transform database player to roster player type
function toRosterPlayer(dbPlayer: DbPlayer): RosterPlayer {
  return {
    ...dbPlayer,
    available: dbPlayer.available || false,
    active: dbPlayer.active || false
  };
}

interface GameWithLineups extends Game {
  game_lineups?: Array<{
    id: string;
    game_id: string;
    player_id: string;
    position: string | null;
    batting_order: number | null;
    inning: number;
    created_at: string;
    updated_at: string;
  }>;
  homeTeamName: string;
  awayTeamName: string;
}

interface LiveGameContentProps {
  team: Team;
  initialGame: GameWithLineups | null;
  initialPlayers: DbPlayer[];  
}

export default function LiveGameContent({ 
  team,
  initialGame,
  initialPlayers 
}: LiveGameContentProps) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [game, setGame] = useState<GameWithLineups | null>(initialGame);
  const [error, setError] = useState<string | null>(null);
  
  // Keep two separate states for different player types
  const [frontendPlayers, setFrontendPlayers] = useState<FrontendPlayer[]>(() => 
    initialPlayers.map(toFrontendPlayer)
  );
  const [rosterPlayers, setRosterPlayers] = useState<RosterPlayer[]>(() => 
    initialPlayers.map(toRosterPlayer)
  );
  
  // Convert game lineups to our app's format
  const initialLineup = initialGame?.game_lineups?.map((slot) => {
    if (!slot) return null;
    const converted: LineupSlot = {
      id: slot.id,
      playerId: slot.player_id,
      position: toPosition(slot.position),
      ...(slot.batting_order !== null && { battingOrder: slot.batting_order })
    };
    return converted;
  }).filter((slot): slot is LineupSlot => slot !== null) || [];

  // Handle lineup changes
  const handleLineupChange = async (lineup: LineupSlot[]) => {
    if (!game) return;

    try {
      // Convert lineup slots to database format
      const gameLineups = lineup.map(slot => ({
        id: slot.id,
        game_id: game.id,
        team_id: team.id,
        player_id: slot.playerId,
        position: slot.position,
        batting_order: slot.battingOrder ?? null,
        inning: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Update the game lineups in the database
      const { error: updateError } = await supabase
        .from('game_lineups')
        .upsert(gameLineups, {
          onConflict: 'game_id,player_id,inning'
        });

      if (updateError) throw updateError;

      // Refresh the game data
      const { data: updatedGame, error: refreshError } = await supabase
        .from('games')
        .select(`
          *,
          game_lineups (*)
        `)
        .eq('id', game.id)
        .single();

      if (refreshError) throw refreshError;
      if (updatedGame) {
        setGame({
          ...updatedGame,
          homeTeamName: game.homeTeamName,
          awayTeamName: game.awayTeamName,
          game_lineups: updatedGame.game_lineups || []
        });
      }
    } catch (error) {
      console.error('Error updating lineup:', error);
      setError('Failed to update lineup');
    }
  };

  // Subscribe to game updates
  useEffect(() => {
    if (!game) return;

    const channel = supabase
      .channel(`game_${game.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_lineups',
          filter: `game_id=eq.${game.id}`
        },
        async () => {
          // Refresh game data when lineups change
          const { data: updatedGame, error: refreshError } = await supabase
            .from('games')
            .select(`
              *,
              game_lineups (*)
            `)
            .eq('id', game.id)
            .single();

          if (!refreshError && updatedGame) {
            setGame({
              ...updatedGame,
              homeTeamName: game.homeTeamName,
              awayTeamName: game.awayTeamName,
              game_lineups: updatedGame.game_lineups || []
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [game, supabase]);

  if (!game) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>
            No active game found. Create a new game to get started.
          </AlertDescription>
        </Alert>
        
        <Card className="p-4">
          <Button 
            onClick={() => router.push(`/teams/${team.id}/games/new`)}
            className="w-full"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Create New Game
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {game.homeTeamName} vs {game.awayTeamName}
        </h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Timer className="w-4 h-4 mr-2" />
            Start Game
          </Button>
          <Button variant="outline" size="sm">
            <FileDown className="w-4 h-4 mr-2" />
            Export Lineup
          </Button>
          <Button variant="outline" size="sm">
            <Pencil className="w-4 h-4 mr-2" />
            Edit Game
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="lineup">
          <TabsList>
            <TabsTrigger value="lineup">Lineup</TabsTrigger>
            <TabsTrigger value="roster">Roster</TabsTrigger>
          </TabsList>
          
          <TabsContent value="lineup">
            <LineupBuilder
              gameId={game.id}
              teamId={team.id}
              players={frontendPlayers}
              _previousGames={[]}
              initialLineup={initialLineup}
              onLineupChange={handleLineupChange}
            />
          </TabsContent>
          
          <TabsContent value="roster">
            <RosterView 
              players={rosterPlayers}
              onPlayerAvailabilityChange={async (playerId, available) => {
                try {
                  // Update database
                  const { error: updateError } = await supabase
                    .from('players')
                    .update({ available })
                    .eq('id', playerId);

                  if (updateError) throw updateError;

                  // Get the updated player from database
                  const { data: updatedDbPlayer, error: fetchError } = await supabase
                    .from('players')
                    .select('*')
                    .eq('id', playerId)
                    .single();

                  if (fetchError) throw fetchError;
                  if (!updatedDbPlayer) throw new Error('Player not found');

                  // Update both states
                  setFrontendPlayers(prev => 
                    prev.map(p => p.id === playerId ? toFrontendPlayer(updatedDbPlayer) : p)
                  );
                  setRosterPlayers(prev => 
                    prev.map(p => p.id === playerId ? toRosterPlayer(updatedDbPlayer) : p)
                  );
                } catch (error) {
                  console.error('Error updating player availability:', error);
                  setError('Failed to update player availability');
                }
              }}
              activeLineupPlayerIds={game.game_lineups?.map(gl => gl.player_id) || []}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}