import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // Retrieve all saved diagrams for this project
    const diagrams = await prisma.savedDiagram.findMany({
      where: {
        projectId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: diagrams
    })
  } catch (error) {
    console.error('Error retrieving diagrams:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve diagrams'
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
    const diagramId = searchParams.get('diagramId')

    if (!diagramId) {
      return NextResponse.json(
        { success: false, error: 'Diagram ID is required' },
        { status: 400 }
      )
    }

    // Delete the diagram
    await prisma.savedDiagram.delete({
      where: {
        id: diagramId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Diagram deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting diagram:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete diagram'
      },
      { status: 500 }
    )
  }
}
