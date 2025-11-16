import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, userId, title, description, diagramCode, diagramType, context } = body

    // Validate required fields
    if (!projectId || !userId || !title || !diagramCode) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: projectId, userId, title, diagramCode' },
        { status: 400 }
      )
    }

    // Save the diagram to the database
    const savedDiagram = await prisma.savedDiagram.create({
      data: {
        projectId,
        userId,
        title,
        description: description || null,
        diagramCode,
        diagramType: diagramType || null,
        context: context || null,
      }
    })

    return NextResponse.json({
      success: true,
      data: savedDiagram
    })
  } catch (error) {
    console.error('Error saving diagram:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save diagram'
      },
      { status: 500 }
    )
  }
}
