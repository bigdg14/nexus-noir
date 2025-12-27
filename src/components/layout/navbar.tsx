'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useTheme } from '@/contexts/theme-context'
import { Button } from '@/components/ui/button'
import { Home, MessageCircle, Bell, Search, Moon, Sun, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ProfileDropdown } from './profile-dropdown'

export function Navbar() {
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (session?.user?.id) {
      fetchUnreadCount()
      const interval = setInterval(fetchUnreadCount, 30000) // Poll every 30 seconds
      return () => clearInterval(interval)
    }
  }, [session])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications?limit=1')
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  if (!session) return null

  // Use default logo until mounted to prevent hydration mismatch
  const logoSrc = mounted && theme === 'dark'
    ? '/images/logo/NexusNoirGoldLogoOnly.png'
    : '/images/logo/NexusNoirBlueLogoOnly.png'

  return (
    <nav className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/feed" className="flex items-center space-x-2 md:space-x-3">
              <img
                src={logoSrc}
                alt="Nexus Noir"
                className="h-10 md:h-12"
              />
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-yellow-400 dark:to-amber-500 bg-clip-text text-transparent">
                Nexus Noir
              </span>
            </Link>

            <div className="hidden md:flex space-x-4">
              <Link href="/feed">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Home
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Explore
                </Button>
              </Link>
              <Link href="/messages">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Messages
                </Button>
              </Link>
              <Link href="/notifications">
                <Button variant="ghost" size="sm" className="flex items-center gap-2 relative">
                  <Bell className="w-5 h-5" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle theme"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-700" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-500" />
              )}
            </button>

            {/* Profile Dropdown - Hidden on mobile */}
            <div className="hidden md:block">
              <ProfileDropdown
                user={{
                  id: session.user?.id || '',
                  username: session.user?.username,
                  displayName: session.user?.displayName,
                  avatar: session.user?.avatar,
                }}
              />
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 py-4">
            <div className="flex flex-col space-y-2">
              <Link href="/feed" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-3">
                  <Home className="w-5 h-5" />
                  Home
                </Button>
              </Link>
              <Link href="/explore" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-3">
                  <Search className="w-5 h-5" />
                  Explore
                </Button>
              </Link>
              <Link href="/messages" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-3">
                  <MessageCircle className="w-5 h-5" />
                  Messages
                </Button>
              </Link>
              <Link href="/notifications" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-3 relative">
                  <Bell className="w-5 h-5" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Mobile Profile Section */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <ProfileDropdown
                  user={{
                    id: session.user?.id || '',
                    username: session.user?.username,
                    displayName: session.user?.displayName,
                    avatar: session.user?.avatar,
                  }}
                  onNavigate={() => setMobileMenuOpen(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
