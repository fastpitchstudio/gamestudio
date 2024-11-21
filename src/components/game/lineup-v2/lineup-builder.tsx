'use client';

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
  useDroppable,
  Modifier,
} from '@dnd-kit/core';
import { useSortable, SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Player } from '@/types/player';
import { useState, useMemo } from 'react';
import { RosterPlayer } from './roster-player';
import { Position, toPosition, isValidPosition } from '@/types/lineup';
import { SubstitutePlayer } from '@/types/lineup';
import { useLineupManager } from '@/hooks/use-lineup-manager';
import { Skeleton } from '@/components/ui/skeleton';
import { DroppableLineup } from './droppable-lineup';

const POSITIONS = [
  'Forward',
  'Midfielder',
  'Defender',
  'Goalkeeper'
] as const;

const STANDARD_POSITIONS = [
  'P',
  'C',
  '1B',
  '2B',
  '3B',
  'SS',
  'LF',
  'CF',
  'RF',
  'DH'
] as const;

interface SortableSubstituteProps {
  substitute: SubstitutePlayer;
  player: Player;
}

interface LineupItem {
  id: string;
  playerId: string;
  position: Position | null;
}

interface SubstituteItem {
  id: string;
  playerId: string;
}

function SortableSubstitute({ substitute, player }: SortableSubstituteProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: substitute.id,
    data: {
      type: 'substitute',
      playerId: player.id,
    },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border bg-card text-card-foreground shadow-sm cursor-move",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex-1">
        <div className="font-medium">
          {player.firstName} {player.lastName}
        </div>
        <div className="text-sm text-muted-foreground">
          #{player.number} • {player.primaryPosition || 'No position'}
        </div>
      </div>
    </div>
  );
}

function SubstitutesList({ 
  substitutes, 
  roster, 
  isOver 
}: { 
  substitutes: SubstituteItem[], 
  roster: Player[], 
  isOver: boolean 
}) {
  const { setNodeRef } = useDroppable({
    id: 'substitutes',
    data: {
      type: 'substitutes'
    }
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "min-h-[100px] rounded-lg p-4",
        "border-2 border-dashed transition-colors duration-200",
        isOver ? "border-primary bg-primary/5" : "border-muted"
      )}
    >
      <SortableContext items={substitutes.map(sub => sub.id)} strategy={verticalListSortingStrategy}>
        {substitutes.map((substitute) => {
          const player = roster.find(p => p.id === substitute.playerId);
          if (!player) return null;
          return (
            <SortableSubstitute
              key={substitute.id}
              substitute={substitute}
              player={player}
            />
          );
        })}
      </SortableContext>

      {substitutes.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Drag players here to add substitutes
        </p>
      )}
    </div>
  );
}

