'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getSubjectTheme, SubjectTheme } from '@/config/subject-themes'

export interface Subject {
  id: string
  name: string
  icon: string
}

interface SubjectContextType {
  currentSubject: Subject | null
  currentTheme: SubjectTheme | null
  loading: boolean
  setCurrentSubject: (subject: Subject | null) => Promise<void>
  clearSubject: () => Promise<void>
}

const SubjectContext = createContext<SubjectContextType | undefined>(undefined)

export function SubjectProvider({
  children,
  initialSubject
}: {
  children: ReactNode
  initialSubject?: Subject | null
}) {
  const [currentSubject, setCurrentSubjectState] = useState<Subject | null>(initialSubject || null)
  const [loading, setLoading] = useState(!initialSubject)

  const currentTheme = currentSubject ? getSubjectTheme(currentSubject.name) : null

  useEffect(() => {
    // If we already have an initial subject, don't fetch
    if (initialSubject !== undefined) {
      setLoading(false)
      return
    }

    async function loadLastSubject() {
      try {
        const res = await fetch('/api/users/me/preferences')
        if (res.ok) {
          const data = await res.json()
          if (data.lastSubject) {
            setCurrentSubjectState(data.lastSubject)
          }
        }
      } catch (error) {
        console.error('Failed to load last subject:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLastSubject()
  }, [initialSubject])

  const setCurrentSubject = async (subject: Subject | null) => {
    setCurrentSubjectState(subject)

    // Persist to API
    try {
      await fetch('/api/users/me/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastSubjectId: subject?.id || null }),
      })
    } catch (error) {
      console.error('Failed to save subject preference:', error)
    }
  }

  const clearSubject = async () => {
    await setCurrentSubject(null)
  }

  return (
    <SubjectContext.Provider value={{
      currentSubject,
      currentTheme,
      loading,
      setCurrentSubject,
      clearSubject
    }}>
      {children}
    </SubjectContext.Provider>
  )
}

export function useSubject() {
  const context = useContext(SubjectContext)
  if (context === undefined) {
    throw new Error('useSubject must be used within a SubjectProvider')
  }
  return context
}
