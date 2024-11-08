// src/app/teams/[id]/page.tsx
import React from 'react'
import { redirect } from 'next/navigation'
import { getInitialTeam } from './actions'

/***********************
// Next.js 15+ Dynamic Route Params Handling
// Params must be treated as a Promise and awaited before use
// This ensures proper TypeScript checks and runtime behavior
***********************/

type Params = Promise<{ id: string }>;

export default async function Page({ 
  params 
}: { 
  params: Params 
}): Promise<React.ReactElement | null> {
  // Await the params before using them
  const { id } = await params

  try {
    // Load initial team data to verify access
    await getInitialTeam(id)
    
    // Redirect to the live view as the default team page
    redirect(`/teams/${id}/live`)
  } catch (error) {
    console.error('Error loading team:', error)
    redirect('/teams')
  }

  // This return is technically unreachable due to the redirects,
  // but helps satisfy TypeScript's return type requirements
  return null
}