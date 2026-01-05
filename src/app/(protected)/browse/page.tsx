'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

interface Subject {
  id: string
  name: string
  icon: string
  levels: Array<{ id: string; name: string }>
}

interface Quiz {
  id: string
  questionCount: number
  timeLimitMinutes: number | null
  createdAt: string
  category: {
    topicName: string
    subject: { id: string; name: string; icon: string }
    level: { id: string; name: string }
  }
  creator: { displayName: string }
  _count: { attempts: number }
}

export default function BrowsePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)

  const subjectId = searchParams.get('subjectId') || ''
  const levelId = searchParams.get('levelId') || ''
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')

  useEffect(() => {
    async function fetchSubjects() {
      const res = await fetch('/api/subjects')
      const data = await res.json()
      setSubjects(data.subjects)
    }
    fetchSubjects()
  }, [])

  useEffect(() => {
    async function fetchQuizzes() {
      setLoading(true)
      const params = new URLSearchParams()
      if (subjectId) params.set('subjectId', subjectId)
      if (levelId) params.set('levelId', levelId)
      if (search) params.set('search', search)
      params.set('page', page.toString())
      params.set('limit', '12')

      const res = await fetch(`/api/quizzes?${params}`)
      const data = await res.json()
      setQuizzes(data.quizzes)
      setTotalPages(data.pagination.totalPages)
      setLoading(false)
    }
    fetchQuizzes()
  }, [subjectId, levelId, search, page])

  const selectedSubject = subjects.find((s) => s.id === subjectId)

  function updateFilters(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    params.set('page', '1')
    router.push(`/browse?${params}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Browse Quizzes</h1>
        <Link
          href="/quiz/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Create Quiz
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <select
            value={subjectId}
            onChange={(e) => updateFilters({ subjectId: e.target.value, levelId: '' })}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.icon} {s.name}
              </option>
            ))}
          </select>

          {selectedSubject && (
            <select
              value={levelId}
              onChange={(e) => updateFilters({ levelId: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Levels</option>
              {selectedSubject.levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            placeholder="Search topics..."
            defaultValue={search}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateFilters({ search: (e.target as HTMLInputElement).value })
              }
            }}
            className="px-3 py-2 border border-gray-300 rounded-md flex-1 min-w-[200px]"
          />

          {(subjectId || levelId || search) && (
            <button
              onClick={() => router.push('/browse')}
              className="px-3 py-2 text-gray-600 hover:text-gray-900"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Quiz Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 mb-4">No quizzes found</p>
          <Link href="/quiz/create" className="text-blue-600 hover:underline">
            Create the first one!
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz) => (
              <Link
                key={quiz.id}
                href={`/quiz/${quiz.id}`}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xl">{quiz.category.subject.icon}</span>
                  <span className="text-sm text-gray-600">{quiz.category.subject.name}</span>
                  <span className="text-gray-400">-</span>
                  <span className="text-sm text-gray-600">{quiz.category.level.name}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{quiz.category.topicName}</h3>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{quiz.questionCount} questions</span>
                  <span>{quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} min` : 'Untimed'}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400 mt-2">
                  <span>by {quiz.creator.displayName}</span>
                  <span>{quiz._count.attempts} taken</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('page', p.toString())
                    router.push(`/browse?${params}`)
                  }}
                  className={`px-3 py-1 rounded ${
                    p === page ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
