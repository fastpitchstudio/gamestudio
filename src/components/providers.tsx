'use client'

import { AuthProvider } from '@/lib/contexts/auth-context'
import ErrorBoundary from '@/components/error-boundary'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
