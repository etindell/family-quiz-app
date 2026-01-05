import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        levels: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    return NextResponse.json({ subject })
  } catch (error) {
    console.error('Get subject error:', error)
    return NextResponse.json({ error: 'Failed to get subject' }, { status: 500 })
  }
}
