import type { Metadata } from 'next'
import { AuthProvider } from '@/app/contexts/AuthContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'Genie',
  description: 'Genie AI - Your Personal Assistant',
  generator: 'v0.dev',
  icons: {
    icon: '/images/flower-pattern.png', // Path relative to the public folder
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}