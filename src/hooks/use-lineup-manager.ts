import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { LineupSlot, SubstitutePlayer, PlayerAvailability, toPosition } from '@/types/lineup';
import { Player, transformPlayerFromSchema } from '@/types/player';
import { debounce } from 'lodash';
import { createClient } from '@/lib/supabase/client';

interface UseLineupManagerProps {
  gameId: string;
  teamId: string;
  autoSaveDelay?: number;
}

export const useLineupManager = ({ 
  gameId, 
  teamId, 
  autoSaveDelay = 2000 
}: UseLineupManagerProps) => {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [roster, setRoster] = useState<Player[]>([]);
  const [lineup, setLineup] = useState<LineupSlot[]>([]);
  const [substitutes, setSubstitutes] = useState<SubstitutePlayer[]>([]);
  const [availability, setAvailability] = useState<PlayerAvailability[]>([]);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Keep track of pending changes for optimistic updates
  const pendingChanges = useRef(new Set<string>());
  const currentTeamId = useRef<string>(teamId);
  
  // Reset state when team changes
  useEffect(() => {
    if (currentTeamId.current !== teamId) {
      console.log('Team changed, resetting state:', {
        from: currentTeamId.current,
        to: teamId
      });
      setRoster([]);
      setLineup([]);
      setSubstitutes([]);
      setAvailability([]);
      setError(null);
      currentTeamId.current = teamId;
    }
  }, [teamId]);

  const saveData = useCallback(async (data: { 
    lineup?: LineupSlot[], 
    substitutes?: SubstitutePlayer[], 
    availability?: PlayerAvailability[] 
  }) => {
    try {
      setIsSaving(true);
      console.log('Saving lineup data:', {
        gameId,
        teamId,
        lineupLength: data.lineup?.length || lineup.length,
        subsLength: data.substitutes?.length || substitutes.length
      });

      // For new games, just update local state immediately
      if (gameId === 'new') {
        console.log('Updating local state for new game');
        if (data.lineup) setLineup(data.lineup);
        if (data.substitutes) setSubstitutes(data.substitutes);
        if (data.availability) setAvailability(data.availability);
        setHasPendingChanges(false);
        setIsSaving(false);
        return;
      }

      // Save lineup and substitutes
      if (data.lineup) {
        // First, delete existing lineup entries for this game and inning
        const { error: deleteError } = await supabase
          .from('game_lineups')
          .delete()
          .eq('game_id', gameId)
          .eq('inning', 1); // Default to first inning

        if (deleteError) throw deleteError;

        // Then insert new lineup entries
        const lineupEntries = data.lineup.map((slot: LineupSlot) => ({
          game_id: gameId,
          player_id: slot.player.id,
          position: slot.position,
          batting_order: slot.battingOrder,
          inning: 1, // Default to first inning
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const { error: lineupError } = await supabase
          .from('game_lineups')
          .insert(lineupEntries);

        if (lineupError) throw lineupError;
      }

      // Save substitutes
      if (data.substitutes) {
        // Convert SubstitutePlayer array to a plain object array for JSON storage
        const substitutesJson = data.substitutes.map(sub => ({
          id: sub.id,
          playerId: sub.playerId,
          replacedPlayerId: sub.replacedPlayerId,
          inningNumber: sub.inningNumber
        }));

        const { error: substitutesError } = await supabase
          .from('game_substitutes')
          .upsert({
            game_id: gameId,
            team_id: teamId,
            substitutes: substitutesJson,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (substitutesError) throw substitutesError;
      }

      // Save player availability
      if (data.availability) {
        const { error: availabilityError } = await supabase
          .from('game_player_availability')
          .upsert(
            data.availability.map(a => ({
              game_id: gameId,
              player_id: a.playerId,
              is_available: a.isAvailable,
              notes: a.notes,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }))
          );

        if (availabilityError) throw availabilityError;
      }

      // Update local state
      if (data.lineup) setLineup(data.lineup);
      if (data.substitutes) setSubstitutes(data.substitutes);
      if (data.availability) setAvailability(data.availability);

      setHasPendingChanges(false);
      toast.success('Changes saved');
    } catch (error) {
      console.error('Error saving lineup:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [gameId, teamId, lineup, substitutes, supabase]);

  // Create a debounced save function for auto-saving
  const debouncedSave = useCallback(
    debounce((data: { lineup: LineupSlot[], substitutes: SubstitutePlayer[] }) => saveData(data), autoSaveDelay),
    [saveData, autoSaveDelay]
  );

  useEffect(() => {
    if (lineup && substitutes) {
      debouncedSave({ lineup, substitutes });
    }
  }, [lineup, substitutes, debouncedSave]);

  // Update functions
  const updateLineup = useCallback((newLineup: LineupSlot[]) => {
    console.log('Updating lineup:', newLineup);
    setLineup(newLineup);
    setHasPendingChanges(true);
    pendingChanges.current.add('lineup');
    
    if (gameId === 'new') {
      console.log('New game - updating local state only');
      return;
    }
    
    debouncedSave({ lineup: newLineup, substitutes });
  }, [gameId, debouncedSave, setLineup, setHasPendingChanges, substitutes]);

  const updateSubstitutes = useCallback((newSubstitutes: SubstitutePlayer[]) => {
    console.log('Updating substitutes:', newSubstitutes);
    setSubstitutes(newSubstitutes);
    setHasPendingChanges(true);
    pendingChanges.current.add('substitutes');
    
    if (gameId === 'new') {
      console.log('New game - updating local state only');
      return;
    }
    
    debouncedSave({ lineup, substitutes: newSubstitutes });
  }, [gameId, debouncedSave, setSubstitutes, setHasPendingChanges, lineup]);

  const updatePlayerAvailability = useCallback((newAvailability: PlayerAvailability[]) => {
    console.log('Updating player availability:', newAvailability);
    setAvailability(newAvailability);
    setHasPendingChanges(true);
    pendingChanges.current.add('availability');
    
    if (gameId === 'new') {
      console.log('New game - updating local state only');
      return;
    }
    
    saveData({ availability: newAvailability });
  }, [gameId, saveData, setAvailability, setHasPendingChanges]);

  const loadPreviousLineups = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('game_lineups')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading previous lineups:', error);
      toast.error('Failed to load previous lineups');
      return [];
    }
  }, [teamId, supabase]);

  useEffect(() => {
    const loadGameState = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load roster
        const { data: rosterData, error: rosterError } = await supabase
          .from('players')
          .select('*')
          .eq('team_id', teamId)
          .order('number');

        if (rosterError) throw rosterError;

        const players = rosterData.map(player => transformPlayerFromSchema(player));
        console.log('Loaded roster:', players);
        setRoster(players);

        // For new games, we don't need to load anything else
        if (gameId === 'new') {
          setIsLoading(false);
          return;
        }

        // Load lineup and substitutes
        const { data: lineupData, error: lineupError } = await supabase
          .from('game_lineups')
          .select(`
            *,
            players!inner (
              id,
              first_name,
              last_name,
              number,
              primary_position,
              preferred_positions,
              team_id,
              created_at,
              updated_at
            )
          `)
          .eq('game_id', gameId)
          .eq('team_id', teamId);

        if (lineupError) throw lineupError;

        if (lineupData) {
          // Transform lineup data into LineupSlot array
          const lineupSlots = lineupData.map(entry => {
            const player = entry.players[0];
            return {
              id: entry.id,
              player: {
                id: player.id,
                firstName: player.first_name,
                lastName: player.last_name,
                number: player.number,
                primaryPosition: player.primary_position,
                secondaryPositions: player.preferred_positions,
                teamId: player.team_id,
                createdAt: player.created_at,
                updatedAt: player.updated_at,
              },
              position: toPosition(entry.position),
              battingOrder: entry.batting_order ?? undefined,
              inning: entry.inning
            };
          });
          setLineup(lineupSlots);
        }

        // Load substitutes
        const { data: subsData, error: subsError } = await supabase
          .from('game_substitutes')
          .select('*')
          .eq('game_id', gameId)
          .eq('team_id', teamId)
          .maybeSingle();

        if (subsError) throw subsError;

        if (subsData?.substitutes) {
          try {
            const parsedSubs = JSON.parse(
              typeof subsData.substitutes === 'string' 
                ? subsData.substitutes 
                : JSON.stringify(subsData.substitutes)
            );
            
            // Validate and transform the parsed data
            const validSubs = Array.isArray(parsedSubs) 
              ? parsedSubs.map(sub => ({
                  id: sub.id,
                  playerId: sub.playerId,
                  replacedPlayerId: sub.replacedPlayerId,
                  inningNumber: sub.inningNumber
                }))
              : [];
              
            setSubstitutes(validSubs);
          } catch (error) {
            console.error('Error parsing substitutes:', error);
            setSubstitutes([]);
          }
        }

        // Load player availability
        const { data: availabilityData, error: availabilityError } = await supabase
          .from('game_player_availability')
          .select('*')
          .eq('game_id', gameId);

        if (availabilityError) throw availabilityError;

        const availability = availabilityData.map(a => ({
          playerId: a.player_id,
          isAvailable: a.is_available,
          notes: a.notes
        }));

        setAvailability(availability);
        setHasPendingChanges(false);
      } catch (error) {
        console.error('Error loading game state:', error);
        setError(error instanceof Error ? error : new Error('Failed to load game state'));
        toast.error('Failed to load game state');
      } finally {
        setIsLoading(false);
      }
    };

    loadGameState();
  }, [gameId, teamId, supabase]);

  return {
    isLoading,
    isSaving,
    roster,
    lineup,
    substitutes,
    availability,
    hasPendingChanges,
    error,
    updateLineup,
    updateSubstitutes,
    updatePlayerAvailability,
    loadPreviousLineups,
  };
};
