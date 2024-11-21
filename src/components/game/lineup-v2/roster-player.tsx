import { useDraggable } from '@dnd-kit/core';
import { Player } from '@/types/player';
import { cn } from '@/lib/utils';

interface RosterPlayerProps {
  player: Player;
  isInLineup: boolean;
  isSubstitute: boolean;
}

export function RosterPlayer({
  player,
  isInLineup,
  isSubstitute,
}: RosterPlayerProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: player.id,
    data: {
      type: 'roster-player',
      player,
    },
  });

  if (isInLineup || isSubstitute) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "w-full p-2 rounded-lg border bg-card text-card-foreground shadow-sm transition-colors duration-200 cursor-move",
        isDragging && "opacity-50 ring-2 ring-primary"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="font-medium">{player.firstName} {player.lastName}</div>
          <div className="text-sm text-muted-foreground">#{player.number}</div>
        </div>
        <div className="text-sm text-muted-foreground">{player.primaryPosition}</div>
      </div>
    </div>
  );
}
