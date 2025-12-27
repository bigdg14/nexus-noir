'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function TrendingPage() {
  const { status } = useSession()

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Trending</h1>
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">Trending page - Coming soon</p>
      </div>
    </div>
  )
}
