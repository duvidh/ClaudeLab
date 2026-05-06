'use client'

import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'
import { ThemeProvider } from '@/components/ThemeProvider'

export function Providers({ children, session }: { children: React.ReactNode; session: Session | null }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <SessionProvider session={session}>{children}</SessionProvider>
    </ThemeProvider>
  )
}
