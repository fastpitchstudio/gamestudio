'use client';

import { motion } from 'framer-motion';
import { 
  Position, 
  STANDARD_POSITIONS, 
  SPECIAL_POSITIONS,
  POSITION_LABELS 
} from '@/types/lineup';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface PositionHeaderProps {
  assignedPositions: Set<Position>;
  conflictingPositions: Set<Position>;
}

export function PositionHeader({
  assignedPositions,
  conflictingPositions
}: PositionHeaderProps) {
  return (
    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg mb-4">
      {STANDARD_POSITIONS.map((pos) => (
        <Tooltip key={pos}>
          <TooltipTrigger asChild>
            <motion.div
              initial={false}
              animate={{
                scale: assignedPositions.has(pos) ? 1 : 0.9,
                opacity: assignedPositions.has(pos) ? 1 : 0.5
              }}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center
                ${assignedPositions.has(pos) 
                  ? 'bg-green-100 text-green-700 border-green-200' 
                  : 'bg-gray-100 text-gray-500 border-gray-200'
                }
                ${conflictingPositions.has(pos)
                  ? '!bg-red-100 !text-red-700 !border-red-200'
                  : ''
                }
                border text-xs font-medium
              `}
            >
              {pos}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{POSITION_LABELS[pos]}</p>
            {!assignedPositions.has(pos) && (
              <p className="text-xs text-gray-500">Position not assigned</p>
            )}
            {conflictingPositions.has(pos) && (
              <p className="text-xs text-red-500">Multiple players assigned!</p>
            )}
          </TooltipContent>
        </Tooltip>
      ))}

      <div className="h-8 w-px bg-gray-200 mx-2" />

      {SPECIAL_POSITIONS.map((pos) => (
        <Tooltip key={pos}>
          <TooltipTrigger asChild>
            <motion.div
              initial={false}
              animate={{
                scale: assignedPositions.has(pos) ? 1 : 0.9,
                opacity: assignedPositions.has(pos) ? 1 : 0.5
              }}
              className={`
                px-3 h-8 rounded-full flex items-center justify-center
                ${assignedPositions.has(pos)
                  ? 'bg-purple-100 text-purple-700 border-purple-200'
                  : 'bg-gray-100 text-gray-500 border-gray-200'
                }
                ${conflictingPositions.has(pos)
                  ? '!bg-red-100 !text-red-700 !border-red-200'
                  : ''
                }
                border text-xs font-medium
              `}
            >
              {pos}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{POSITION_LABELS[pos]}</p>
            {!assignedPositions.has(pos) && (
              <p className="text-xs text-gray-500">Position not assigned</p>
            )}
            {conflictingPositions.has(pos) && (
              <p className="text-xs text-red-500">Multiple players assigned!</p>
            )}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
