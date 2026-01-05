import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { generateQuiz } from '@/lib/quiz-generator'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const levelId = searchParams.get('levelId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: Record<string, unknown> = {}

    if (subjectId) {
      where.category = { subjectId }
    }
    if (levelId) {
      where.category = { ...where.category as object, levelId }
    }
    if (search) {
      where.category = {
        ...where.category as object,
        topicName: { contains: search },
      }
    }

    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        include: {
          category: {
            include: {
              subject: true,
              level: true,
            },
          },
          creator: {
            select: { id: true, displayName: true },
          },
          _count: { select: { attempts: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.quiz.count({ where }),
    ])

    return NextResponse.json({
      quizzes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get quizzes error:', error)
    return NextResponse.json({ error: 'Failed to get quizzes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subjectId, levelId, topicName, questionCount, timeLimitMinutes } = await request.json()

    // Validate inputs
    if (!subjectId || !levelId || !topicName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const count = questionCount || 10
    if (count < 10 || count > 20) {
      return NextResponse.json({ error: 'Question count must be 10-20' }, { status: 400 })
    }

    // Get subject and level details
    const [subject, level] = await Promise.all([
      prisma.subject.findUnique({ where: { id: subjectId } }),
      prisma.level.findUnique({ where: { id: levelId } }),
    ])

    if (!subject || !level) {
      return NextResponse.json({ error: 'Invalid subject or level' }, { status: 400 })
    }

    // Generate quiz using LLM
    const questions = await generateQuiz({
      subject: subject.name,
      level: level.name,
      topic: topicName,
      questionCount: count,
    })

    // Create category and quiz
    const category = await prisma.category.create({
      data: {
        subjectId,
        levelId,
        topicName,
        createdBy: session.userId,
      },
    })

    const quiz = await prisma.quiz.create({
      data: {
        categoryId: category.id,
        questions: JSON.stringify({ questions }),
        questionCount: count,
        timeLimitMinutes: timeLimitMinutes || null,
        createdBy: session.userId,
      },
      include: {
        category: {
          include: {
            subject: true,
            level: true,
          },
        },
      },
    })

    return NextResponse.json({ quiz })
  } catch (error) {
    console.error('Create quiz error:', error)
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 })
  }
}
