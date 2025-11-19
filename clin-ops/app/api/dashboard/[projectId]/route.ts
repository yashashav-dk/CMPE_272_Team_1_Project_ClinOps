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

    // Retrieve all dashboard widgets for this project
    const widgets = await prisma.dashboardWidget.findMany({
      where: {
        projectId
      },
      orderBy: [
        { tabType: 'asc' },
        { order: 'asc' }
      ]
    })

    // Group widgets by tab type for easier rendering
    const widgetsByTab = widgets.reduce((acc, widget) => {
      if (!acc[widget.tabType]) {
        acc[widget.tabType] = []
      }
      acc[widget.tabType].push(widget)
      return acc
    }, {} as Record<string, typeof widgets>)

    return NextResponse.json({
      success: true,
      data: {
        widgets,
        widgetsByTab,
        totalWidgets: widgets.length,
        tabCount: Object.keys(widgetsByTab).length
      }
    })
  } catch (error) {
    console.error('Error retrieving dashboard widgets:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve dashboard widgets'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params
    const { searchParams } = new URL(request.url)
    const widgetId = searchParams.get('widgetId')

    if (widgetId) {
      // Delete specific widget
      await prisma.dashboardWidget.delete({
        where: {
          id: widgetId
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Widget deleted successfully'
      })
    } else {
      // Delete all widgets for this project
      const result = await prisma.dashboardWidget.deleteMany({
        where: {
          projectId
        }
      })

      return NextResponse.json({
        success: true,
        message: `Deleted ${result.count} widgets`
      })
    }
  } catch (error) {
    console.error('Error deleting dashboard widget:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete widget'
      },
      { status: 500 }
    )
  }
}
