'use client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Position } from '@/types/lineup';
import { cn } from '@/lib/utils';

interface PositionButtonProps {
  currentPosition: Position | null;
  position: Position;
  onPositionChange: (position: Position) => void;
  hasConflict?: boolean;
  isSpecial?: boolean;
}

export function PositionButton({
  currentPosition,
  position,
  onPositionChange,
  hasConflict = false,
  isSpecial = false,
}: PositionButtonProps) {
  const isSelected = currentPosition === position;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className={cn(
            'h-7 w-7 p-0 font-medium',
            isSelected && !hasConflict && 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:bg-blue-900/50 dark:border-blue-800 dark:text-blue-400',
            isSelected && hasConflict && 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 dark:bg-red-900/50 dark:border-red-800 dark:text-red-400',
            !isSelected && 'hover:bg-gray-100 dark:hover:bg-gray-800',
            isSpecial && !isSelected && 'text-gray-500 dark:text-gray-400'
          )}
          onClick={() => onPositionChange(position)}
        >
          {position}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{getPositionName(position)}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function getPositionName(position: Position): string {
  const positionNames: Record<Position, string> = {
    P: 'Pitcher',
    C: 'Catcher',
    '1B': 'First Base',
    '2B': 'Second Base',
    '3B': 'Third Base',
    SS: 'Shortstop',
    LF: 'Left Field',
    CF: 'Center Field',
    RF: 'Right Field',
    DH: 'Designated Hitter',
    PH: 'Pinch Hitter',
    PR: 'Pinch Runner',
  };

  return positionNames[position] || position;
}
