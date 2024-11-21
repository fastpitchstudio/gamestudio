'use client';

import { useDroppable } from '@dnd-kit/core';
import { Player } from '@/types/player';
import { SubstituteItem } from '@/types/lineup';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface SubstitutesListProps {
  substitutes: SubstituteItem[];
  roster: Player[];
  isOver: boolean;
  onRemoveSubstitute?: (id: string) => void;
}

export function SubstitutesList({
  substitutes,
  roster,
  isOver,
  _onRemoveSubstitute
}: SubstitutesListProps) {
  const { setNodeRef } = useDroppable({
    id: 'substitutes-droppable'
  });

  const handleRemove = (_subId: string) => {
    // Removed the call to onUpdate as it's not defined in the new props
  };

  return (
    <div
      ref={setNodeRef}
      className={`space-y-2 min-h-[100px] rounded-lg ${
        isOver ? 'bg-blue-50 ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}
    >
      {substitutes.map((sub) => {
        const player = roster.find(p => p.id === sub.playerId);
        if (!player) return null;

        return (
          <div
            key={sub.id}
            className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">#{player.number}</span>
              <span>{player.first_name} {player.last_name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(sub.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}

      {substitutes.length === 0 && (
        <div className={`
          flex flex-col items-center justify-center p-4 
          border-2 border-dashed rounded-lg
          ${isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        `}>
          <p className="text-sm text-gray-500 text-center">
            Drag players here to add them as substitutes
          </p>
        </div>
      )}
    </div>
  );
}
