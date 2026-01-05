import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { generateLessons, generateSuggestions } from '@/lib/feedback-generator'

interface Answer {
  question_id: string
  selected_answer: string
  is_correct: boolean
}

interface Question {
  id: string
  question: string
  correct_answer: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const attempt = await prisma.attempt.findUnique({
      where: { id },
      include: {
        quiz: {
          include: {
            category: {
              include: {
                subject: true,
                level: true,
              },
            },
          },
        },
      },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (attempt.userId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Parse answers and questions
    const answersData = JSON.parse(attempt.answers) as { answers: Answer[] }
    const questionsData = JSON.parse(attempt.quiz.questions) as { questions: Question[] }

    // Find wrong answers
    const wrongAnswers = answersData.answers
      .filter((a) => !a.is_correct)
      .map((a) => {
        const question = questionsData.questions.find((q) => q.id === a.question_id)
        return {
          questionId: a.question_id,
          question: question?.question || '',
          userAnswer: a.selected_answer,
          correctAnswer: question?.correct_answer || '',
        }
      })

    const subject = attempt.quiz.category.subject.name
    const level = attempt.quiz.category.level.name
    const topic = attempt.quiz.category.topicName

    // Generate lessons and suggestions in parallel
    const [lessons, suggestions] = await Promise.all([
      generateLessons(subject, level, topic, wrongAnswers),
      generateSuggestions(
        subject,
        level,
        topic,
        attempt.score,
        attempt.totalQuestions,
        wrongAnswers.map((wa) => wa.question).join('; ')
      ),
    ])

    return NextResponse.json({ lessons, suggestions })
  } catch (error) {
    console.error('Generate feedback error:', error)
    return NextResponse.json({ error: 'Failed to generate feedback' }, { status: 500 })
  }
}
