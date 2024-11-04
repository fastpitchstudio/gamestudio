// src/app/dashboard/teams/[id]/layout.tsx
import { Suspense } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

function TeamPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48 mt-2" />
      </div>
      
      <div className="border rounded-lg p-6 space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function TeamPageLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary
      fallback={
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was an error loading the team page. Please try refreshing.
          </AlertDescription>
        </Alert>
      }
    >
      <Suspense fallback={<TeamPageSkeleton />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}