// src/components/game/live/live-game-content.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LineupBuilder from '@/components/game/lineup/lineup-builder';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlusCircle, Timer, FileDown, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import type { Database } from '@/lib/types/database-types';
import type { Team } from '@/lib/types';
import type { GameWithLineups } from '@/app/teams/[id]/live/page';

interface LineupSlot {
  id: string;
  order: number;
  position?: string;
  player?: {
    id: string;
    number: string;
    first_name: string;
    last_name: string;
    preferred_positions?: string[];
  };
}

interface LiveGameContentProps {
  team: Team;
  initialGame: GameWithLineups | null;
  initialPlayers: Array<Database['public']['Tables']['players']['Row']>;
}

export default function LiveGameContent({ 
  team,
  initialGame,
  initialPlayers 
}: LiveGameContentProps) {
  const router = useRouter();
  const [game, setGame] = useState<GameWithLineups | null>(initialGame);
  const [isEditingOpponent, setIsEditingOpponent] = useState(false);
  const [showAvailablePlayers, setShowAvailablePlayers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();

  // Track available players separately from the lineup
  const [availablePlayers, setAvailablePlayers] = useState(() => {
    const initialLineup = initialGame?.game_lineups || [];
    return initialPlayers.filter(player => 
      !initialLineup.some(lineup => lineup.player_id === player.id)
    );
  });

  // Set up real-time subscription for lineup changes
  useEffect(() => {
    if (!game?.id) return;

    const channel = supabase
      .channel('game-lineups')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_lineups',
          filter: `game_id=eq.${game.id}`
        },
        async (payload) => {
          // Reload game data
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
            .eq('id', game.id)
            .single();

          if (data) {
            setGame(data as GameWithLineups);
            // Update available players based on new lineup
            const usedPlayerIds = data.game_lineups?.map(l => l.player_id) || [];
            setAvailablePlayers(initialPlayers.filter(p => 
              !usedPlayerIds.includes(p.id)
            ));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [game?.id, supabase, initialPlayers]);

  // Create a new game
  const createNewGame = async () => {
    try {
      const { data: newGame, error } = await supabase
        .from('games')
        .insert({
          team_id: team.id,
          game_date: new Date().toISOString(),
          status: 'pending'
        })
        .select(`
          *,
          game_lineups (*)
        `)
        .single();

      if (error) throw error;
      setGame(newGame as GameWithLineups);
      setAvailablePlayers(initialPlayers);
      
      // Update URL with game ID
      router.push(`/teams/${team.id}/live?game=${newGame.id}`);
    } catch (err) {
      console.error('Error creating game:', err);
      setError('Failed to create new game');
    }
  };

  // Handle lineup changes
  const handleLineupChange = (lineup: LineupSlot[]) => {
    if (!game) return;

    (async () => {
      try {
        const lineupRecords = lineup
          .filter(slot => slot.player)
          .map((slot, index) => ({
            game_id: game.id,
            player_id: slot.player!.id,
            batting_order: index + 1,
            position: slot.position || null,
            inning: 1
          }));

        // Update available players
        const usedPlayerIds = lineup
          .filter(slot => slot.player)
          .map(slot => slot.player!.id);
        
        setAvailablePlayers(initialPlayers.filter(p => 
          !usedPlayerIds.includes(p.id)
        ));

        // Delete existing lineup for this inning
        await supabase
          .from('game_lineups')
          .delete()
          .eq('game_id', game.id)
          .eq('inning', 1);

        // Insert new lineup
        const { error } = await supabase
          .from('game_lineups')
          .insert(lineupRecords);

        if (error) throw error;
      } catch (err) {
        console.error('Error updating lineup:', err);
        setError('Failed to save lineup changes');
      }
    })();
  };

  // Format initial lineup for the LineupBuilder
  const formatInitialLineup = (): LineupSlot[] | undefined => {
    if (!game?.game_lineups) return undefined;

    const formattedLineup: LineupSlot[] = game.game_lineups
      .filter(lineup => lineup.batting_order !== null)
      .sort((a, b) => (a.batting_order || 0) - (b.batting_order || 0))
      .map(lineup => {
        const player = initialPlayers.find(p => p.id === lineup.player_id);
        if (!player) return null;

        const slot: LineupSlot = {
          id: `slot-${lineup.batting_order}`,
          order: lineup.batting_order || 0,
          position: lineup.position ?? undefined,
          player: {
            id: player.id,
            number: player.number || '',
            first_name: player.first_name,
            last_name: player.last_name,
            preferred_positions: player.preferred_positions || undefined
          }
        };
        return slot;
      })
      .filter((slot): slot is LineupSlot => slot !== null);

    return formattedLineup;
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <h2 className="text-xl font-semibold">Start a New Game</h2>
        <Button onClick={createNewGame}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Create Game
        </Button>
      </div>
    );
  }

  // Format players for lineup builder
  const formattedPlayers = availablePlayers.map(player => ({
    id: player.id,
    number: player.number || '',
    first_name: player.first_name,
    last_name: player.last_name,
    preferred_positions: player.preferred_positions || undefined
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">
            {team.name} vs{' '}
            {isEditingOpponent ? (
              <Input
                autoFocus
                className="w-48 inline-block"
                value={game.opponent ?? ''}
                onBlur={() => setIsEditingOpponent(false)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    setIsEditingOpponent(false);
                  }
                }}
                onChange={async (e) => {
                  const { error } = await supabase
                    .from('games')
                    .update({ opponent: e.target.value })
                    .eq('id', game.id);
                  
                  if (error) {
                    console.error('Error updating opponent:', error);
                    return;
                  }

                  setGame(prev => prev ? {
                    ...prev,
                    opponent: e.target.value
                  } : null);
                }}
              />
            ) : (
              <>
                <span className="text-muted-foreground">
                  {game.opponent || 'Opponent'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsEditingOpponent(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline">
            <Timer className="w-4 h-4 mr-2" />
            {game.status === 'pending' ? 'Start Game' : '00:00'}
          </Button>
          <Button variant="outline">
            <FileDown className="w-4 h-4 mr-2" />
            Print Lineup
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Available Players Panel */}
        <div className={`w-72 flex-shrink-0 transition-all ${showAvailablePlayers ? '' : '-ml-72'}`}>
          <div className="bg-card rounded-lg border p-4 relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute -right-8 top-4"
              onClick={() => setShowAvailablePlayers(!showAvailablePlayers)}
            >
              {showAvailablePlayers ? <ChevronLeft /> : <ChevronRight />}
            </Button>
            <div className="space-y-2">
              <h3 className="font-medium">Available Players</h3>
              <div className="grid gap-2">
                {formattedPlayers.map(player => (
                  <Card 
                    key={player.id}
                    className="p-2 cursor-pointer hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">#{player.number}</span>
                      <span>{player.first_name} {player.last_name}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-4">
              <LineupBuilder
                players={formattedPlayers}
                initialLineup={formatInitialLineup()}
                onLineupChange={handleLineupChange}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Field Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                Field positions view coming soon...
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}