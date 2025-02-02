import './globals.css'
import type { Metadata } from 'next'
import { JetBrains_Mono, UnifrakturMaguntia } from 'next/font/google'
import Navigation from './components/Navigation'

const jetbrains = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains'
})

const titleFont = UnifrakturMaguntia({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-title'
})

export const metadata: Metadata = {
  title: 'Ye Olde Weather Dashboard',
  description: 'A medieval-themed weather dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jetbrains.variable} ${titleFont.variable} font-mono dark:bg-mono-900 dark:text-mono-100`}>
        <Navigation>{children}</Navigation>
      </body>
    </html>
  )
}
