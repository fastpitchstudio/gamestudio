// src/app/dashboard/teams/[id]/page.tsx
import TeamPageContent from './team-page-content'

// @ts-expect-error - Next.js page props typing issue
export default function TeamPage(props) {
  return <TeamPageContent teamId={props.params.id} />
}