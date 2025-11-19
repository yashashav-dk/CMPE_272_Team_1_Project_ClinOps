import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * PUT /api/dashboard/widget/[widgetId]/data
 * Update widget data (for interactive tables, checklists, etc.)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { widgetId: string } }
) {
  try {
    const { widgetId } = params
    const body = await request.json()
    const { projectId, data } = body

    if (!widgetId || !projectId || !data) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update the widget's content with the new data
    const updatedWidget = await prisma.dashboardWidget.update({
      where: { id: widgetId },
      data: {
        content: data,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedWidget
    })
  } catch (error) {
    console.error('Error updating widget data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update widget data' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/dashboard/widget/[widgetId]/data
 * Get current widget data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { widgetId: string } }
) {
  try {
    const { widgetId } = params

    const widget = await prisma.dashboardWidget.findUnique({
      where: { id: widgetId }
    })

    if (!widget) {
      return NextResponse.json(
        { success: false, error: 'Widget not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: widget.content
    })
  } catch (error) {
    console.error('Error fetching widget data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch widget data' },
      { status: 500 }
    )
  }
}
