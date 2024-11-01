import '@/app/globals.css'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { DebugAuth } from '@/components/debug-auth'
import { DebugSupabase } from '@/components/debug-supabase'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Game Studio',
  description: 'Modern sports team management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
          <DebugAuth />
          <DebugSupabase />
        </Providers>
      </body>
    </html>
  )
}