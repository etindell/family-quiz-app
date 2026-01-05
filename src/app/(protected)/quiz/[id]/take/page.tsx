'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Question {
  id: string
  question: string
  options: string[]
  correct_answer: string
  explanation: string
}

interface Quiz {
  id: string
  questions: string
  questionCount: number
  timeLimitMinutes: number | null
  category: {
    topicName: string
    subject: { name: string }
    level: { name: string }
  }
}

export default function TakeQuizPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [startTime] = useState(Date.now())

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const res = await fetch(`/api/quizzes/${quizId}`)
        const data = await res.json()

        if (!data.quiz) {
          router.push('/browse')
          return
        }

        setQuiz(data.quiz)
        const parsedQuestions = JSON.parse(data.quiz.questions).questions
        setQuestions(parsedQuestions)

        if (data.quiz.timeLimitMinutes) {
          setTimeLeft(data.quiz.timeLimitMinutes * 60)
        }
      } catch (error) {
        console.error('Failed to fetch quiz:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuiz()
  }, [quizId, router])

  const submitQuiz = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)

    const timeTaken = Math.floor((Date.now() - startTime) / 1000)
    const formattedAnswers = questions.map((q) => ({
      question_id: q.id,
      selected_answer: answers[q.id] || '',
    }))

    try {
      const res = await fetch(`/api/quizzes/${quizId}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: formattedAnswers,
          timeTakenSeconds: timeTaken,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      })

      const data = await res.json()
      router.push(`/quiz/${quizId}/results/${data.attempt.id}`)
    } catch (error) {
      console.error('Failed to submit quiz:', error)
      setSubmitting(false)
    }
  }, [submitting, startTime, questions, answers, quizId, router])

  // Timer effect
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer)
          submitQuiz()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, submitQuiz])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!quiz || questions.length === 0) {
    return <div className="text-center py-12 text-gray-600">Quiz not found</div>
  }

  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.keys(answers).filter((k) => answers[k]).length
  const isComplete = answeredCount === questions.length

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function selectAnswer(answer: string) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }))
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-semibold text-gray-900">{quiz.category.topicName}</h1>
            <p className="text-sm text-gray-600">
              {quiz.category.subject.name} - {quiz.category.level.name}
            </p>
          </div>
          {timeLeft !== null && (
            <div
              className={`text-2xl font-mono font-bold ${
                timeLeft < 60 ? 'text-red-600' : 'text-gray-900'
              }`}
            >
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span>
              {answeredCount} answered
            </span>
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

        <div className="flex space-x-2">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`w-8 h-8 rounded-full text-sm font-medium ${
                i === currentIndex
                  ? 'bg-blue-600 text-white'
                  : answers[q.id]
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            Next
          </button>
        ) : (
          <button
            onClick={submitQuiz}
            disabled={submitting}
            className={`px-6 py-2 rounded-lg font-medium ${
              isComplete
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-yellow-500 text-white hover:bg-yellow-600'
            } disabled:opacity-50`}
          >
            {submitting ? 'Submitting...' : isComplete ? 'Submit Quiz' : 'Submit Incomplete'}
          </button>
        )}
      </div>

      {!isComplete && currentIndex === questions.length - 1 && (
        <p className="text-center text-sm text-yellow-600 mt-4">
          You have {questions.length - answeredCount} unanswered question(s)
        </p>
      )}
    </div>
  )
}
