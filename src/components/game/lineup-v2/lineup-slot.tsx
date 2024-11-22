'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { PositionButton } from './position-button';
import { 
  LineupSlot as LineupSlotType,
  Position,
  STANDARD_POSITIONS,
  SPECIAL_POSITIONS
} from '@/types/lineup';
import { Player } from '@/types/player';

interface LineupSlotProps {
  slot: LineupSlotType;
  player: Player;
  hasPositionConflict?: boolean;
  onPositionChange: (slotId: string, position: Position | null) => void;
  onRemove: (slotId: string) => void;
}

export function LineupSlot({ 
  slot, 
  player,
  hasPositionConflict = false,
  onPositionChange,
  onRemove 
}: LineupSlotProps) {
  const firstName = player.firstName || '';
  const lastName = player.lastName || '';
  const primaryPosition = player.primaryPosition || '';
  const number = player.number || '';

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
      slot,
      player: {
        ...player,
        firstName,
        lastName,
        primaryPosition,
      },
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        relative p-4 select-none
        ${isDragging ? 'opacity-50 shadow-lg ring-2 ring-blue-500' : ''}
        ${hasPositionConflict ? 'ring-2 ring-red-500' : ''}
      `}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full shrink-0">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            #{slot.battingOrder}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
            {firstName} {lastName}
          </p>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {number ? `#${number} • ` : ''}{primaryPosition || 'No position'}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {STANDARD_POSITIONS.map((position) => (
              <PositionButton
                key={position}
                currentPosition={slot.position}
                position={position}
                onPositionChange={(pos) => onPositionChange(slot.id, pos)}
                hasConflict={hasPositionConflict}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {SPECIAL_POSITIONS.map((position) => (
              <PositionButton
                key={position}
                currentPosition={slot.position}
                position={position}
                onPositionChange={(pos) => onPositionChange(slot.id, pos)}
                hasConflict={hasPositionConflict}
                isSpecial
              />
            ))}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-gray-400 hover:text-gray-500"
          onClick={() => onRemove(slot.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
