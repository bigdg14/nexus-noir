'use client'

import { useTheme } from '@/contexts/theme-context'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Theme
        </span>
        <button
          onClick={toggleTheme}
          className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800 bg-gray-200 dark:bg-gray-700"
          aria-label="Toggle theme"
        >
          <span
            className={`inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white dark:bg-black transition-transform shadow-lg ${
              theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
            }`}
          >
            {theme === 'light' ? (
              <Sun className="h-4 w-4 text-blue-600" />
            ) : (
              <Moon className="h-4 w-4 text-yellow-500" />
            )}
          </span>
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      </p>
    </div>
  )
}
