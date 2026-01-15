'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSubject } from '@/contexts/SubjectContext'
import { getSubjectTheme } from '@/config/subject-themes'

interface SubjectStat {
  subject: {
    id: string
    name: string
    icon: string
  }
  currentLevel: { id: string; name: string } | null
  suggestedLevel: { id: string; name: string } | null
  quizzesCompleted: number
  accuracy: number
}

export default function SubjectSelector() {
  const router = useRouter()
  const { setCurrentSubject } = useSubject()
  const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats')
        if (res.ok) {
          const data = await res.json()
          setSubjectStats(data.subjectStats || [])
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const handleSelectSubject = async (stat: SubjectStat) => {
    await setCurrentSubject({
      id: stat.subject.id,
      name: stat.subject.name,
      icon: stat.subject.icon,
    })
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Subject
          </h1>
          <p className="text-xl text-gray-400">
            Select a subject to begin your learning journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjectStats.map((stat) => {
            const theme = getSubjectTheme(stat.subject.name)
            return (
              <button
                key={stat.subject.id}
                onClick={() => handleSelectSubject(stat)}
                className={`
                  relative overflow-hidden rounded-2xl p-8
                  bg-gradient-to-br ${theme.gradient}
                  transform transition-all duration-300
                  hover:scale-105 hover:shadow-2xl hover:shadow-${theme.primary}/30
                  focus:outline-none focus:ring-4 focus:ring-white/30
                  group
                `}
              >
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className="text-6xl mb-4">
                    {stat.subject.icon}
                  </div>

                  {/* Subject name */}
                  <h2 className="text-2xl font-bold text-white mb-4">
                    {stat.subject.name}
                  </h2>

                  {/* Stats */}
                  <div className="space-y-2 text-white/90">
                    {stat.currentLevel ? (
                      <p className="text-sm">
                        <span className="font-medium">Level:</span> {stat.currentLevel.name}
                      </p>
                    ) : (
                      <p className="text-sm text-white/70">No level selected</p>
                    )}

                    {stat.quizzesCompleted > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>{stat.quizzesCompleted} quizzes</span>
                        <span>{stat.accuracy}% accuracy</span>
                      </div>
                    )}
                  </div>

                  {/* Arrow indicator */}
                  <div className="mt-6 flex justify-end">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
