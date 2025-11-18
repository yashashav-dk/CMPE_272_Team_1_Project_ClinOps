import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const reviews = await prisma.dashboardReview.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    })

    const averageRating = reviews.length
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : null

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        averageRating,
        count: reviews.length
      }
    })
  } catch (error) {
    console.error('Error retrieving dashboard reviews:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve dashboard reviews'
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { authorId, text, rating } = body

    if (!authorId || !text?.trim()) {
      return NextResponse.json(
        { success: false, error: 'authorId and text are required' },
        { status: 400 }
      )
    }

    if (rating != null && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { success: false, error: 'rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const review = await prisma.dashboardReview.create({
      data: {
        projectId,
        authorId,
        text: text.trim(),
        rating: rating ?? null
      }
    })

    return NextResponse.json({
      success: true,
      data: review
    })
  } catch (error) {
    console.error('Error creating dashboard review:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create dashboard review'
      },
      { status: 500 }
    )
  }
}
