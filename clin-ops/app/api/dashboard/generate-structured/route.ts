import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateStructuredContent, structuredToDashboardWidgets } from '@/services/mcp-data-restructurer'

/**
 * Generate structured dashboard content directly from project info
 * This is the NEW way - bypasses markdown entirely and generates JSON
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, userId, tabType, persona, projectInfo } = body

    // Validate required fields
    if (!projectId || !userId || !tabType || !persona || !projectInfo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: projectId, userId, tabType, persona, projectInfo'
        },
        { status: 400 }
      )
    }

    console.log(`Generating structured content for ${tabType} (${persona})`)

    // Generate structured content using MCP agent
    const structuredResponse = await generateStructuredContent(
      tabType,
      persona,
      projectInfo,
      projectId
    )

    // Convert to dashboard widget format
    const widgetData = structuredToDashboardWidgets(structuredResponse, projectId, userId)

    // Delete existing widgets from this tab for this project
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
        metadata: structuredResponse.metadata
      }
    })
  } catch (error) {
    console.error('Error generating structured dashboard content:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate structured content'
      },
      { status: 500 }
    )
  }
}
