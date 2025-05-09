import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Genie',
  description: 'Created with v0',
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
      <body>{children}</body>
    </html>
  )
}
