import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const quiz = await prisma.quiz.findUnique({
      where: { id },
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
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    return NextResponse.json({ quiz })
  } catch (error) {
    console.error('Get quiz error:', error)
    return NextResponse.json({ error: 'Failed to get quiz' }, { status: 500 })
  }
}
