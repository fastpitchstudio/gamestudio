'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type SessionInfo = {
  hasSession: boolean
  user: string | null
  expires: number | null
  lastChecked: string
  connectionStatus: string
}

export function DebugSupabase() {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    hasSession: false,
    user: null,
    expires: null,
    lastChecked: new Date().toLocaleTimeString(),
    connectionStatus: 'Checking...'
  })

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient()
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          setSessionInfo(prev => ({
            ...prev,
            connectionStatus: `Error: ${error.message}`,
            lastChecked: new Date().toLocaleTimeString()
          }))
          return
        }

        setSessionInfo({
          hasSession: !!session,
          user: session?.user?.email ?? null,
          expires: session?.expires_at ?? null,
          lastChecked: new Date().toLocaleTimeString(),
          connectionStatus: 'Connected'
        })
      } catch (error) {
        setSessionInfo(prev => ({
          ...prev,
          connectionStatus: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          lastChecked: new Date().toLocaleTimeString()
        }))
      }
    }

    checkSession()
    const interval = setInterval(checkSession, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-xs overflow-hidden">
      <pre className="whitespace-pre-wrap">
        {JSON.stringify({
          status: sessionInfo.connectionStatus,
          hasSession: sessionInfo.hasSession,
          user: sessionInfo.user,
          expires: sessionInfo.expires ? new Date(sessionInfo.expires * 1000).toLocaleString() : null,
          lastChecked: sessionInfo.lastChecked
        }, null, 2)}
      </pre>
    </div>
  )
}
