'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSubject } from '@/contexts/SubjectContext'
import { getSubjectTheme } from '@/config/subject-themes'

interface Stats {
  streak: {
    current: number
    longest: number
    lastQuizDate: string | null
  }
  overall: {
    totalQuizzes: number
    totalQuestions: number
    overallAccuracy: number
    quizzesThisWeek: number
  }
  recentActivity: Array<{
    id: string
    quizId: string
    topic: string
    subject: string
    level: string
    score: number
    totalQuestions: number
    completedAt: string
    isFirstAttempt: boolean
  }>
  subjectStats: Array<{
    subject: { id: string; name: string; icon: string }
    currentLevel: { id: string; name: string } | null
    suggestedLevel: { id: string; name: string } | null
    quizzesCompleted: number
    accuracy: number
  }>
}

interface LevelProgress {
  progress: {
    total: number
    passed: number
    percent: number
  }
  subtopics: Array<{
    id: string
    name: string
    score: number
    passed: boolean
  }>
}

export default function DashboardPage() {
  const { currentSubject } = useSubject()
  const [stats, setStats] = useState<Stats | null>(null)
  const [levelProgress, setLevelProgress] = useState<LevelProgress | null>(null)
  const [loading, setLoading] = useState(true)

  const theme = currentSubject ? getSubjectTheme(currentSubject.name) : null

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats')
        const data = await res.json()
        setStats(data)

        // Fetch level progress for current subject if it has a level
        if (currentSubject) {
          const subjectStat = data.subjectStats.find(
            (s: { subject: { id: string } }) => s.subject.id === currentSubject.id
          )
          if (subjectStat?.currentLevel?.id) {
            try {
              const progressRes = await fetch(`/api/levels/${subjectStat.currentLevel.id}/progress`)
              if (progressRes.ok) {
                const progressData = await progressRes.json()
                setLevelProgress(progressData)
              }
            } catch {
              console.error('Failed to fetch level progress')
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [currentSubject])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!stats || !currentSubject) {
    return <div className="text-center py-12 text-gray-600">Failed to load stats</div>
  }

  // Get stats for current subject only
  const subjectStat = stats.subjectStats.find((s) => s.subject.id === currentSubject.id)
  const hasLevel = !!subjectStat?.currentLevel

  // Filter recent activity to current subject only
  const subjectActivity = stats.recentActivity.filter(
    (a) => a.subject === currentSubject.name
  )

  return (
    <div className="space-y-8">
      {/* Subject Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="text-4xl">{currentSubject.icon}</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentSubject.name}</h1>
            {hasLevel && (
              <p className="text-gray-600">
                Level: <span className="font-medium">{subjectStat?.currentLevel?.name}</span>
              </p>
            )}
          </div>
        </div>
        <Link
          href={`/quiz/create?subjectId=${currentSubject.id}`}
          className="text-white px-4 py-2 rounded-lg transition"
          style={{ backgroundColor: theme?.primary || '#2563eb' }}
        >
          Create Quiz
        </Link>
      </div>

      {/* Level Selection CTA if no level */}
      {!hasLevel && (
        <div
          className="rounded-xl p-6 text-white"
          style={{
            background: `linear-gradient(135deg, ${theme?.primary || '#2563eb'}, ${theme?.primary || '#2563eb'}dd)`,
          }}
        >
          <h2 className="text-xl font-bold mb-2">Get Started</h2>
          <p className="text-white/90 mb-4">
            Select a level to start tracking your progress and unlock personalized quizzes.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/subjects/${currentSubject.id}`}
              className="px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 font-medium"
            >
              Select Level
            </Link>
            <Link
              href={`/subjects/${currentSubject.id}/assess`}
              className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 font-medium"
            >
              Take Assessment
            </Link>
          </div>
          {subjectStat?.suggestedLevel && (
            <p className="text-white/80 text-sm mt-3">
              Assessment suggests: {subjectStat.suggestedLevel.name}
            </p>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-orange-600">{stats.streak.current}</div>
          <div className="text-sm text-gray-600">Day Streak</div>
          <div className="text-xs text-gray-400 mt-1">Best: {stats.streak.longest}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold" style={{ color: theme?.primary || '#2563eb' }}>
            {subjectStat?.quizzesCompleted || 0}
          </div>
          <div className="text-sm text-gray-600">Quizzes Completed</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-green-600">{subjectStat?.accuracy || 0}%</div>
          <div className="text-sm text-gray-600">Accuracy</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-purple-600">{stats.overall.quizzesThisWeek}</div>
          <div className="text-sm text-gray-600">This Week (all)</div>
        </div>
      </div>

      {/* Level Progress */}
      {hasLevel && levelProgress && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Level Mastery</h2>
            <Link
              href={`/subjects/${currentSubject.id}`}
              className="text-sm font-medium hover:underline"
              style={{ color: theme?.primary || '#2563eb' }}
            >
              View All Subtopics
            </Link>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">
                {levelProgress.progress.passed}/{levelProgress.progress.total} subtopics passed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="h-4 rounded-full transition-all duration-500"
                style={{
                  width: `${levelProgress.progress.percent}%`,
                  backgroundColor: theme?.primary || '#22c55e',
                }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {levelProgress.progress.percent}% complete - Pass by scoring &gt;90% on last 40 questions
            </p>
          </div>

          {/* Assessment Status */}
          {subjectStat && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              {!subjectStat.suggestedLevel ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-orange-600 font-medium">No assessment taken</p>
                  <Link
                    href={`/subjects/${currentSubject.id}/assess`}
                    className="text-sm font-medium hover:underline"
                    style={{ color: theme?.primary || '#2563eb' }}
                  >
                    Take Assessment
                  </Link>
                </div>
              ) : subjectStat.suggestedLevel.id !== subjectStat.currentLevel?.id ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-orange-600 font-medium">
                    Assessment suggests: {subjectStat.suggestedLevel.name}
                  </p>
                  <Link
                    href={`/subjects/${currentSubject.id}`}
                    className="text-sm font-medium hover:underline"
                    style={{ color: theme?.primary || '#2563eb' }}
                  >
                    Change Level
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-green-600">Level matches your assessment</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {hasLevel && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href={`/subjects/${currentSubject.id}`}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition flex items-center space-x-4"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme?.primaryLight || '#dbeafe' }}
            >
              <svg
                className="w-6 h-6"
                style={{ color: theme?.primary || '#2563eb' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Study Subtopics</h3>
              <p className="text-sm text-gray-600">Practice specific areas</p>
            </div>
          </Link>

          <Link
            href={`/subjects/${currentSubject.id}/learn`}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition flex items-center space-x-4"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme?.primaryLight || '#dbeafe' }}
            >
              <svg
                className="w-6 h-6"
                style={{ color: theme?.primary || '#2563eb' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Lesson</h3>
              <p className="text-sm text-gray-600">Get personalized tutoring</p>
            </div>
          </Link>

          <Link
            href={`/subjects/${currentSubject.id}/assess`}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition flex items-center space-x-4"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme?.primaryLight || '#dbeafe' }}
            >
              <svg
                className="w-6 h-6"
                style={{ color: theme?.primary || '#2563eb' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Assessment</h3>
              <p className="text-sm text-gray-600">Find your level</p>
            </div>
          </Link>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        {subjectActivity.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
            No quizzes taken yet in {currentSubject.name}. Start by{' '}
            <Link
              href={`/subjects/${currentSubject.id}`}
              className="hover:underline"
              style={{ color: theme?.primary || '#2563eb' }}
            >
              studying subtopics
            </Link>{' '}
            or{' '}
            <Link
              href={`/quiz/create?subjectId=${currentSubject.id}`}
              className="hover:underline"
              style={{ color: theme?.primary || '#2563eb' }}
            >
              creating a quiz
            </Link>
            .
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow divide-y">
            {subjectActivity.map((activity) => (
              <Link
                key={activity.id}
                href={`/quiz/${activity.quizId}/results/${activity.id}`}
                className="block p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">{activity.topic}</div>
                    <div className="text-sm text-gray-600">{activity.level}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {activity.score}/{activity.totalQuestions}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(activity.completedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
