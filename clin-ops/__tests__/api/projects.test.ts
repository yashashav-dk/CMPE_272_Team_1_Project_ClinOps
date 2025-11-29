/**
 * Integration Tests for Project API
 */

import { GET as listProjectsHandler, POST as createProjectHandler } from '../../app/api/projects/route'
import { GET as getProjectHandler, PATCH as updateProjectHandler, DELETE as deleteProjectHandler } from '../../app/api/projects/[projectId]/route'
import { POST as ensureProjectHandler } from '../../app/api/projects/ensure/route'

// Mock next/server
jest.mock('next/server', () => {
    return {
        NextResponse: {
            json: jest.fn((body, init) => ({
                status: init?.status || 200,
                json: async () => body,
            }))
        },
        NextRequest: class {
            constructor(url, init) {
                this.url = url
                this.method = init?.method || 'GET'
                this.body = init?.body
                this.headers = new Map(Object.entries(init?.headers || {}))
            }
            json() {
                return Promise.resolve(JSON.parse(this.body as string))
            }
        }
    }
})

const { NextRequest } = require('next/server')

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: {
        project: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        }
    }
}))

jest.mock('@/lib/auth', () => ({
    verifyAuth: jest.fn()
}))

jest.mock('@/lib/logger', () => ({
    getLogger: jest.fn(() => ({
        info: jest.fn(),
        error: jest.fn()
    }))
}))

jest.mock('@/lib/metrics', () => ({
    recordHttpRequest: jest.fn(),
    startTimer: jest.fn(() => jest.fn())
}))

import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

describe('Project API', () => {
    const mockUser = { userId: 'user-1' }

    beforeEach(() => {
        jest.clearAllMocks()
            ; (verifyAuth as jest.Mock).mockResolvedValue(mockUser)
    })

    describe('GET /api/projects', () => {
        test('should return user projects', async () => {
            const req = new NextRequest('http://localhost/api/projects', { method: 'GET' })
            const mockProjects = [{ id: 'p1', name: 'Project 1', userId: 'user-1' }]

                ; (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects)

            const res = await listProjectsHandler(req)
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data).toHaveLength(1)
            expect(prisma.project.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { userId: 'user-1' }
            }))
        })

        test('should return 401 if unauthorized', async () => {
            ; (verifyAuth as jest.Mock).mockResolvedValue(null)
            const req = new NextRequest('http://localhost/api/projects', { method: 'GET' })

            const res = await listProjectsHandler(req)
            expect(res.status).toBe(401)
        })
    })

    describe('POST /api/projects', () => {
        test('should create new project', async () => {
            const body = { name: 'New Project', description: 'Desc' }
            const req = new NextRequest('http://localhost/api/projects', {
                method: 'POST',
                body: JSON.stringify(body)
            })

                ; (prisma.project.create as jest.Mock).mockResolvedValue({
                    id: 'new-p',
                    ...body,
                    userId: 'user-1'
                })

            const res = await createProjectHandler(req)
            const data = await res.json()

            expect(res.status).toBe(200) // The handler returns 200 for success based on code
            expect(data.success).toBe(true)
            expect(data.data.name).toBe(body.name)
        })

        test('should fail if name is missing', async () => {
            const body = { description: 'Desc' }
            const req = new NextRequest('http://localhost/api/projects', {
                method: 'POST',
                body: JSON.stringify(body)
            })

            const res = await createProjectHandler(req)
            expect(res.status).toBe(400)
        })
    })

    describe('GET /api/projects/[projectId]', () => {
        test('should return project if owned by user', async () => {
            const params = Promise.resolve({ projectId: 'p1' })
            const req = new NextRequest('http://localhost/api/projects/p1', { method: 'GET' })

                ; (prisma.project.findUnique as jest.Mock).mockResolvedValue({
                    id: 'p1',
                    userId: 'user-1',
                    name: 'P1'
                })

            const res = await getProjectHandler(req, { params })
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.data.id).toBe('p1')
        })

        test('should return 403 if owned by other user', async () => {
            const params = Promise.resolve({ projectId: 'p1' })
            const req = new NextRequest('http://localhost/api/projects/p1', { method: 'GET' })

                ; (prisma.project.findUnique as jest.Mock).mockResolvedValue({
                    id: 'p1',
                    userId: 'other-user',
                    name: 'P1'
                })

            const res = await getProjectHandler(req, { params })
            expect(res.status).toBe(403)
        })

        test('should return 404 if not found', async () => {
            const params = Promise.resolve({ projectId: 'p1' })
            const req = new NextRequest('http://localhost/api/projects/p1', { method: 'GET' })

                ; (prisma.project.findUnique as jest.Mock).mockResolvedValue(null)

            const res = await getProjectHandler(req, { params })
            expect(res.status).toBe(404)
        })
    })

    describe('PATCH /api/projects/[projectId]', () => {
        test('should update project', async () => {
            const params = Promise.resolve({ projectId: 'p1' })
            const body = { name: 'Updated' }
            const req = new NextRequest('http://localhost/api/projects/p1', {
                method: 'PATCH',
                body: JSON.stringify(body)
            })

                ; (prisma.project.findUnique as jest.Mock).mockResolvedValue({
                    id: 'p1',
                    userId: 'user-1'
                })
                ; (prisma.project.update as jest.Mock).mockResolvedValue({
                    id: 'p1',
                    name: 'Updated'
                })

            const res = await updateProjectHandler(req, { params })
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.data.name).toBe('Updated')
        })
    })

    describe('DELETE /api/projects/[projectId]', () => {
        test('should delete project', async () => {
            const params = Promise.resolve({ projectId: 'p1' })
            const req = new NextRequest('http://localhost/api/projects/p1', { method: 'DELETE' })

                ; (prisma.project.findUnique as jest.Mock).mockResolvedValue({
                    id: 'p1',
                    userId: 'user-1'
                })

            const res = await deleteProjectHandler(req, { params })
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.success).toBe(true)
            expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: 'p1' } })
        })
    })

    describe('POST /api/projects/ensure', () => {
        test('should create project if not exists', async () => {
            const body = { projectId: 'new-p', name: 'New' }
            const req = new NextRequest('http://localhost/api/projects/ensure', {
                method: 'POST',
                body: JSON.stringify(body)
            })

                ; (prisma.project.findUnique as jest.Mock).mockResolvedValue(null)
                ; (prisma.project.create as jest.Mock).mockResolvedValue({
                    id: 'new-p',
                    userId: 'user-1',
                    name: 'New'
                })

            const res = await ensureProjectHandler(req)
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.message).toBe('Project created successfully')
        })

        test('should return existing if owned by user', async () => {
            const body = { projectId: 'p1' }
            const req = new NextRequest('http://localhost/api/projects/ensure', {
                method: 'POST',
                body: JSON.stringify(body)
            })

                ; (prisma.project.findUnique as jest.Mock).mockResolvedValue({
                    id: 'p1',
                    userId: 'user-1'
                })

            const res = await ensureProjectHandler(req)
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.message).toBe('Project already exists')
        })

        test('should fail if owned by other user', async () => {
            const body = { projectId: 'p1' }
            const req = new NextRequest('http://localhost/api/projects/ensure', {
                method: 'POST',
                body: JSON.stringify(body)
            })

                ; (prisma.project.findUnique as jest.Mock).mockResolvedValue({
                    id: 'p1',
                    userId: 'other'
                })

            const res = await ensureProjectHandler(req)
            expect(res.status).toBe(403)
        })
    })
})
