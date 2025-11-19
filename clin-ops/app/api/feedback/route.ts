import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, persona, tabType, projectId, userId } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Feedback message is required' },
        { status: 400 }
      )
    }

    const feedback = await prisma.feedback.create({
      data: {
        message,
        persona: persona || null,
        tabType: tabType || null,
        projectId: projectId || null,
        userId: userId || null,
      }
    })

    return NextResponse.json({ success: true, data: feedback })
  } catch (error) {
    console.error('Error saving feedback:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save feedback',
      },
      { status: 500 }
    )
  }
}
