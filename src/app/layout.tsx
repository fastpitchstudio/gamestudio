// src/app/layout.tsx
import '@/app/globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"

export const metadata = {
  metadataBase: new URL('https://gamestudio.one'),
  title: {
    default: 'Game Studio',
    template: '%s | Game Studio'
  },
  description: 'Modern sports team management platform',
  openGraph: {
    title: 'Game Studio',
    description: 'Modern sports team management platform',
    url: 'https://gamestudio.one',
    siteName: 'Game Studio',
    locale: 'en_US',
    type: 'website',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="h-screen flex dark:bg-slate-950">
            <div className="flex-1 flex flex-col">
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}