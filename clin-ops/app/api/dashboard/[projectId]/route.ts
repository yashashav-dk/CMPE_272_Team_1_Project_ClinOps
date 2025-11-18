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

    // If no widgets exist yet, provide sensible default KPI widgets in-memory
    const effectiveWidgets = (() => {
      if (widgets.length > 0) return widgets

      const now = new Date()

      return [
        {
          id: 'default-enrollment-kpi',
          projectId,
          userId: 'system',
          tabType: 'recruitment',
          widgetType: 'kpi',
          title: 'Enrollment Progress',
          content: {
            value: 0,
            target: 100,
            unit: 'subjects',
            status: 'on-track'
          },
          rawContent: JSON.stringify({
            type: 'kpi',
            title: 'Enrollment Progress',
            content: {
              value: 0,
              target: 100,
              unit: 'subjects',
              status: 'on-track'
            },
            order: 0
          }),
          order: 0,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'default-screen-failure-kpi',
          projectId,
          userId: 'system',
          tabType: 'recruitment',
          widgetType: 'kpi',
          title: 'Screen Failure Rate',
          content: {
            value: 0,
            target: 10,
            unit: '%',
            status: 'on-track'
          },
          rawContent: JSON.stringify({
            type: 'kpi',
            title: 'Screen Failure Rate',
            content: {
              value: 0,
              target: 10,
              unit: '%',
              status: 'on-track'
            },
            order: 1
          }),
          order: 1,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'default-retention-kpi',
          projectId,
          userId: 'system',
          tabType: 'operations',
          widgetType: 'kpi',
          title: 'Participant Retention',
          content: {
            value: 100,
            target: 100,
            unit: '%',
            status: 'on-track'
          },
          rawContent: JSON.stringify({
            type: 'kpi',
            title: 'Participant Retention',
            content: {
              value: 100,
              target: 100,
              unit: '%',
              status: 'on-track'
            },
            order: 2
          }),
          order: 2,
          createdAt: now,
          updatedAt: now
        }
      ]
    })()

    // Group widgets by tab type for easier rendering
    const widgetsByTab = effectiveWidgets.reduce((acc, widget) => {
      if (!acc[widget.tabType]) {
        acc[widget.tabType] = []
      }
      acc[widget.tabType].push(widget)
      return acc
    }, {} as Record<string, typeof effectiveWidgets>)

    return NextResponse.json({
      success: true,
      data: {
        widgets: effectiveWidgets,
        widgetsByTab,
        totalWidgets: effectiveWidgets.length,
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
