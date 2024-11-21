import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { LineupSlot, SubstitutePlayer, PlayerAvailability } from '@/types/lineup';
import { Player, PlayerSchema, transformPlayerFromSchema } from '@/types/player';
import debounce from 'lodash/debounce';
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

  // Create a debounced save function for auto-saving
  const debouncedSave = useCallback(
    debounce(async (data: { 
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
        const { error: lineupError } = await supabase
          .from('game_lineups')
          .upsert({
            game_id: gameId,
            team_id: teamId,
            lineup: data.lineup || lineup,
            substitutes: data.substitutes || substitutes,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (lineupError) {
          const errorDetails = {
            message: lineupError.message,
            details: lineupError.details,
            code: lineupError.code,
            hint: lineupError.hint
          };
          console.error('Error saving lineup:', errorDetails);
          throw new Error(JSON.stringify(errorDetails));
        }

        // Save player availability
        if (data.availability) {
          const availabilityUpdates = data.availability.map(a => ({
            game_id: gameId,
            player_id: a.playerId,
            is_available: a.isAvailable,
            notes: a.notes || null,
            updated_at: new Date().toISOString(),
          }));

          const { error: availabilityError } = await supabase
            .from('game_player_availability')
            .upsert(availabilityUpdates)
            .select();

          if (availabilityError) {
            const errorDetails = {
              message: availabilityError.message,
              details: availabilityError.details,
              code: availabilityError.code,
              hint: availabilityError.hint
            };
            console.error('Error saving availability:', errorDetails);
            throw new Error(JSON.stringify(errorDetails));
          }
        }
        
        // Clear pending changes after successful save
        pendingChanges.current.clear();
        setHasPendingChanges(false);
      } catch (error) {
        console.error('Error saving lineup:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          type: typeof error
        });
        toast.error('Failed to save lineup changes');
        // Revert optimistic updates on error
        loadGameState();
      } finally {
        setIsSaving(false);
      }
    }, autoSaveDelay),
    [gameId, teamId, lineup, substitutes]
  );

  // Cancel any pending saves when unmounting
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

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
    
    debouncedSave({ lineup: newLineup });
  }, [gameId, debouncedSave]);

  const updateSubstitutes = useCallback((newSubstitutes: SubstitutePlayer[]) => {
    console.log('Updating substitutes:', newSubstitutes);
    setSubstitutes(newSubstitutes);
    setHasPendingChanges(true);
    pendingChanges.current.add('substitutes');
    
    if (gameId === 'new') {
      console.log('New game - updating local state only');
      return;
    }
    
    debouncedSave({ substitutes: newSubstitutes });
  }, [gameId, debouncedSave]);

  const updatePlayerAvailability = useCallback((newAvailability: PlayerAvailability[]) => {
    console.log('Updating player availability:', newAvailability);
    setAvailability(newAvailability);
    setHasPendingChanges(true);
    pendingChanges.current.add('availability');
    
    if (gameId === 'new') {
      console.log('New game - updating local state only');
      return;
    }
    
    debouncedSave({ availability: newAvailability });
  }, [gameId, debouncedSave]);

  const loadGameState = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First, load the team roster
      const rosterResponse = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .order('number');

      if (rosterResponse.error) {
        console.error('Error loading roster:', rosterResponse.error);
        setError(new Error(`Failed to load team roster: ${rosterResponse.error.message}`));
        return;
      }

      // Log the raw data from database
      console.log('Raw roster data from DB:', rosterResponse.data);

      // Transform the data to match our interface
      const transformedRoster = (rosterResponse.data as PlayerSchema[]).map(transformPlayerFromSchema);

      console.log('Transformed roster:', transformedRoster);

      setRoster(transformedRoster);

      // For new games, initialize empty state after loading roster
      if (gameId === 'new') {
        console.log('Initializing empty lineup for new game');
        setLineup([]);
        setSubstitutes([]);
        setAvailability([]);
        setHasPendingChanges(false);
        pendingChanges.current.clear();
        setIsLoading(false);
        return;
      }

      // Then load lineup data for existing games
      const lineupResponse = await supabase
        .from('game_lineups')
        .select('*')
        .eq('game_id', gameId)
        .eq('team_id', teamId)
        .single();

      console.log('Lineup response:', {
        data: lineupResponse.data,
        error: lineupResponse.error,
        status: lineupResponse.status,
        statusText: lineupResponse.statusText,
        count: lineupResponse.count
      });

      const { data: lineupData, error: lineupError } = lineupResponse;

      // For new games, lineupError will be { code: 'PGRST116' } which is "no rows returned"
      // This is not a real error for us, just means we need to create a new lineup
      if (lineupError) {
        console.log('Lineup error details:', {
          error: lineupError,
          code: lineupError.code,
          message: lineupError.message,
        });
        
        if (lineupError.code !== 'PGRST116') {
          const errorMessage = `Failed to load lineup data: ${lineupError.message || 'Unknown error'}`;
          console.error(errorMessage, {
            error: lineupError,
            gameId,
            teamId,
          });
          setError(new Error(errorMessage));
          return;
        } else {
          console.log('No lineup found - initializing new lineup');
          // Initialize empty lineup
          setLineup([]);
          setSubstitutes([]);
        }
      } else if (lineupData) {
        console.log('Found existing lineup:', {
          id: lineupData.id,
          gameId: lineupData.game_id,
          teamId: lineupData.team_id,
          lineupCount: lineupData.lineup?.length || 0,
          subsCount: lineupData.substitutes?.length || 0
        });
        setLineup(lineupData.lineup || []);
        setSubstitutes(lineupData.substitutes || []);
      }

      // Load player availability
      const availabilityResponse = await supabase
        .from('game_player_availability')
        .select(`
          id,
          game_id,
          player_id,
          is_available,
          notes
        `)
        .eq('game_id', gameId);

      const { data: availabilityData, error: availabilityError } = availabilityResponse;

      if (availabilityError) {
        const errorMessage = `Failed to load player availability: ${availabilityError.message || 'Unknown error'}`;
        console.error(errorMessage, {
          error: availabilityError,
          gameId,
        });
        setError(new Error(errorMessage));
        return;
      }

      // Convert availability data to app format
      const formattedAvailability = (availabilityData || []).map(entry => ({
        id: entry.id,
        playerId: entry.player_id,
        isAvailable: entry.is_available,
        notes: entry.notes,
      }));

      setAvailability(formattedAvailability);

    } catch (error) {
      const errorMessage = 'Failed to load lineup data: Unexpected error';
      console.error(errorMessage, {
        error,
        gameId,
        teamId
      });
      setError(error instanceof Error ? error : new Error(errorMessage));
      // Initialize empty state on error
      setLineup([]);
      setSubstitutes([]);
      setAvailability([]);
    } finally {
      setIsLoading(false);
    }
  }, [gameId, teamId, supabase]);

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

  // Load initial game state
  useEffect(() => {
    loadGameState();
  }, [loadGameState]);

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
    loadGameState,
  };
};
