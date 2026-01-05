'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Question {
  id: string
  question: string
  options: string[]
  correct_answer: string
  explanation: string
  level: string
  level_id: string
}

interface Subject {
  id: string
  name: string
  icon: string
}

interface LevelScore {
  level_id: string
  level_name: string
  correct: number
  total: number
}

interface AssessmentResult {
  scores: LevelScore[]
  suggestedLevel: { id: string; name: string } | null
}

export default function AssessmentPage() {
  const params = useParams()
  const router = useRouter()
  const subjectId = params.id as string

  const [subject, setSubject] = useState<Subject | null>(null)
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchSubject() {
      try {
        const res = await fetch(`/api/subjects/${subjectId}`)
        const data = await res.json()
        setSubject(data.subject)
      } catch {
        setError('Failed to load subject')
      } finally {
        setLoading(false)
      }
    }
    fetchSubject()
  }, [subjectId])

  async function startAssessment() {
    setGenerating(true)
    setError('')

    try {
      const res = await fetch(`/api/subjects/${subjectId}/assessments`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate assessment')
      }

      setAssessmentId(data.assessment.id)
      setQuestions(data.questions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate assessment')
    } finally {
      setGenerating(false)
    }
  }

  const submitAssessment = useCallback(async () => {
    if (!assessmentId || submitting) return
    setSubmitting(true)

    const formattedAnswers = questions.map((q) => ({
      question_id: q.id,
      selected_answer: answers[q.id] || '',
    }))

    try {
      const res = await fetch(`/api/assessments/${assessmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: formattedAnswers }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit assessment')
      }

      setResult({
        scores: data.scores,
        suggestedLevel: data.suggestedLevel,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit assessment')
      setSubmitting(false)
    }
  }, [assessmentId, submitting, questions, answers])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!subject) {
    return <div className="text-center py-12 text-gray-600">Subject not found</div>
  }

  // Show results
  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <span className="text-4xl">{subject.icon}</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Assessment Complete!</h1>

          {result.suggestedLevel && (
            <div className="my-8">
              <p className="text-gray-600 mb-2">Suggested Level</p>
              <p className="text-3xl font-bold text-blue-600">{result.suggestedLevel.name}</p>
            </div>
          )}

          <div className="my-8">
            <h3 className="font-semibold text-gray-900 mb-4">Score Breakdown</h3>
            <div className="space-y-2">
              {result.scores.map((score) => {
                const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0
                return (
                  <div key={score.level_id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium">{score.level_name}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-600">
                        {score.correct}/{score.total}
                      </span>
                      <span
                        className={`font-semibold ${
                          percentage >= 70 ? 'text-green-600' : 'text-gray-600'
                        }`}
                      >
                        {percentage}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                if (result.suggestedLevel) {
                  router.push(`/subjects/${subjectId}`)
                }
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Accept & Continue
            </button>
            <Link
              href={`/subjects/${subjectId}`}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Choose Different Level
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Show start screen
  if (!assessmentId) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <span className="text-4xl">{subject.icon}</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">{subject.name} Assessment</h1>
          <p className="text-gray-600 mt-2">
            Take this assessment to find your recommended level. Questions will span all levels
            from beginner to advanced.
          </p>

          {error && (
            <div className="my-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            onClick={startAssessment}
            disabled={generating}
            className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? 'Generating Assessment...' : 'Start Assessment'}
          </button>

          {generating && (
            <p className="mt-4 text-sm text-gray-600">
              This may take a few seconds...
            </p>
          )}

          <Link
            href={`/subjects/${subjectId}`}
            className="block mt-4 text-gray-600 hover:text-gray-900"
          >
            Cancel
          </Link>
        </div>
      </div>
    )
  }

  // Show questions
  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.keys(answers).filter((k) => answers[k]).length
  const isComplete = answeredCount === questions.length

  function selectAnswer(answer: string) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }))
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-semibold text-gray-900">{subject.name} Assessment</h1>
            <p className="text-sm text-gray-600">Level: {currentQuestion.level}</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span>{answeredCount} answered</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">{currentQuestion.question}</h2>

        <div className="space-y-3">
          {currentQuestion.options.map((option, i) => (
            <button
              key={i}
              onClick={() => selectAnswer(option)}
              className={`w-full text-left p-4 rounded-lg border-2 transition ${
                answers[currentQuestion.id] === option
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          Previous
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            Next
          </button>
        ) : (
          <button
            onClick={submitAssessment}
            disabled={submitting || !isComplete}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </button>
        )}
      </div>

      {!isComplete && currentIndex === questions.length - 1 && (
        <p className="text-center text-sm text-yellow-600 mt-4">
          Please answer all questions before submitting
        </p>
      )}
    </div>
  )
}
