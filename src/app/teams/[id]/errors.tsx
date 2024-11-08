// src/app/teams/[id]/error.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export default function TeamError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('Team error:', error)
  }, [error])

  return (
    <Alert variant="destructive">
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-4">Unable to load team data. This could be because:</p>
        <ul className="list-disc pl-4 mb-4">
          <li>The team doesn't exist</li>
          <li>You don't have access to this team</li>
          <li>There was a network error</li>
        </ul>
        <div className="flex gap-4">
          <Button onClick={() => reset()}>
            Try again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push('/teams')}
          >
            Return to Teams
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}