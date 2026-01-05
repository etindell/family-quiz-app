import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

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

    // Only allow user to view their own attempts
    if (attempt.userId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ attempt })
  } catch (error) {
    console.error('Get attempt error:', error)
    return NextResponse.json({ error: 'Failed to get attempt' }, { status: 500 })
  }
}
