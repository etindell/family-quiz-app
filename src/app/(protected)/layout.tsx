'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
import { SubjectProvider, Subject } from '@/contexts/SubjectContext'

interface User {
  id: string
  username: string
  displayName: string
  currentStreak: number
  longestStreak: number
  lastSubjectId?: string | null
  lastSubject?: Subject | null
}

function ProtectedLayoutContent({
  children,
  user,
}: {
  children: React.ReactNode
  user: User
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [hasCheckedSubject, setHasCheckedSubject] = useState(false)

  useEffect(() => {
    // Skip redirect on select-subject page
    if (pathname === '/select-subject') {
      setHasCheckedSubject(true)
      return
    }

    // If no subject selected, redirect to select-subject
    if (!user.lastSubject && !user.lastSubjectId) {
      router.push('/select-subject')
    } else {
      setHasCheckedSubject(true)
    }
  }, [pathname, user.lastSubject, user.lastSubjectId, router])

  // Don't render children until we've checked subject (except on select-subject page)
  if (!hasCheckedSubject && pathname !== '/select-subject') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // On select-subject page, render without header
  if (pathname === '/select-subject') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} currentSubject={user.lastSubject} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()

        if (!data.user) {
          router.push('/login')
          return
        }

        setUser(data.user)
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <SubjectProvider initialSubject={user.lastSubject}>
      <ProtectedLayoutContent user={user}>
        {children}
      </ProtectedLayoutContent>
    </SubjectProvider>
  )
}
