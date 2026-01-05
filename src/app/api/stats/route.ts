import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const session = await getSession()
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastQuizDate: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get total first attempts and questions answered
    const attempts = await prisma.attempt.findMany({
      where: {
        userId: session.userId,
        isFirstAttempt: true,
      },
      select: {
        score: true,
        totalQuestions: true,
      },
    })

    const totalQuizzes = attempts.length
    const totalQuestions = attempts.reduce((sum, a) => sum + a.totalQuestions, 0)
    const totalCorrect = attempts.reduce((sum, a) => sum + a.score, 0)
    const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

    // Get quizzes this week
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const quizzesThisWeek = await prisma.attempt.count({
      where: {
        userId: session.userId,
        isFirstAttempt: true,
        completedAt: { gte: weekAgo },
      },
    })

    // Get recent activity
    const recentAttempts = await prisma.attempt.findMany({
      where: { userId: session.userId },
      orderBy: { completedAt: 'desc' },
      take: 5,
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

    // Get per-subject stats
    const subjects = await prisma.subject.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        levels: { orderBy: { sortOrder: 'asc' } },
        userSubjectLevels: {
          where: { userId: session.userId },
          include: { currentLevel: true, suggestedLevel: true },
        },
      },
    })

    const subjectStats = await Promise.all(
      subjects.map(async (subject) => {
        const subjectAttempts = await prisma.attempt.findMany({
          where: {
            userId: session.userId,
            isFirstAttempt: true,
            quiz: { category: { subjectId: subject.id } },
          },
          select: {
            score: true,
            totalQuestions: true,
            quiz: {
              select: {
                category: { select: { levelId: true } },
              },
            },
          },
        })

        const userLevel = subject.userSubjectLevels[0]

        return {
          subject: {
            id: subject.id,
            name: subject.name,
            icon: subject.icon,
          },
          currentLevel: userLevel?.currentLevel || null,
          suggestedLevel: userLevel?.suggestedLevel || null,
          quizzesCompleted: subjectAttempts.length,
          accuracy:
            subjectAttempts.length > 0
              ? Math.round(
                  (subjectAttempts.reduce((sum, a) => sum + a.score, 0) /
                    subjectAttempts.reduce((sum, a) => sum + a.totalQuestions, 0)) *
                    100
                )
              : 0,
        }
      })
    )

    return NextResponse.json({
      streak: {
        current: user.currentStreak,
        longest: user.longestStreak,
        lastQuizDate: user.lastQuizDate,
      },
      overall: {
        totalQuizzes,
        totalQuestions,
        overallAccuracy,
        quizzesThisWeek,
      },
      recentActivity: recentAttempts.map((a) => ({
        id: a.id,
        quizId: a.quizId,
        topic: a.quiz.category.topicName,
        subject: a.quiz.category.subject.name,
        level: a.quiz.category.level.name,
        score: a.score,
        totalQuestions: a.totalQuestions,
        completedAt: a.completedAt,
        isFirstAttempt: a.isFirstAttempt,
      })),
      subjectStats,
    })
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 })
  }
}
