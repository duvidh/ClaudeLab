import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'CRM קבלנות בניה',
  description: 'מערכת ניהול לקוחות לחברת קבלנות בניה',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl" className="h-full" suppressHydrationWarning>
      <body className="min-h-full bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white antialiased font-sans">
        <Providers session={null}>{children}</Providers>
      </body>
    </html>
  )
}
