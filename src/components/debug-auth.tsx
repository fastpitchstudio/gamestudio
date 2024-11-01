'use client'

import { useAuth } from '@/lib/contexts/auth-context'

export function DebugAuth() {
  const { user, loading } = useAuth()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs">
      <pre>
        Loading: {loading.toString()}
        {'\n'}
        User: {user ? 'Logged in' : 'Not logged in'}
        {'\n'}
        Email: {user?.email}
      </pre>
    </div>
  )
}