import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

interface Answer {
  question_id: string
  selected_answer: string
  is_correct: boolean
}

export async function POST() {
  try {
    const session = await getSession()
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all attempts marked as first attempts
    const firstAttempts = await prisma.attempt.findMany({
      where: { isFirstAttempt: true },
      orderBy: { completedAt: 'asc' },
    })

    let fixed = 0
    const changes: Array<{
      attemptId: string
      quizId: string
      userId: string
      action: string
    }> = []

    for (const attempt of firstAttempts) {
      const attemptAnswers = JSON.parse(attempt.answers) as { answers: Answer[] }
      const answeredCount = attemptAnswers.answers.filter(
        (ans) => ans.selected_answer && ans.selected_answer.trim() !== ''
      ).length

      // Check if less than half answered
      if (answeredCount < attempt.totalQuestions / 2) {
        // Mark this as not a first attempt
        await prisma.attempt.update({
          where: { id: attempt.id },
          data: { isFirstAttempt: false },
        })

        changes.push({
          attemptId: attempt.id,
          quizId: attempt.quizId,
          userId: attempt.userId,
          action: 'unmarked_incomplete_first_attempt',
        })

        // Find the first complete attempt for this quiz/user
        const allAttempts = await prisma.attempt.findMany({
          where: {
            quizId: attempt.quizId,
            userId: attempt.userId,
          },
          orderBy: { completedAt: 'asc' },
        })

        const firstComplete = allAttempts.find((a) => {
          const answers = JSON.parse(a.answers) as { answers: Answer[] }
          const answered = answers.answers.filter(
            (ans) => ans.selected_answer && ans.selected_answer.trim() !== ''
          ).length
          return answered === a.totalQuestions
        })

        if (firstComplete && !firstComplete.isFirstAttempt) {
          await prisma.attempt.update({
            where: { id: firstComplete.id },
            data: { isFirstAttempt: true },
          })

          changes.push({
            attemptId: firstComplete.id,
            quizId: firstComplete.quizId,
            userId: firstComplete.userId,
            action: 'marked_complete_as_first_attempt',
          })
        }

        fixed++
      }
    }

    return NextResponse.json({
      message: `Fixed ${fixed} incomplete first attempts`,
      changes,
    })
  } catch (error) {
    console.error('Fix incomplete attempts error:', error)
    return NextResponse.json({ error: 'Failed to fix attempts' }, { status: 500 })
  }
}
