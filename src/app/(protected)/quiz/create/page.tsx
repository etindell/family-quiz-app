'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Subject {
  id: string
  name: string
  icon: string
  levels: Array<{ id: string; name: string; sortOrder: number }>
}

interface SubjectStat {
  subject: { id: string; name: string; icon: string }
  currentLevel: { id: string; name: string } | null
  suggestedLevel: { id: string; name: string } | null
}

export default function CreateQuizPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [errorDetails, setErrorDetails] = useState<{
    reason?: string
    suggestedTopic?: string
  } | null>(null)

  const [subjectId, setSubjectId] = useState(searchParams.get('subjectId') || '')
  const [topicName, setTopicName] = useState(searchParams.get('topic') || '')
  const [questionCount, setQuestionCount] = useState(10)
  const [timed, setTimed] = useState(false)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15)

  useEffect(() => {
    async function fetchData() {
      try {
        const [subjectsRes, statsRes] = await Promise.all([
          fetch('/api/subjects'),
          fetch('/api/stats'),
        ])
        const subjectsData = await subjectsRes.json()
        const statsData = await statsRes.json()
        setSubjects(subjectsData.subjects)
        setSubjectStats(statsData.subjectStats || [])
      } catch {
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const selectedSubject = subjects.find((s) => s.id === subjectId)
  const selectedSubjectStat = subjectStats.find((s) => s.subject.id === subjectId)
  const currentLevel = selectedSubjectStat?.currentLevel

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setErrorDetails(null)

    if (!currentLevel) {
      setError('Please select a level for this subject first')
      return
    }

    setCreating(true)

    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId,
          levelId: currentLevel.id,
          topicName,
          questionCount,
          timeLimitMinutes: timed ? timeLimitMinutes : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'Topic outside current level') {
          setError('This topic is outside your current level')
          setErrorDetails({
            reason: data.reason,
            suggestedTopic: data.suggestedTopic,
          })
        } else {
          setError(data.error || 'Failed to create quiz')
        }
        return
      }

      router.push(`/quiz/${data.quiz.id}`)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  function useSuggestedTopic() {
    if (errorDetails?.suggestedTopic) {
      setTopicName(errorDetails.suggestedTopic)
      setError('')
      setErrorDetails(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Create a Quiz</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="font-medium">{error}</p>
            {errorDetails?.reason && (
              <p className="mt-1 text-sm">{errorDetails.reason}</p>
            )}
            {errorDetails?.suggestedTopic && (
              <div className="mt-3">
                <p className="text-sm">
                  Suggested topic:{' '}
                  <span className="font-medium">{errorDetails.suggestedTopic}</span>
                </p>
                <button
                  type="button"
                  onClick={useSuggestedTopic}
                  className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Use Suggested Topic
                </button>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.icon} {subject.name}
              </option>
            ))}
          </select>
        </div>

        {selectedSubject && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
            {currentLevel ? (
              <div className="flex items-center justify-between p-3 bg-gray-100 rounded-md border border-gray-300">
                <span className="font-medium text-gray-900">{currentLevel.name}</span>
                <Link
                  href={`/subjects/${subjectId}`}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Change Level
                </Link>
              </div>
            ) : (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-md">
                <p className="text-orange-700 mb-3">
                  You need to select a level for {selectedSubject.name} before creating a quiz.
                </p>
                <Link
                  href={`/subjects/${subjectId}`}
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Select Level
                </Link>
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Your quiz will be generated at your current level. To change levels, visit the subject page.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
          <input
            type="text"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            required
            placeholder="e.g., Weather idioms, Irregular verbs, Fractions"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Questions: {questionCount}
          </label>
          <input
            type="range"
            min="10"
            max="20"
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>10</span>
            <span>20</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={timed}
              onChange={(e) => setTimed(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Timed quiz</span>
          </label>

          {timed && (
            <select
              value={timeLimitMinutes}
              onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          )}
        </div>

        <button
          type="submit"
          disabled={creating || !subjectId || !currentLevel || !topicName}
          className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? 'Generating Quiz...' : 'Generate Quiz'}
        </button>

        {creating && (
          <p className="text-center text-sm text-gray-600">
            This may take a few seconds while we generate your quiz...
          </p>
        )}
      </form>
    </div>
  )
}
