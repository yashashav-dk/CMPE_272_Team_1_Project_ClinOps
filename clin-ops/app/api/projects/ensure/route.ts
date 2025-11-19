import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

/**
 * POST /api/projects/ensure
 * Ensure a project exists in the database - creates it if it doesn't exist
 * This is used to migrate guest projects to the database when users log in
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, name, description } = body

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Check if project already exists
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (existingProject) {
      // Project already exists
      // If it's owned by a different user, don't update
      if (existingProject.userId !== payload.userId) {
        return NextResponse.json(
          { success: false, error: 'Project exists but belongs to another user' },
          { status: 403 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: existingProject,
        message: 'Project already exists'
      })
    }

    // Create the project
    const project = await prisma.project.create({
      data: {
        id: projectId,
        userId: payload.userId,
        name: name || 'Untitled Project',
        description: description || null
      }
    })

    return NextResponse.json({
      success: true,
      data: project,
      message: 'Project created successfully'
    })
  } catch (error) {
    console.error('Error ensuring project exists:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to ensure project exists' },
      { status: 500 }
    )
  }
}
