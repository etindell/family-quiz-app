import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: subjectId } = await params
    const { levelId } = await request.json()

    if (!levelId) {
      return NextResponse.json({ error: 'Level ID is required' }, { status: 400 })
    }

    // Verify the level belongs to the subject
    const level = await prisma.level.findFirst({
      where: { id: levelId, subjectId },
    })

    if (!level) {
      return NextResponse.json({ error: 'Invalid level for this subject' }, { status: 400 })
    }

    // Upsert user's subject level
    const userSubjectLevel = await prisma.userSubjectLevel.upsert({
      where: {
        userId_subjectId: {
          userId: session.userId,
          subjectId,
        },
      },
      update: { currentLevelId: levelId },
      create: {
        userId: session.userId,
        subjectId,
        currentLevelId: levelId,
      },
      include: {
        currentLevel: true,
        suggestedLevel: true,
      },
    })

    return NextResponse.json({ userSubjectLevel })
  } catch (error) {
    console.error('Update user level error:', error)
    return NextResponse.json({ error: 'Failed to update level' }, { status: 500 })
  }
}
