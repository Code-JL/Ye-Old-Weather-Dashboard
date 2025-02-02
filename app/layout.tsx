import './globals.css'
import type { Metadata } from 'next'
import { JetBrains_Mono, UnifrakturMaguntia } from 'next/font/google'
import ThemeToggle from './components/ThemeToggle'
import SettingsDropdown from './components/SettingsDropdown'
import { SettingsProvider } from './contexts/SettingsContext'
import { ThemeProvider } from 'next-themes'
import { ErrorBoundary } from 'react-error-boundary'

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
        <ThemeProvider attribute="class">
          <SettingsProvider>
            <nav className="bg-white dark:bg-mono-800 shadow-lg">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                  <div className="flex-1">
                    <span className="text-xl font-title font-semibold">
                      Ye Olde Weather
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ThemeToggle />
                    <ErrorBoundary fallback={
                      <button 
                        onClick={() => window.location.reload()} 
                        className="p-2 rounded-lg bg-red-200 dark:bg-red-800"
                      >
                        Reset Settings
                      </button>
                    }>
                      <SettingsDropdown />
                    </ErrorBoundary>
                  </div>
                </div>
              </div>
            </nav>
            {children}
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
