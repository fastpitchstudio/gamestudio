import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Player } from '@/types/player';

interface SortablePlayerProps {
  player: Player;
  isDragging?: boolean;
}

export function SortablePlayer({ player, isDragging }: SortablePlayerProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: player.id });

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
        "p-2 rounded-lg border bg-card text-card-foreground shadow-sm transition-colors duration-200 cursor-grab active:cursor-grabbing",
        isDragging && "ring-2 ring-primary opacity-50"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="font-medium">
            {player.firstName} {player.lastName}
          </div>
          <div className="text-sm text-muted-foreground">
            #{player.number}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {player.primaryPosition}
        </div>
      </div>
    </div>
  );
}
