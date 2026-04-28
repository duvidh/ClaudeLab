import type { Metadata } from 'next'
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
    <html lang="he" dir="rtl" className="h-full dark">
      <body className="min-h-full bg-gray-900 text-white antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
