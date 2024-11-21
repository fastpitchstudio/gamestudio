import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineupBuilder } from './lineup-v2/lineup-builder';
import { Loader2 } from 'lucide-react';
import { Team } from '@/types/team';

interface GameDetailsProps {
  gameId: string;
  team: Team;
}

export function GameDetails({ gameId, team }: GameDetailsProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        Game Details
      </h1>

      <Tabs defaultValue="lineup" className="w-full">
        <TabsList>
          <TabsTrigger value="lineup">Lineup</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="lineup" className="mt-4">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            }
          >
            <LineupBuilder
              gameId={gameId}
              teamId={team.id}
              players={team.players || []}
              previousGames={[]} // TODO: Load previous games
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="stats">
          {/* TODO: Add game stats component */}
          <div className="text-center text-gray-500 py-8">
            Game stats coming soon
          </div>
        </TabsContent>

        <TabsContent value="summary">
          {/* TODO: Add game summary component */}
          <div className="text-center text-gray-500 py-8">
            Game summary coming soon
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
