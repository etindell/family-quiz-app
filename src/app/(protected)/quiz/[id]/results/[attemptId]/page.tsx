'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Question {
  id: string
  question: string
  options: string[]
  correct_answer: string
  explanation: string
}

interface Answer {
  question_id: string
  selected_answer: string
  is_correct: boolean
}

interface Lesson {
  question_id: string
  lesson: string
}

interface Suggestion {
  topic: string
  reason: string
}

interface Attempt {
  id: string
  score: number
  totalQuestions: number
  timeTakenSeconds: number | null
  isFirstAttempt: boolean
  answers: string
  quiz: {
    id: string
    questions: string
    category: {
      topicName: string
      subjectId: string
      levelId: string
      subject: { name: string; icon: string }
      level: { name: string }
    }
  }
}

export default function ResultsPage() {
  const params = useParams()
  const attemptId = params.attemptId as string
  const quizId = params.id as string

  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/attempts/${attemptId}`)
        const data = await res.json()

        if (!data.attempt) {
          return
        }

        setAttempt(data.attempt)
        setQuestions(JSON.parse(data.attempt.quiz.questions).questions)
        setAnswers(JSON.parse(data.attempt.answers).answers)
      } catch (error) {
        console.error('Failed to fetch attempt:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [attemptId])

  async function loadFeedback() {
    if (feedbackLoading || lessons.length > 0) return
    setFeedbackLoading(true)

    try {
      const res = await fetch(`/api/attempts/${attemptId}/feedback`, {
        method: 'POST',
      })
      const data = await res.json()
      setLessons(data.lessons || [])
      setSuggestions(data.suggestions || [])
    } catch (error) {
      console.error('Failed to load feedback:', error)
    } finally {
      setFeedbackLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!attempt) {
    return <div className="text-center py-12 text-gray-600">Results not found</div>
  }

  const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100)
  const wrongAnswers = answers.filter((a) => !a.is_correct)

  function toggleQuestion(id: string) {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Score Summary */}
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <span className="text-3xl">{attempt.quiz.category.subject.icon}</span>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{attempt.quiz.category.topicName}</h1>
            <p className="text-gray-600">
              {attempt.quiz.category.subject.name} - {attempt.quiz.category.level.name}
            </p>
          </div>
        </div>

        <div
          className={`text-6xl font-bold mb-2 ${
            percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
          }`}
        >
          {percentage}%
        </div>
        <div className="text-xl text-gray-600">
          {attempt.score} out of {attempt.totalQuestions} correct
        </div>

        {attempt.timeTakenSeconds && (
          <div className="mt-4 text-gray-500">
            Time: {formatTime(attempt.timeTakenSeconds)}
          </div>
        )}

        {!attempt.isFirstAttempt && (
          <div className="mt-4 text-sm text-gray-500">
            This was a retake - it doesn&apos;t affect your stats
          </div>
        )}

        <div className="flex justify-center space-x-4 mt-6">
          <Link
            href={`/quiz/${quizId}/take`}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retake Quiz
          </Link>
          <Link
            href="/browse"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Browse Quizzes
          </Link>
        </div>
      </div>

      {/* Question Review */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Question Review</h2>
        </div>
        <div className="divide-y">
          {questions.map((q, i) => {
            const answer = answers.find((a) => a.question_id === q.id)
            const isCorrect = answer?.is_correct
            const isExpanded = expandedQuestions.has(q.id)

            return (
              <div key={q.id} className="p-4">
                <button
                  onClick={() => toggleQuestion(q.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start space-x-3">
                    <span
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm ${
                        isCorrect ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    >
                      {isCorrect ? '✓' : '✗'}
                    </span>
                    <div className="flex-1">
                      <span className="text-gray-500 mr-2">Q{i + 1}.</span>
                      <span className="text-gray-900">{q.question}</span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-4 ml-9 space-y-3">
                    <div className="space-y-2">
                      {q.options.map((option, j) => (
                        <div
                          key={j}
                          className={`p-2 rounded ${
                            option === q.correct_answer
                              ? 'bg-green-50 border border-green-200'
                              : option === answer?.selected_answer && !isCorrect
                              ? 'bg-red-50 border border-red-200'
                              : 'bg-gray-50'
                          }`}
                        >
                          <span className="font-medium mr-2">{String.fromCharCode(65 + j)}.</span>
                          {option}
                          {option === q.correct_answer && (
                            <span className="ml-2 text-green-600 text-sm">✓ Correct</span>
                          )}
                          {option === answer?.selected_answer && option !== q.correct_answer && (
                            <span className="ml-2 text-red-600 text-sm">Your answer</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-blue-50 rounded text-sm text-blue-800">
                      <strong>Explanation:</strong> {q.explanation}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Lessons & Suggestions */}
      {wrongAnswers.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Learn from Your Mistakes
            </h2>
            {lessons.length === 0 && (
              <button
                onClick={loadFeedback}
                disabled={feedbackLoading}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {feedbackLoading ? 'Loading...' : 'Generate Lessons'}
              </button>
            )}
          </div>

          {lessons.length > 0 && (
            <div className="p-4 space-y-4">
              {lessons.map((lesson, i) => (
                <div key={i} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-gray-800">{lesson.lesson}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Suggested Topics</h2>
          </div>
          <div className="p-4 space-y-3">
            {suggestions.map((suggestion, i) => (
              <Link
                key={i}
                href={`/quiz/create?subjectId=${attempt.quiz.category.subjectId}&levelId=${attempt.quiz.category.levelId}&topic=${encodeURIComponent(suggestion.topic)}`}
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="font-medium text-gray-900">{suggestion.topic}</div>
                <div className="text-sm text-gray-600">{suggestion.reason}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
