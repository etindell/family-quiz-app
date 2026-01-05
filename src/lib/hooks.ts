'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  username: string
  displayName: string
  currentStreak: number
  longestStreak: number
  lastQuizDate: string | null
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        setUser(data.user)
      } catch (error) {
        console.error('Failed to fetch user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  return { user, loading, setUser }
}

export function useSubjects() {
  const [subjects, setSubjects] = useState<Array<{
    id: string
    name: string
    icon: string
    levels: Array<{ id: string; name: string; sortOrder: number }>
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSubjects() {
      try {
        const res = await fetch('/api/subjects')
        const data = await res.json()
        setSubjects(data.subjects)
      } catch (error) {
        console.error('Failed to fetch subjects:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubjects()
  }, [])

  return { subjects, loading }
}
