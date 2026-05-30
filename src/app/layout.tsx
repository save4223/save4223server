import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'ISDWorks! Inventory Management System',
  description: 'ISDWorks! Inventory Management System',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh" data-theme="isd">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-base-100`}>
        {children}
      </body>
    </html>
  )
}
