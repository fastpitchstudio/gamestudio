import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STANDARD_POSITIONS } from '@/types/lineup';

interface LineupPlayerProps {
  id: string;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    number: string;
    primaryPosition: string;
  };
  position: string | null;
  battingOrder: number;
  onPositionChange: (position: string) => void;
  onRemove: () => void;
}

export function LineupPlayer({
  id,
  player,
  position,
  battingOrder,
  onPositionChange,
  onRemove,
}: LineupPlayerProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'flex items-center gap-4 p-4 rounded-lg border bg-card',
        isDragging && 'opacity-50 ring-2 ring-primary'
      )}
    >
      <div className="flex-none w-8 h-8 rounded-full bg-primary flex items-center justify-center">
        <span className="text-sm font-bold text-primary-foreground">
          {battingOrder}
        </span>
      </div>

      <div className="flex-1">
        <div className="font-medium">
          {player.firstName} {player.lastName}
        </div>
        <div className="text-sm text-muted-foreground">
          #{player.number} • {player.primaryPosition || 'No position'}
        </div>
      </div>

      <div className="flex-none flex gap-1">
        {STANDARD_POSITIONS.map((pos) => (
          <button
            key={pos}
            onClick={() => onPositionChange(pos)}
            className={cn(
              "w-8 h-8 rounded-full text-xs font-medium border",
              position === pos 
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-secondary-foreground border-secondary hover:bg-secondary/80"
            )}
          >
            {pos}
          </button>
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="flex-none"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
