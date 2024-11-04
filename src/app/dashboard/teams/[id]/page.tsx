// src/app/dashboard/teams/[id]/page.tsx
import TeamPageContent from './team-page-content'

export default function TeamPage({ params }: any) {
  return <TeamPageContent teamId={params.id} />
}