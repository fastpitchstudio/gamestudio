'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="text-slate-600">We are sorry for the inconvenience.</p>
        <div className="space-x-4">
          <Button
            onClick={() => reset()}
            variant="outline"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="default"
          >
            Go home
          </Button>
        </div>
      </div>
    </div>
  )
}