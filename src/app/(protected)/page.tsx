'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats')
        const data = await res.json()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!stats) {
    return <div className="text-center py-12 text-gray-600">Failed to load stats</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/quiz/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Create Quiz
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-orange-600">{stats.streak.current}</div>
          <div className="text-sm text-gray-600">Day Streak</div>
          <div className="text-xs text-gray-400 mt-1">Best: {stats.streak.longest}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-blue-600">{stats.overall.totalQuizzes}</div>
          <div className="text-sm text-gray-600">Quizzes Completed</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-green-600">{stats.overall.overallAccuracy}%</div>
          <div className="text-sm text-gray-600">Overall Accuracy</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-purple-600">{stats.overall.quizzesThisWeek}</div>
          <div className="text-sm text-gray-600">This Week</div>
        </div>
      </div>

      {/* Subject Cards */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Subjects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.subjectStats.map((stat) => (
            <Link
              key={stat.subject.id}
              href={`/subjects/${stat.subject.id}`}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
            >
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl">{stat.subject.icon}</span>
                <span className="font-semibold text-gray-900">{stat.subject.name}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Level:</span>
                  <span className="text-gray-900">
                    {stat.currentLevel?.name || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quizzes:</span>
                  <span className="text-gray-900">{stat.quizzesCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Accuracy:</span>
                  <span className="text-gray-900">{stat.accuracy}%</span>
                </div>
              </div>
              {stat.suggestedLevel && stat.suggestedLevel.id !== stat.currentLevel?.id && (
                <div className="mt-3 text-xs text-blue-600">
                  Suggested: {stat.suggestedLevel.name}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        {stats.recentActivity.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
            No quizzes taken yet. Start by{' '}
            <Link href="/browse" className="text-blue-600 hover:underline">
              browsing quizzes
            </Link>{' '}
            or{' '}
            <Link href="/quiz/create" className="text-blue-600 hover:underline">
              creating your own
            </Link>
            .
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow divide-y">
            {stats.recentActivity.map((activity) => (
              <Link
                key={activity.id}
                href={`/quiz/${activity.quizId}/results/${activity.id}`}
                className="block p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">{activity.topic}</div>
                    <div className="text-sm text-gray-600">
                      {activity.subject} - {activity.level}
                    </div>
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
