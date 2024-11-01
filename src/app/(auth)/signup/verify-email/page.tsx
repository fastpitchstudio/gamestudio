'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

export default function VerifyEmailPage() {
  return (
    <Card className="w-full text-center">
      <CardHeader>
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
            <Mail className="w-6 h-6 text-slate-600" />
          </div>
        </div>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          We&apos;ve sent you an email with a link to verify your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-500">
          Click the link in the email to complete your registration.
          If you don&apos;t see the email, check your spam folder.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Link href="/login" className="w-full">
          <Button variant="outline" className="w-full">
            Back to login
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}