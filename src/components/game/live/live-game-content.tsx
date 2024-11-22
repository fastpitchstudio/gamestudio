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
import type { 
  Game, 
  Player, 
  GameLineup,
  Team,
  InsertGameLineup
} from '@/lib/types/supabase';

interface GameWithLineups extends Game {
  game_lineups?: GameLineup[];
}

interface LiveGameContentProps {
  team: Team;
  initialGame: GameWithLineups | null;
  initialPlayers: Player[];
}

export default function LiveGameContent({ 
  team,
  initialGame,
  initialPlayers 
}: LiveGameContentProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [game, setGame] = useState<GameWithLineups | null>(initialGame);
  const [error, setError] = useState<string | null>(null);

  // Convert game lineups to our app's format
  const initialLineup = game?.game_lineups?.map(gl => {
    if (!gl.lineup || !Array.isArray(gl.lineup)) {
      console.warn('Invalid lineup data:', gl.lineup);
      return [];
    }
    return gl.lineup.map(lineupEntry => {
      if (!lineupEntry || typeof lineupEntry !== 'object') {
        console.warn('Invalid lineup entry:', lineupEntry);
        return null;
      }
      // Access the nested playerId
      const playerId = lineupEntry.playerId?.playerId;
      if (!playerId) {
        console.warn('No player ID found in lineup entry:', lineupEntry);
        return null;
      }
      const player = initialPlayers?.find(p => p.id === playerId);
      if (!player) {
        console.warn(`Player not found for ID: ${playerId}`);
        return null;
      }
      return {
        id: lineupEntry.id,
        player,
        position: player?.primary_position || player?.preferred_positions?.[0] || undefined,
        battingOrder: lineupEntry.battingOrder,
      };
    });
  }).flat().filter(Boolean) || [];

  // Handle lineup changes
  const handleLineupChange = async (lineup: LineupSlot[]) => {
    if (!game) return;

    try {
      // Convert lineup slots to database format
      const gameLineups: InsertGameLineup[] = lineup.map(slot => ({
        game_id: game.id,
        player_id: slot.player.id,
        position: slot.position || null,
        batting_order: slot.battingOrder,
        inning: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
          game_lineups (
            id,
            player_id,
            batting_order,
            position,
            inning
          )
        `)
        .eq('id', game.id)
        .single();

      if (refreshError) throw refreshError;
      setGame(updatedGame as GameWithLineups);
      
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
          table: 'games',
          filter: `id=eq.${game.id}`,
        },
        (payload) => {
          console.log('Game updated:', payload);
          setGame(payload.new as GameWithLineups);
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
              gameId={game?.id || ''}
              teamId={team.id}
              players={initialPlayers}
              previousGames={[]}
              initialLineup={initialLineup}
              onLineupChange={handleLineupChange}
            />
          </TabsContent>
          
          <TabsContent value="roster">
            <RosterView players={initialPlayers} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}