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
  title: 'Smart Lab Inventory',
  description: '智能实验室工具管理系统',
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