export function LineupBuilder({
  gameId,
  teamId,
}: {
  gameId: string;
  teamId: string;
}) {
  const {
    roster,
    isLoading,
    lineup = [],
    substitutes = [],
    updateLineup,
    updateSubstitutes,
  } = useLineupManager({ gameId, teamId });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Compute conflicting positions
  const conflictingPositions = useMemo(() => {
    const positionCounts = new Map<Position, number>();
    
    lineup.forEach((slot) => {
      if (slot.position) {
        positionCounts.set(slot.position, (positionCounts.get(slot.position) || 0) + 1);
      }
    });
    
    return Array.from(positionCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([position]) => position as Position);
  }, [lineup]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getSourceType = (id: string): string => {
    if (id.startsWith('lineup-')) return 'lineup';
    if (id.startsWith('sub-')) return 'substitutes';
    return 'roster';
  };

const handleDragStart = (event: DragStartEvent) => {
  setActiveId(event.active.id.toString());
};

  const customModifier: Modifier = (args) => {
    const { transform, active, over } = args;

    if (!active || !over) {
      return transform;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (activeId.startsWith('lineup-') && overId.startsWith('lineup-')) {
      return restrictToVerticalAxis(args);
    }

    return transform;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    setOverId(over?.id ? over.id.toString() : null);

    if (!over) return;

    const sourceType = getSourceType(active.id.toString());
    const overType = over.data.current?.type || getSourceType(over.id.toString());

    if (sourceType === 'lineup' && overType === 'lineup') {
      const oldIndex = lineup.findIndex(item => item.id === active.id);
      const newIndex = lineup.findIndex(item => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newLineup = arrayMove(lineup, oldIndex, newIndex);
        updateLineup(newLineup);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const sourceType = getSourceType(active.id.toString());
    const overType = over.data.current?.type || getSourceType(over.id.toString());

    if (sourceType === 'roster') {
      const player = roster.find(p => p.id === active.id);
      if (!player) return;

      if (overType === 'lineup') {
        const newSlot: LineupItem = {
          id: `lineup-${Date.now()}`,
          playerId: player.id,
          position: toPosition(player.primaryPosition),
        };

        if (over.id === 'lineup') {
          updateLineup([...lineup, newSlot]);
        } else {
          const overIndex = lineup.findIndex(item => item.id === over.id);
          if (overIndex !== -1) {
            const newLineup = [...lineup];
            newLineup.splice(overIndex, 0, newSlot);
            updateLineup(newLineup);
          } else {
            updateLineup([...lineup, newSlot]);
          }
        }
      } else if (overType === 'substitutes') {
        const newSub: SubstituteItem = {
          id: `sub-${Date.now()}`,
          playerId: player.id,
        };
        updateSubstitutes([...substitutes, newSub]);
      }
    } else if (sourceType === 'lineup') {
      if (overType === 'substitutes') {
        const lineupItem = lineup.find(item => item.id === active.id);
        if (!lineupItem) return;

        const newSub: SubstituteItem = {
          id: `sub-${Date.now()}`,
          playerId: lineupItem.playerId,
        };
        updateSubstitutes([...substitutes, newSub]);
        updateLineup(lineup.filter(item => item.id !== active.id));
      } else if (overType === 'lineup') {
        const oldIndex = lineup.findIndex(item => item.id === active.id);
        const newIndex = lineup.findIndex(item => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newLineup = arrayMove(lineup, oldIndex, newIndex);
          updateLineup(newLineup);
        }
      }
    } else if (sourceType === 'substitutes') {
      const subItem = substitutes.find(item => item.id === active.id);
      if (!subItem) return;

      if (overType === 'lineup') {
        const newSlot: LineupItem = {
          id: `lineup-${Date.now()}`,
          playerId: subItem.playerId,
          position: toPosition(roster.find(p => p.id === subItem.playerId)?.primaryPosition),
        };

        if (over.id === 'lineup') {
          updateLineup([...lineup, newSlot]);
        } else {
          const overIndex = lineup.findIndex(item => item.id === over.id);
          if (overIndex !== -1) {
            const newLineup = [...lineup];
            newLineup.splice(overIndex, 0, newSlot);
            updateLineup(newLineup);
          } else {
            updateLineup([...lineup, newSlot]);
          }
        }
        updateSubstitutes(substitutes.filter(item => item.id !== active.id));
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  if (isLoading || !roster) {
    return (
      <div className="grid grid-cols-[300px_1fr] gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      modifiers={[customModifier]}
    >
      <div className="grid grid-cols-[1fr_300px] gap-4">
        <div className="space-y-4">
          <DroppableLineup
            lineup={lineup}
            roster={roster}
            onPositionChange={(id, position) => {
              // Handle undefined position by converting to null
              const newLineup = lineup.map(item =>
                item.id === id ? { ...item, position: position ?? null } : item
              );
              updateLineup(newLineup);
            }}
            onRemove={(id) => {
              updateLineup(lineup.filter(slot => slot.id !== id));
            }}
            onReorder={(newLineup) => {
              updateLineup(newLineup);
            }}
            isOver={overId === 'lineup'}
            activeId={activeId}
            overId={overId}
            conflictingPositions={conflictingPositions}
          />

          <Card className="p-4">
            <h2 className="font-semibold mb-2">Substitutes</h2>
            <SubstitutesList
              substitutes={substitutes}
              roster={roster}
              isOver={overId === 'substitutes'}
            />
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4 space-y-2">
            <h2 className="font-semibold">Roster</h2>
            <div className="space-y-2">
              {roster.map((player) => {
                const isInLineup = lineup.some(slot => slot.playerId === player.id);
                const isSubstitute = substitutes.some(sub => sub.playerId === player.id);
                
                if (isInLineup || isSubstitute) return null;

                return (
                  <RosterPlayer
                    key={player.id}
                    player={player}
                    isInLineup={isInLineup}
                    isSubstitute={isSubstitute}
                  />
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="w-[280px] p-2 rounded-lg border bg-card text-card-foreground shadow-lg">
            {(() => {
              let player;
              if (activeId.toString().startsWith('lineup-')) {
                const lineupItem = lineup.find(item => item.id === activeId);
                player = lineupItem ? roster.find(p => p.id === lineupItem.playerId) : null;
              } else if (activeId.toString().startsWith('sub-')) {
                const subItem = substitutes.find(item => item.id === activeId);
                player = subItem ? roster.find(p => p.id === subItem.playerId) : null;
              } else {
                player = roster.find(p => p.id === activeId);
              }

              if (!player) return null;

              return (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="font-medium">{player.firstName} {player.lastName}</div>
                    <div className="text-sm text-muted-foreground">#{player.number}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{player.primaryPosition}</div>
                </div>
              );
            })()}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
