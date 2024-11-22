// src/components/game/roster/roster-view.tsx
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Player } from '@/lib/types/supabase';

interface RosterViewProps {
  players: Player[];
  onPlayerAvailabilityChange: (playerId: string, available: boolean) => void;
  onPlayerClick?: (player: Player) => void;
  activeLineupPlayerIds?: string[]; // Add this to track who's already in lineup
}

const DraggablePlayer = ({ 
  player,
  onAvailabilityChange,
  onClick,
  isInLineup
}: { 
  player: Player;
  onAvailabilityChange: (available: boolean) => void;
  onClick?: () => void;
  isInLineup?: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `roster-${player.id}`,
    data: {
      type: 'roster',
      order: null
    },
    disabled: !player.available || isInLineup // Disable drag if not available or already in lineup
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: (!player.available || isInLineup) ? 'default' : 'grab'
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`
        p-2 select-none
        ${isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''}
        ${!player.available || isInLineup ? 'opacity-50' : ''}
        ${player.available && !isInLineup ? 'hover:bg-accent' : ''}
        transition-colors relative
      `}
      onClick={() => {
        if (player.available && !isInLineup && onClick) {
          onClick();
        }
      }}
    >
      <div className="flex items-center gap-2" {...attributes} {...listeners}>
        <span className="font-mono text-sm">#{player.number}</span>
        <span className="flex-1">{player.first_name} {player.last_name}</span>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onAvailabilityChange(!player.available);
          }}
        >
          <XCircle className={`h-4 w-4 ${!player.available ? 'text-destructive' : ''}`} />
        </Button>

        {isInLineup && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">In Lineup</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default function RosterView({
  players,
  onPlayerAvailabilityChange,
  onPlayerClick,
  activeLineupPlayerIds = []
}: RosterViewProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'unavailable'>('all');

  const filteredPlayers = players.filter(player => {
    switch (filter) {
      case 'available':
        return player.available && !activeLineupPlayerIds.includes(player.id);
      case 'unavailable':
        return !player.available || activeLineupPlayerIds.includes(player.id);
      default:
        return true;
    }
  });

  const availableCount = players.filter(p => 
    p.available && !activeLineupPlayerIds.includes(p.id)
  ).length;

  return (
    <div 
      className={`
        flex-shrink-0 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-72'}
      `}
    >
      <Card className="p-4 h-full relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
            <h3 className="font-medium">Roster</h3>
            <p className="text-sm text-muted-foreground">
              {availableCount} available
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>
        </div>

        {!isCollapsed && (
          <div className="flex gap-2 mb-4">
            <Button
              size="sm"
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className="flex-1"
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filter === 'available' ? 'default' : 'outline'}
              onClick={() => setFilter('available')}
              className="flex-1"
            >
              Available
            </Button>
            <Button
              size="sm"
              variant={filter === 'unavailable' ? 'default' : 'outline'}
              onClick={() => setFilter('unavailable')}
              className="flex-1"
            >
              Out
            </Button>
          </div>
        )}

        <div className="space-y-2 overflow-y-auto">
          {filteredPlayers.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground p-4">
              No players found
            </div>
          ) : (
            filteredPlayers.map((player) => (
              <DraggablePlayer
                key={player.id}
                player={player}
                onAvailabilityChange={(available) => onPlayerAvailabilityChange(player.id, available)}
                onClick={() => onPlayerClick?.(player)}
                isInLineup={activeLineupPlayerIds?.includes(player.id)}
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}