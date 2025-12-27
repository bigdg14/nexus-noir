'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Users, MessageCircle, Bell, Settings, TrendingUp } from 'lucide-react'

const navItems = [
  { icon: Home, label: 'Feed', href: '/feed' },
  { icon: Users, label: 'Friends', href: '/friends' },
  { icon: MessageCircle, label: 'Messages', href: '/messages' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
  { icon: TrendingUp, label: 'Trending', href: '/trending' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export function QuickNavigation() {
  const pathname = usePathname()

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Quick Navigation</h3>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center justify-between px-3 py-2 rounded-md text-sm
                transition-colors
                ${isActive
                  ? 'bg-blue-50 dark:bg-yellow-900/20 text-blue-600 dark:text-yellow-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                }
              `}
            >
              <div className="flex items-center">
                <Icon className="w-5 h-5 mr-3" />
                <span>{item.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Professional Tools Section */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Professional Tools
        </h4>
        <div className="space-y-1">
          <button
            type="button"
            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            disabled
          >
            My Network
          </button>
          <button
            type="button"
            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            disabled
          >
            Career Resources
          </button>
          <button
            type="button"
            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            disabled
          >
            Community Groups
          </button>
        </div>
      </div>
    </div>
  )
}
