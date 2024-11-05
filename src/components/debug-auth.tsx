//src/components/debug-auth.tsx

'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { useEffect, useState } from 'react'

export function DebugAuth() {
  const { user, session, loading } = useAuth()
  const [clientTime, setClientTime] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setClientTime(new Date().toLocaleTimeString())
    
    // Update time every minute
    const interval = setInterval(() => {
      setClientTime(new Date().toLocaleTimeString())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  if (process.env.NODE_ENV !== 'development' || !mounted) {
    return null
  }

  const debugInfo = `Loading: ${loading}
User: ${user ? 'Logged in' : 'Not logged in'}
Email: ${user?.email ?? 'None'}
Session: ${session ? 'Active' : 'None'}
Session expires: ${session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A'}
Last updated: ${clientTime}`

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-xs overflow-hidden">
      <pre className="whitespace-pre-wrap">{debugInfo}</pre>
    </div>
  )
}