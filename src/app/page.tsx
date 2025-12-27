'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Users, TrendingUp, Sparkles, Shield, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    if (session) {
      router.push('/feed')
    }
  }, [session, router])

  if (status === 'loading') {
    return null
  }

  const logoSrc = theme === 'dark'
    ? '/images/logo/NexusNoirGoldLogoOnly.png'
    : '/images/logo/NexusNoirBlueLogoOnly.png'

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Logo - Fixed Position Top Left */}
      <div className="fixed top-4 left-4 md:top-6 md:left-6 z-50">
        <img
          src={logoSrc}
          alt="Nexus Noir"
          className="h-10 md:h-12 drop-shadow-lg"
        />
      </div>

      {/* Theme Toggle - Fixed Position */}
      <button
        type="button"
        onClick={toggleTheme}
        className="fixed top-4 right-4 md:top-6 md:right-6 z-50 p-2 md:p-3 rounded-full bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all hover:scale-110"
        aria-label="Toggle theme"
        title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
        ) : (
          <Sun className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
        )}
      </button>

      {/* Hero Section */}
      <section className="relative h-[400px] sm:h-[500px] md:h-[600px] lg:h-screen flex items-center justify-center overflow-hidden">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero/hero.png"
            alt="Nexus Noir Hero"
            fill
            className="object-cover object-center opacity-40 dark:opacity-30"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 dark:from-yellow-500/10 dark:to-amber-600/10" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-blue-600 to-blue-800 dark:from-yellow-400 dark:to-amber-500 bg-clip-text text-transparent">
              Nexus Noir
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-3 md:mb-4">
              Where Black Excellence Connects
            </p>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 md:mb-12 max-w-2xl mx-auto px-4">
              A professional social network built for African Americans to connect, network, and elevate together.
              Your space to share your story, build meaningful relationships, and grow your career.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg px-12 h-14 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 dark:text-black">
                  Join Nexus Noir
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="lg" variant="outline" className="text-lg px-12 h-14 w-full sm:w-auto border-2 border-blue-600 dark:border-yellow-500 text-blue-600 dark:text-yellow-500 hover:bg-blue-50 dark:hover:bg-yellow-900/20">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-400 dark:border-gray-600 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-400 dark:bg-gray-600 rounded-full mt-2" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50 dark:bg-zinc-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-900 dark:text-gray-100">
              Built For Our Community
            </h2>
            <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-16 max-w-3xl mx-auto">
              A space designed with the unique experiences and aspirations of Black professionals in mind.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-blue-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-8 h-8 text-blue-600 dark:text-yellow-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  Authentic Connections
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Connect with professionals who understand your journey and share your values.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-blue-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center mb-6">
                  <TrendingUp className="w-8 h-8 text-blue-600 dark:text-yellow-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  Career Growth
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Access opportunities, mentorship, and resources tailored to your professional development.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-blue-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-blue-600 dark:text-yellow-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  Celebrate Excellence
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Share achievements, inspire others, and uplift your community together.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-blue-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center mb-6">
                  <Shield className="w-8 h-8 text-blue-600 dark:text-yellow-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  Safe Space
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  A community built on respect, inclusivity, and shared understanding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-blue-800 dark:from-yellow-500 dark:to-amber-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white dark:text-black">
              Ready to Join the Network?
            </h2>
            <p className="text-xl text-blue-100 dark:text-gray-900 mb-10 max-w-2xl mx-auto">
              Be part of a community that celebrates your success, understands your challenges, and supports your growth.
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-12 h-14 bg-white text-blue-600 hover:bg-gray-100 dark:bg-black dark:text-yellow-500 dark:hover:bg-gray-900">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <img
                src="/images/logo/NexusNoirBlueLogo.png"
                alt="Nexus Noir"
                className="h-8 dark:hidden"
              />
              <img
                src="/images/logo/NexusNoirGoldLogo.png"
                alt="Nexus Noir"
                className="h-8 hidden dark:block"
              />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              &copy; 2025 Nexus Noir. All rights reserved.
            </p>
            <div className="flex justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <a href="#" className="hover:text-blue-600 dark:hover:text-yellow-500">About</a>
              <a href="#" className="hover:text-blue-600 dark:hover:text-yellow-500">Privacy</a>
              <a href="#" className="hover:text-blue-600 dark:hover:text-yellow-500">Terms</a>
              <a href="#" className="hover:text-blue-600 dark:hover:text-yellow-500">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
