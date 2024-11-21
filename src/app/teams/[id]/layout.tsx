// app/teams/[id]/layout.tsx
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { notFound, redirect } from 'next/navigation'
import { TopNav } from '@/components/shared/top-nav'
import { Skeleton } from '@/components/ui/skeleton'
import type { Database } from '@/lib/types/database-types'

interface TeamLayoutProps {
  children: React.ReactNode
  params: {
    id: string
  }
}

// src/app/teams/[id]/layout.tsx
async function TeamLayoutContent({ params }: { params: { id: string }}) {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore
  })

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/login')
  }

  // Get team data
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select(`
      *,
      coach_teams!inner (
        coach_id
      )
    `)
    .eq('id', params.id)
    .eq('coach_teams.coach_id', user.id)
    .single()

  if (teamError || !team) {
    redirect('/teams')
  }

  return (
    <TopNav 
      teamId={team.id}              // Add teamId here
      teamName={team.name}
      teamLogoUrl={team.logo_url}
      onSignOut={async () => {
        'use server'
        const cookieStore = cookies()
        const supabase = createServerComponentClient({ cookies: () => cookieStore })
        await supabase.auth.signOut()
        redirect('/login')
      }}
    />
  )
}

function LoadingTopNav() {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-32 h-6" />
        </div>
        <div className="flex items-center ml-8 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="w-16 h-4" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default async function TeamLayout({ children, params }: TeamLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<LoadingTopNav />}>
        <TeamLayoutContent params={params} />
      </Suspense>
      <main className="container mx-auto p-6">
        {children}
      </main>
    </div>
  )
}