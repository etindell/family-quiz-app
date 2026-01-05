import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

interface Question {
  id: string
  correct_answer: string
  level: string
  level_id: string
}

interface Answer {
  question_id: string
  selected_answer: string
}

interface LevelScore {
  level_id: string
  level_name: string
  correct: number
  total: number
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        subject: true,
        suggestedLevel: true,
      },
    })

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    if (assessment.userId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ assessment })
  } catch (error) {
    console.error('Get assessment error:', error)
    return NextResponse.json({ error: 'Failed to get assessment' }, { status: 500 })
  }
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
    const { answers } = await request.json() as { answers: Answer[] }

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        subject: {
          include: {
            levels: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    })

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    if (assessment.userId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (assessment.completedAt) {
      return NextResponse.json({ error: 'Assessment already completed' }, { status: 400 })
    }

    // Calculate scores
    const questions = JSON.parse(assessment.questions).questions as Question[]
    const levelScores: Record<string, LevelScore> = {}

    // Initialize scores for all levels
    assessment.subject.levels.forEach((level) => {
      levelScores[level.id] = {
        level_id: level.id,
        level_name: level.name,
        correct: 0,
        total: 0,
      }
    })

    // Calculate per-level scores
    questions.forEach((q) => {
      const answer = answers.find((a) => a.question_id === q.id)
      const levelId = q.level_id

      if (levelScores[levelId]) {
        levelScores[levelId].total++
        if (answer?.selected_answer === q.correct_answer) {
          levelScores[levelId].correct++
        }
      }
    })

    const scores = Object.values(levelScores).filter((s) => s.total > 0)

    // Find suggested level: one level above highest level with >= 70%
    let suggestedLevelId: string | null = null
    const sortedLevels = assessment.subject.levels

    for (let i = sortedLevels.length - 1; i >= 0; i--) {
      const level = sortedLevels[i]
      const score = levelScores[level.id]

      if (score && score.total > 0) {
        const percentage = (score.correct / score.total) * 100

        if (percentage >= 70) {
          // Suggest the next level, or this one if it's the highest
          suggestedLevelId = sortedLevels[i + 1]?.id || level.id
          break
        }
      }
    }

    // If no level reached 70%, suggest the first level
    if (!suggestedLevelId) {
      suggestedLevelId = sortedLevels[0]?.id || null
    }

    // Process answers for storage
    const processedAnswers = answers.map((a) => {
      const q = questions.find((q) => q.id === a.question_id)
      return {
        question_id: a.question_id,
        selected_answer: a.selected_answer,
        is_correct: q?.correct_answer === a.selected_answer,
      }
    })

    // Update assessment
    const updatedAssessment = await prisma.assessment.update({
      where: { id },
      data: {
        answers: JSON.stringify({ answers: processedAnswers }),
        scoreByLevel: JSON.stringify({ scores }),
        suggestedLevelId,
        completedAt: new Date(),
      },
      include: {
        suggestedLevel: true,
      },
    })

    // Update user's subject level
    if (suggestedLevelId) {
      await prisma.userSubjectLevel.upsert({
        where: {
          userId_subjectId: {
            userId: session.userId,
            subjectId: assessment.subjectId,
          },
        },
        update: {
          suggestedLevelId,
          lastAssessedAt: new Date(),
        },
        create: {
          userId: session.userId,
          subjectId: assessment.subjectId,
          currentLevelId: suggestedLevelId,
          suggestedLevelId,
          lastAssessedAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      assessment: updatedAssessment,
      scores,
      suggestedLevel: updatedAssessment.suggestedLevel,
    })
  } catch (error) {
    console.error('Submit assessment error:', error)
    return NextResponse.json({ error: 'Failed to submit assessment' }, { status: 500 })
  }
}
