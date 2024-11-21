// src/app/teams/layout.tsx
import React from 'react'
import { cookies } from 'next/headers'
import { headers } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { redirect } from 'next/navigation'
import { TopNav } from '@/components/shared/top-nav'
import type { Database } from '@/lib/types/database-types'

interface TeamsLayoutProps {
  children: React.ReactNode
}

export default async function Layout({ 
  children 
}: TeamsLayoutProps) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient<Database>({
    cookies: () => Promise.resolve(cookieStore)
  })

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/login')
  }

  const handleSignOut = async () => {
    'use server'
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ 
      cookies: () => Promise.resolve(cookieStore) 
    })
    await supabase.auth.signOut()
    redirect('/login')
  }

  // Check if we're in a team-specific context
  const headersList = await headers()
  const pathname = headersList.get('next-url') || '/'
  const isTeamPage = pathname === '/teams'

  return (
    <>
      {isTeamPage && (
        <TopNav 
          teamId={null}
          teamName={null}
          teamLogoUrl={null}
          onSignOut={handleSignOut}
        />
      )}
      {children}
    </>
  )
}