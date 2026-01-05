import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        levels: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    return NextResponse.json({ subjects })
  } catch (error) {
    console.error('Get subjects error:', error)
    return NextResponse.json({ error: 'Failed to get subjects' }, { status: 500 })
  }
}
