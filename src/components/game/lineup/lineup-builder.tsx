// src/components/game/lineup/lineup-builder.tsx
import { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { Grip, Plus, Trash2 } from 'lucide-react';

interface Player {
  id: string;
  number: string;
  first_name: string;
  last_name: string;
  preferred_positions?: string[];
}

interface LineupSlot {
  id: string;
  order: number;
  position?: string;
  player?: Player;
}

interface LineupBuilderProps {
  players: Player[];
  initialLineup?: LineupSlot[];
  onLineupChange?: (lineup: LineupSlot[]) => void;
}

const DEFAULT_POSITIONS = [
  { code: 'P', name: 'Pitcher' },
  { code: 'C', name: 'Catcher' },
  { code: '1B', name: 'First Base' },
  { code: '2B', name: 'Second Base' },
  { code: '3B', name: 'Third Base' },
  { code: 'SS', name: 'Shortstop' },
  { code: 'LF', name: 'Left Field' },
  { code: 'CF', name: 'Center Field' },
  { code: 'RF', name: 'Right Field' },
  { code: 'DP', name: 'Designated Player' },
  { code: 'FLEX', name: 'Flex' },
];

// Custom component for each sortable lineup slot
const SortableLineupSlot = ({ 
  slot, 
  positionGroups,
  onPositionChange,
  onRemove 
}: { 
  slot: LineupSlot;
  positionGroups: { preferred: string[]; others: string[] };
  onPositionChange: (position: string) => void;
  onRemove: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`
        p-2 mb-1 flex items-center gap-2 
        ${isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''}
      `}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <Grip className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="w-8 text-center font-mono text-sm">
        {slot.player?.number}
      </div>

      <div className="flex-1 text-sm">
        {slot.player ? (
          <span>
            {slot.player.first_name} {slot.player.last_name}
          </span>
        ) : (
          <span className="text-muted-foreground">Empty slot</span>
        )}
      </div>

      <Select
        value={slot.position}
        onValueChange={onPositionChange}
      >
        <SelectTrigger className="w-20 h-8">
          <SelectValue placeholder="Pos" />
        </SelectTrigger>
        <SelectContent>
          {positionGroups.preferred.length > 0 && (
            <>
              <div className="text-xs px-2 py-1 text-muted-foreground">
                Preferred Positions
              </div>
              {positionGroups.preferred.map((pos) => (
                <SelectItem key={pos} value={pos}>
                  {pos}
                </SelectItem>
              ))}
              <SelectSeparator />
            </>
          )}
          <div className="text-xs px-2 py-1 text-muted-foreground">
            All Positions
          </div>
          {positionGroups.others.map((pos) => (
            <SelectItem key={pos} value={pos}>
              {pos}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button 
        variant="ghost" 
        size="icon"
        onClick={onRemove}
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </Card>
  );
};

// Lineup drag overlay component
const DragOverlayContent = ({ slot }: { slot: LineupSlot }) => {
  return (
    <Card className="p-2 shadow-lg ring-2 ring-primary/20 w-full opacity-90">
      <div className="flex items-center gap-2">
        <Grip className="h-4 w-4 text-muted-foreground" />
        <div className="w-8 text-center font-mono text-sm">
          {slot.player?.number}
        </div>
        <div className="flex-1">
          {slot.player && (
            <span>
              {slot.player.first_name} {slot.player.last_name}
            </span>
          )}
        </div>
        {slot.position && (
          <div className="w-20 text-center">{slot.position}</div>
        )}
      </div>
    </Card>
  );
};

export default function LineupBuilder({
  players,
  initialLineup,
  onLineupChange
}: LineupBuilderProps) {
  // Initialize with 9 empty slots if no initial lineup
  const [lineup, setLineup] = useState<LineupSlot[]>(
    initialLineup || Array.from({ length: 9 }, (_, i) => ({
      id: `slot-${i + 1}`,
      order: i + 1
    }))
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get all unique positions
  const getPositionGroups = (playerPositions?: string[]) => {
    const preferred = playerPositions || [];
    const defaultPositions = DEFAULT_POSITIONS.map(p => p.code);
    const others = defaultPositions.filter(pos => !preferred.includes(pos));
    return { preferred, others };
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setLineup((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newLineup = arrayMove(items, oldIndex, newIndex);
        if (onLineupChange) onLineupChange(newLineup);
        return newLineup;
      });
    }
    
    setActiveId(null);
  };

  const handlePositionChange = (slotId: string, position: string) => {
    setLineup(prev => {
      const newLineup = prev.map(slot => 
        slot.id === slotId ? { ...slot, position } : slot
      );
      if (onLineupChange) onLineupChange(newLineup);
      return newLineup;
    });
  };

  const handleRemovePlayer = (slotId: string) => {
    setLineup(prev => {
      const newLineup = prev.map(slot => {
        if (slot.id === slotId) {
          return { ...slot, player: undefined, position: undefined };
        }
        return slot;
      });
      if (onLineupChange) onLineupChange(newLineup);
      return newLineup;
    });
  };

  const addLineupSlot = () => {
    const newOrder = lineup.length + 1;
    const newSlot = {
      id: `slot-${newOrder}`,
      order: newOrder
    };
    setLineup(prev => {
      const newLineup = [...prev, newSlot];
      if (onLineupChange) onLineupChange(newLineup);
      return newLineup;
    });
  };

  // Auto-expand lineup when all slots are filled
  useEffect(() => {
    const filledSlots = lineup.filter(slot => slot.player).length;
    if (filledSlots === lineup.length) {
      addLineupSlot();
    }
  }, [lineup]);

  // Find active slot for drag overlay
  const activeSlot = activeId ? lineup.find(slot => slot.id === activeId) : null;

  return (
    <div className="space-y-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext
          items={lineup}
          strategy={verticalListSortingStrategy}
        >
          {lineup.map((slot) => (
            <SortableLineupSlot
              key={slot.id}
              slot={slot}
              positionGroups={getPositionGroups(slot.player?.preferred_positions)}
              onPositionChange={(pos) => handlePositionChange(slot.id, pos)}
              onRemove={() => handleRemovePlayer(slot.id)}
            />
          ))}
        </SortableContext>

        <DragOverlay>
          {activeId && activeSlot ? (
            <DragOverlayContent slot={activeSlot} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="text-right">
        <Button 
          variant="outline" 
          size="sm"
          onClick={addLineupSlot}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Slot
        </Button>
      </div>
    </div>
  );
}