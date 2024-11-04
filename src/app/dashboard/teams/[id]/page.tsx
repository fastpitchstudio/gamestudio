// src/app/dashboard/teams/[id]/page.tsx
import TeamPageContent from './team-page-content'

export default function TeamPage(props: any) {
  return <TeamPageContent teamId={props.params.id} />
}

// We're disabling the ESLint rule for this specific case
// since we need to use 'any' to work with Next.js internal types
/* eslint-disable @typescript-eslint/no-explicit-any */