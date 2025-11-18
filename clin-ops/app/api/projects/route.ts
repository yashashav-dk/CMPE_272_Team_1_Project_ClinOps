import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { getLogger } from '@/lib/logger'
import { recordHttpRequest, startTimer } from '@/lib/metrics'

/**
 * GET /api/projects
 * Get all projects for current user
 */
export async function GET(request: NextRequest) {
  try {
    const cid = request.headers.get('x-correlation-id') || undefined
    const logger = getLogger(cid)
    const end = startTimer({ method: 'GET', route: '/api/projects' })
    const payload = await verifyAuth(request)
    if (!payload) {
      recordHttpRequest('GET', '/api/projects', 401)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      where: {
        userId: payload.userId
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    const res = NextResponse.json({
      success: true,
      data: projects
    })
    recordHttpRequest('GET', '/api/projects', 200)
    end({ status: '200' as any })
    logger.info({ userId: payload.userId, count: projects.length }, 'Fetched projects')
    return res
  } catch (error) {
    recordHttpRequest('GET', '/api/projects', 500)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const cid = request.headers.get('x-correlation-id') || undefined
    const logger = getLogger(cid)
    const end = startTimer({ method: 'POST', route: '/api/projects' })
    const payload = await verifyAuth(request)
    if (!payload) {
      recordHttpRequest('POST', '/api/projects', 401)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name?.trim()) {
      recordHttpRequest('POST', '/api/projects', 400)
      const res = NextResponse.json(
        { success: false, error: 'Project name is required' },
        { status: 400 }
      )
      end({ status: '400' as any })
      return res
    }

    const project = await prisma.project.create({
      data: {
        id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: payload.userId,
        name: name.trim(),
        description: description?.trim() || null
      }
    })

    const res = NextResponse.json({
      success: true,
      data: project
    })
    recordHttpRequest('POST', '/api/projects', 201)
    end({ status: '201' as any })
    logger.info({ userId: payload.userId, projectId: project.id }, 'Created project')
    return res
  } catch (error) {
    recordHttpRequest('POST', '/api/projects', 500)
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
