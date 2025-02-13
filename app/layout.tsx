import './styles/globals.css'
import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import Navigation from '@/app/components/common/Navigation';
import { ThemeProvider } from 'next-themes';
import { SettingsProvider } from '@/app/contexts/SettingsContext';

const jetbrains = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains'
})

export const metadata: Metadata = {
  title: 'Ye Olde Weather Dashboard',
  description: 'A medieval-themed weather dashboard built with Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jetbrains.variable} font-mono dark:bg-mono-900 dark:text-mono-100`}>
        <ThemeProvider attribute="class">
          <SettingsProvider>
            <Navigation />
            {children}
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
