'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PreviousGameLineup } from '@/types/lineup';

interface LineupTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  previousGames: PreviousGameLineup[];
  onSelectTemplate: (lineup: PreviousGameLineup | null) => void;
}

export function LineupTemplateDialog({
  isOpen,
  onClose,
  previousGames,
  onSelectTemplate,
}: LineupTemplateDialogProps) {
  const [hoveredGameId, setHoveredGameId] = useState<string | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Start New Lineup</DialogTitle>
          <DialogDescription>
            Start with a blank lineup or use a previous game as a template
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <Button
            variant="outline"
            className="w-full justify-start text-left"
            onClick={() => onSelectTemplate(null)}
          >
            Start with blank lineup
          </Button>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Previous Games</h4>
            {previousGames.map((game) => (
              <div
                key={game.game_id}
                className="relative"
                onMouseEnter={() => setHoveredGameId(game.game_id)}
                onMouseLeave={() => setHoveredGameId(null)}
              >
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => onSelectTemplate(game)}
                >
                  <div>
                    <div className="font-medium">
                      vs {game.opponent}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(game.game_date), 'MMM d, yyyy')}
                    </div>
                  </div>
                </Button>

                <AnimatePresence>
                  {hoveredGameId === game.game_id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      className="absolute left-full ml-2 top-0 z-50"
                      style={{ width: '200px' }}
                    >
                      <Card className="p-3">
                        <h5 className="text-sm font-medium mb-2">Lineup Preview</h5>
                        <div className="space-y-1">
                          {game.lineup.map((player, index) => (
                            <div
                              key={player.id}
                              className="text-sm flex items-center gap-2"
                            >
                              <span className="w-4 text-gray-500">
                                {index + 1}
                              </span>
                              <span>
                                {player.first_name} {player.last_name}
                              </span>
                              {player.position && (
                                <span className="text-gray-500">
                                  ({player.position})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
