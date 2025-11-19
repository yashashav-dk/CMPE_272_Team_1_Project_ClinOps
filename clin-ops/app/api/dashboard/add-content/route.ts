import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { parseTabContent } from '@/services/dashboard-parser'
import { restructureToJSON, structuredToDashboardWidgets } from '@/services/mcp-data-restructurer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, userId, tabType, content, persona, useStructured = false } = body

    // Validate required fields
    if (!projectId || !userId || !tabType || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: projectId, userId, tabType, content' },
        { status: 400 }
      )
    }

    let widgetData: any[] = []

    if (useStructured) {
      // NEW: Use MCP restructuring for better data extraction
      console.log(`Using structured MCP restructuring for ${tabType}`)

      const structuredResponse = await restructureToJSON(
        content,
        tabType,
        persona || 'trialCoordinator',
        projectId
      )

      widgetData = structuredToDashboardWidgets(structuredResponse, projectId, userId)
    } else {
      // LEGACY: Use markdown parsing
      console.log(`Using legacy markdown parsing for ${tabType}`)

      const parseResult = parseTabContent(tabType, content)

      if (parseResult.widgets.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No parseable content found in the provided text' },
          { status: 400 }
        )
      }

      widgetData = parseResult.widgets.map((widget) => ({
        projectId,
        userId,
        tabType,
        widgetType: widget.widgetType,
        title: widget.title,
        content: widget.content,
        rawContent: widget.rawContent,
        order: widget.order
      }))
    }

    // Delete existing widgets from this tab for this project (to avoid duplicates)
    await prisma.dashboardWidget.deleteMany({
      where: {
        projectId,
        tabType
      }
    })

    // Create dashboard widgets
    const widgets = await Promise.all(
      widgetData.map((data) =>
        prisma.dashboardWidget.create({
          data
        })
      )
    )

    return NextResponse.json({
      success: true,
      data: {
        widgetsCreated: widgets.length,
        widgets,
        mode: useStructured ? 'structured' : 'parsed'
      }
    })
  } catch (error) {
    console.error('Error adding content to dashboard:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add content to dashboard'
      },
      { status: 500 }
    )
  }
}
