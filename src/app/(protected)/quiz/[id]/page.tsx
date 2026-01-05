'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Quiz {
  id: string
  questionCount: number
  timeLimitMinutes: number | null
  createdAt: string
  category: {
    topicName: string
    subject: { name: string; icon: string }
    level: { name: string }
  }
  creator: { displayName: string }
  _count: { attempts: number }
}

interface Attempt {
  id: string
  score: number
  totalQuestions: number
  completedAt: string
  isFirstAttempt: boolean
}

export default function QuizDetailPage() {
  const params = useParams()
  const quizId = params.id as string
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [quizRes, attemptsRes] = await Promise.all([
          fetch(`/api/quizzes/${quizId}`),
          fetch(`/api/quizzes/${quizId}/attempts`),
        ])

        const quizData = await quizRes.json()
        const attemptsData = await attemptsRes.json()

        setQuiz(quizData.quiz)
        setAttempts(attemptsData.attempts || [])
      } catch (error) {
        console.error('Failed to fetch quiz:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [quizId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Quiz not found</h1>
        <Link href="/browse" className="text-blue-600 hover:underline mt-4 inline-block">
          Browse other quizzes
        </Link>
      </div>
    )
  }

  const hasAttempted = attempts.length > 0
  const bestAttempt = attempts.reduce(
    (best, a) => (!best || a.score > best.score ? a : best),
    null as Attempt | null
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-3xl">{quiz.category.subject.icon}</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{quiz.category.topicName}</h1>
            <p className="text-gray-600">
              {quiz.category.subject.name} - {quiz.category.level.name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 my-6 text-sm">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-gray-600">Questions</div>
            <div className="text-xl font-semibold">{quiz.questionCount}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-gray-600">Time Limit</div>
            <div className="text-xl font-semibold">
              {quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} min` : 'Untimed'}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-gray-600">Created by</div>
            <div className="text-xl font-semibold">{quiz.creator.displayName}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-gray-600">Times Taken</div>
            <div className="text-xl font-semibold">{quiz._count.attempts}</div>
          </div>
        </div>

        {bestAttempt && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="text-blue-800 font-medium">Your Best Score</div>
            <div className="text-2xl font-bold text-blue-600">
              {bestAttempt.score}/{bestAttempt.totalQuestions} (
              {Math.round((bestAttempt.score / bestAttempt.totalQuestions) * 100)}%)
            </div>
          </div>
        )}

        <Link
          href={`/quiz/${quizId}/take`}
          className="block w-full text-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          {hasAttempted ? 'Retake Quiz' : 'Start Quiz'}
        </Link>

        {hasAttempted && (
          <p className="text-center text-sm text-gray-500 mt-2">
            Note: Retakes won&apos;t affect your stats
          </p>
        )}

        {attempts.length > 0 && (
          <div className="mt-8">
            <h3 className="font-medium text-gray-900 mb-3">Your Attempts</h3>
            <div className="space-y-2">
              {attempts.map((attempt) => (
                <Link
                  key={attempt.id}
                  href={`/quiz/${quizId}/results/${attempt.id}`}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div>
                    <span className="font-medium">
                      {attempt.score}/{attempt.totalQuestions}
                    </span>
                    {attempt.isFirstAttempt && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        First attempt
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-600">
                    {new Date(attempt.completedAt).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
