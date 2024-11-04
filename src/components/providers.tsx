'use client'

import { AuthProvider } from '@/lib/contexts/auth-context'
import { ErrorBoundary } from '@/components/error-boundary'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Application Error</AlertTitle>
          <AlertDescription>
            The application encountered an error. Please refresh the page or try again later.
          </AlertDescription>
        </Alert>
      }
    >
      <AuthProvider>
        {children}
      </AuthProvider>
    </ErrorBoundary>
  )
}