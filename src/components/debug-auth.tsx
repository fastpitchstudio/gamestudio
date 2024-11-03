'use client'

import { useAuth } from '@/lib/contexts/auth-context'

export function DebugAuth() {
  const { user, session, loading } = useAuth()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-xs overflow-hidden">
      <pre className="whitespace-pre-wrap">
        {`Loading: ${loading}
User: ${user ? 'Logged in' : 'Not logged in'}
Email: ${user?.email ?? 'None'}
Session: ${session ? 'Active' : 'None'}
Session expires: ${session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A'}
Last updated: ${new Date().toLocaleTimeString()}`}
      </pre>
    </div>
  )
}
