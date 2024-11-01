'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function DebugSupabase() {
  const [sessionInfo, setSessionInfo] = useState<string>('Checking...')

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setSessionInfo(JSON.stringify({
        hasSession: !!session,
        user: session?.user?.email,
        expires: session?.expires_at
      }, null, 2))
    }

    checkSession()
    const interval = setInterval(checkSession, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs">
      <pre>{sessionInfo}</pre>
    </div>
  )
}