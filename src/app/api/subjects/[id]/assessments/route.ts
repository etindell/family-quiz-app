import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { generateAssessment } from '@/lib/assessment-generator'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: subjectId } = await params

    const assessments = await prisma.assessment.findMany({
      where: {
        userId: session.userId,
        subjectId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        suggestedLevel: true,
      },
    })

    return NextResponse.json({ assessments })
  } catch (error) {
    console.error('Get assessments error:', error)
    return NextResponse.json({ error: 'Failed to get assessments' }, { status: 500 })
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

    const { id: subjectId } = await params

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        levels: { orderBy: { sortOrder: 'asc' } },
      },
    })

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    // Generate assessment questions
    const questions = await generateAssessment(
      subject.name,
      subject.levels.map((l) => ({ id: l.id, name: l.name }))
    )

    // Create assessment
    const assessment = await prisma.assessment.create({
      data: {
        userId: session.userId,
        subjectId,
        questions: JSON.stringify({ questions }),
      },
    })

    return NextResponse.json({ assessment, questions })
  } catch (error) {
    console.error('Create assessment error:', error)
    return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 })
  }
}
