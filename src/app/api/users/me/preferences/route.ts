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
        lastSubjectId: true,
        lastSubject: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      lastSubjectId: user.lastSubjectId,
      lastSubject: user.lastSubject,
    })
  } catch (error) {
    console.error('Get preferences error:', error)
    return NextResponse.json({ error: 'Failed to get preferences' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession()

    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { lastSubjectId } = body

    // Validate subject exists if provided
    if (lastSubjectId) {
      const subject = await prisma.subject.findUnique({
        where: { id: lastSubjectId },
      })
      if (!subject) {
        return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
      }
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { lastSubjectId: lastSubjectId || null },
      select: {
        lastSubjectId: true,
        lastSubject: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    })

    return NextResponse.json({
      lastSubjectId: user.lastSubjectId,
      lastSubject: user.lastSubject,
    })
  } catch (error) {
    console.error('Update preferences error:', error)
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
  }
}
