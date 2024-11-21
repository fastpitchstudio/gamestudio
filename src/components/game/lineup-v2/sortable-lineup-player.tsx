import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Player } from '@/types/player';
import { Position } from '@/types/lineup';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
] as const;

interface SortableLineupPlayerProps {
  slot: {
    id: string;
    position: Position | null;
  };
  player: Player;
  index: number;
  onPositionChange: (slotId: string, position: Position) => void;
  onRemove: (slotId: string) => void;
  isPositionConflicting: boolean;
}

export function SortableLineupPlayer({
  slot,
  player,
  index,
  onPositionChange,
  onRemove,
  isPositionConflicting,
}: SortableLineupPlayerProps) {
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative flex items-center gap-2 p-2 rounded-lg border bg-card text-card-foreground",
        isDragging && "shadow-lg",
        isPositionConflicting && "border-destructive",
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
  );
}
