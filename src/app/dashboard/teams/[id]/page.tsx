// src/app/dashboard/teams/[id]/page.tsx
import TeamPageContent from './team-page-content'

interface PageParams {
  params: {
    id: string;
  };
}

export default function TeamPage({ params }: PageParams) {
  return <TeamPageContent teamId={params.id} />
}