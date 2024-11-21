'use client';

import React from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Player } from '@/types/player';
import { Position, STANDARD_POSITIONS } from '@/types/lineup';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface LineupSlot {
  id: string;
  playerId: string;
  position: Position | null;
  battingOrder?: number;
}

interface DroppableLineupProps {
  lineup: LineupSlot[];
  roster: Player[];
  onPositionChange: (slotId: string, position: Position) => void;
  onRemove: (slotId: string) => void;
  _onReorder: (newLineup: LineupSlot[]) => void;
  isOver?: boolean;
  activeId?: string | null;
  overId: string | null;
  conflictingPositions?: Position[];
}

interface DroppableLineupItemProps {
  slot: LineupSlot;
  player: Player;
  index: number;
  onPositionChange: (slotId: string, position: Position) => void;
  onRemove: (slotId: string) => void;
  isPositionConflicting: boolean;
  overId: string | null;
}

function DroppableLineupItem({
  slot,
  player,
  index,
  onPositionChange,
  onRemove,
  isPositionConflicting,
  overId,
}: DroppableLineupItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: slot.id,
    data: {
      type: 'lineup',
      index,
      playerId: player.id,
    },
  });

  const style = transform ? {
    transform: CSS.Transform.toString(transform),
    transition,
  } : undefined;

  return (
    <div className="relative">
      {/* Drop indicator */}
      <div
        className={cn(
          "absolute inset-x-0 -top-2 h-2 -mt-1 rounded transition-colors",
          overId === slot.id && "bg-primary/20"
        )}
      />

      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "relative flex items-center gap-2 p-2 rounded-lg border bg-card text-card-foreground",
          isDragging && "opacity-50",
          isPositionConflicting && "border-destructive"
        )}
        {...attributes}
        {...listeners}
      >
        <div className="flex-1">
          <div className="font-medium">{player.firstName} {player.lastName}</div>
          <div className="text-sm text-muted-foreground">#{player.number}</div>
        </div>

        <div className="flex items-center gap-1">
          {/* Position buttons */}
          {STANDARD_POSITIONS.map((pos) => (
            <Button
              key={pos}
              size="sm"
              variant={slot.position === pos ? "default" : "outline"}
              onClick={() => onPositionChange(slot.id, pos as Position)}
              className="w-8 h-8 p-0 text-xs font-medium"
            >
              {pos}
            </Button>
          ))}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(slot.id)}
            className="text-muted-foreground hover:text-destructive ml-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface DroppableEndPositionProps {
  index: number;
  overId: string | null;
}

function DroppableEndPosition({ index, overId }: DroppableEndPositionProps) {
  const id = `lineup-end`;
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: 'lineup',
      index
    }
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-2 rounded transition-colors",
        overId === id && "bg-primary/20"
      )}
    />
  );
}

export function DroppableLineup({
  lineup,
  roster,
  onPositionChange,
  onRemove,
  _onReorder,
  isOver,
  activeId,
  overId,
  conflictingPositions = [],
}: DroppableLineupProps) {
  const { setNodeRef } = useDroppable({
    id: 'lineup',
    data: {
      type: 'lineup',
      index: lineup.length
    }
  });

  const items = lineup.map(slot => slot.id);

  return (
    <Card className="p-4">
      <h2 className="font-semibold mb-4">Lineup</h2>
      <div
        ref={setNodeRef}
        className={cn(
          "space-y-2 min-h-[200px] rounded-lg transition-colors p-2",
          isOver && !activeId?.startsWith('lineup-') && "bg-primary/5 ring-2 ring-primary ring-inset",
          "relative"
        )}
      >
        {/* Empty state */}
        {lineup.length === 0 && (
          <div
            className={cn(
              "h-[100px] flex items-center justify-center rounded-lg border-2 border-dashed",
              isOver ? "border-primary bg-primary/5" : "border-muted",
              "transition-colors duration-200"
            )}
          >
            <div className="text-sm text-muted-foreground">
              Drag players here to add to lineup
            </div>
          </div>
        )}

        {/* Lineup items */}
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {lineup.map((slot, index) => {
              const player = roster.find(p => p.id === slot.playerId);
              if (!player) return null;

              return (
                <DroppableLineupItem
                  key={slot.id}
                  slot={slot}
                  player={player}
                  index={index}
                  onPositionChange={onPositionChange}
                  onRemove={onRemove}
                  isPositionConflicting={conflictingPositions?.includes(slot.position as Position) ?? false}
                  overId={overId}
                />
              );
            })}

            {/* Last position droppable */}
            {lineup.length > 0 && (
              <DroppableEndPosition
                index={lineup.length}
                overId={overId}
              />
            )}
          </div>
        </SortableContext>
      </div>
    </Card>
  );
}
