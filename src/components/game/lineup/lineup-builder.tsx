// src/components/game/lineup/lineup-builder.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export interface Player {
  id: string;
  number: string;
  first_name: string;
  last_name: string;
  preferred_positions?: string[];
  primary_position?: string;
}

export interface LineupSlot {
  id: string;
  order: number;
  position?: string | null;
  player?: Player;
}

interface LineupBuilderProps {
  players: Player[];
  initialLineup?: LineupSlot[];
  onLineupChange?: (lineup: LineupSlot[]) => void;
}

// Utility function to generate unique IDs
const generateUniqueId = () => crypto.randomUUID();

// Component to render a single lineup slot
function SortableLineupSlot({ 
  slot, 
  onPositionChange,
  onRemove 
}: { 
  slot: LineupSlot;
  onPositionChange: (position: string) => void;
  onRemove: () => void;
}) {
  const positions = slot.player?.preferred_positions || [];
  const defaultPositions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
  const availablePositions = [...new Set([...positions, ...defaultPositions])];

  return (
    <Card className="p-2 mb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm w-6 text-center">{slot.order}</span>
          {slot.player ? (
            <>
              <span className="font-mono text-sm">#{slot.player.number}</span>
              <span>{slot.player.first_name} {slot.player.last_name}</span>
            </>
          ) : (
            <span className="text-gray-400">Empty Slot</span>
          )}
        </div>
        {slot.player && (
          <div className="flex items-center gap-2">
            <select
              className="text-sm border rounded px-2 py-1"
              value={slot.position || ''}
              onChange={(e) => onPositionChange(e.target.value)}
            >
              <option value="">Position</option>
              {availablePositions.map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
            <button
              onClick={onRemove}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function LineupBuilder({
  players,
  initialLineup,
  onLineupChange
}: LineupBuilderProps) {
  // Initialize lineup with 9 empty slots or provided lineup
  const [lineup, setLineup] = useState<LineupSlot[]>(() => {
    if (initialLineup?.length) {
      return initialLineup.map((slot, index) => ({
        ...slot,
        order: index + 1
      }));
    }
    return Array.from({ length: 9 }, (_, i) => ({
      id: generateUniqueId(),
      order: i + 1
    }));
  });

  // Track available players (those not in lineup)
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);

  // Track players being processed to prevent double-clicks
  const [processingPlayers, setProcessingPlayers] = useState<Set<string>>(new Set());

  // Update available players when lineup changes
  useEffect(() => {
    const usedPlayerIds = new Set(lineup.map(slot => slot.player?.id).filter(Boolean));
    setAvailablePlayers(players.filter(player => !usedPlayerIds.has(player.id)));
  }, [players, lineup]);

  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    setLineup((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      
      if (oldIndex === -1 || newIndex === -1) return items;
      
      const newLineup = arrayMove(items, oldIndex, newIndex).map((slot, index) => ({
        ...slot,
        order: index + 1
      }));

      if (onLineupChange) {
        onLineupChange(newLineup);
      }
      
      return newLineup;
    });
  };

  // Handle adding a player to the lineup
  const handleAddPlayer = async (player: Player) => {
    // Prevent double-clicks
    if (processingPlayers.has(player.id)) return;
    
    try {
      setProcessingPlayers(prev => new Set(prev).add(player.id));
      
      setLineup(prev => {
        // Find the first empty slot or create a new one
        const emptySlotIndex = prev.findIndex(slot => !slot.player);
        let newLineup;

        if (emptySlotIndex === -1) {
          // No empty slot found, add a new one
          newLineup = [...prev, {
            id: generateUniqueId(),
            order: prev.length + 1,
            player,
            position: player.primary_position || null
          }];
        } else {
          // Update the empty slot
          newLineup = prev.map((slot, index) => 
            index === emptySlotIndex 
              ? { ...slot, player, position: player.primary_position || null }
              : slot
          );
        }

        // Update batting orders to be consecutive
        newLineup = newLineup.map((slot, index) => ({
          ...slot,
          order: index + 1
        }));

        if (onLineupChange) {
          onLineupChange(newLineup);
        }

        return newLineup;
      });
    } finally {
      // Remove player from processing set after a short delay
      setTimeout(() => {
        setProcessingPlayers(prev => {
          const next = new Set(prev);
          next.delete(player.id);
          return next;
        });
      }, 500);
    }
  };

  // Handle removing a player from the lineup
  const handleRemovePlayer = async (slotId: string) => {
    setLineup(prev => {
      // Get the slot we're removing
      const slotIndex = prev.findIndex(slot => slot.id === slotId);
      if (slotIndex === -1) return prev;

      let newLineup;
      if (slotIndex >= 9) {
        // Remove the slot entirely if it's beyond the initial 9
        newLineup = prev.filter((_, index) => index !== slotIndex);
      } else {
        // Just clear the player from the slot if it's in the initial 9
        newLineup = prev.map((slot, index) => 
          index === slotIndex ? { ...slot, player: undefined, position: undefined } : slot
        );
      }

      // Update batting orders to be consecutive
      newLineup = newLineup.map((slot, index) => ({
        ...slot,
        order: index + 1
      }));

      if (onLineupChange) {
        onLineupChange(newLineup);
      }

      return newLineup;
    });
  };

  // Handle position change
  const handlePositionChange = (slotId: string, position: string) => {
    setLineup(prev => {
      const newLineup = prev.map(slot => {
        if (slot.id === slotId) {
          return { ...slot, position };
        }
        return slot;
      });

      if (onLineupChange) {
        onLineupChange(newLineup);
      }

      return newLineup;
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h3 className="font-semibold mb-2">Lineup</h3>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={lineup}
            strategy={verticalListSortingStrategy}
          >
            {lineup.map((slot) => (
              <SortableLineupSlot
                key={slot.id}
                slot={slot}
                onPositionChange={(pos) => handlePositionChange(slot.id, pos)}
                onRemove={() => handleRemovePlayer(slot.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            setLineup(prev => {
              // Only add a new slot if there are no empty slots
              const hasEmptySlot = prev.some(slot => !slot.player);
              if (hasEmptySlot) {
                return prev; // Don't add a new slot if there's an empty one
              }
              
              // Add new slot with next consecutive order
              const newSlot = {
                id: generateUniqueId(),
                order: prev.length + 1,
                position: null,
                player: undefined
              };
              
              const newLineup = [...prev, newSlot];
              
              if (onLineupChange) {
                onLineupChange(newLineup);
              }
              return newLineup;
            });
          }}
          className="mt-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Slot
        </Button>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Available Players</h3>
        <div className="space-y-2">
          {availablePlayers.map((player) => (
            <Card
              key={player.id}
              className={`p-2 cursor-pointer transition-colors ${
                processingPlayers.has(player.id) 
                  ? 'bg-gray-100 cursor-not-allowed' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => !processingPlayers.has(player.id) && handleAddPlayer(player)}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">#{player.number}</span>
                <span>{player.first_name} {player.last_name}</span>
                {player.primary_position && (
                  <span className="text-sm text-gray-500">({player.primary_position})</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}