/**
 * Integration Tests for Diagrams API
 */

import { GET as getDiagramsHandler, DELETE as deleteDiagramHandler } from '../../app/api/diagrams/[projectId]/route'
import { POST as saveDiagramHandler } from '../../app/api/diagrams/save/route'

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
                // Mock URL search params
                if (url && url.includes('?')) {
                    const searchParams = new URLSearchParams(url.split('?')[1])
                    this.nextUrl = { searchParams }
                    // Polyfill for URL constructor usage in handlers
                    this.url = url
                } else {
                    this.nextUrl = { searchParams: new URLSearchParams() }
                }
            }
            json() {
                return Promise.resolve(JSON.parse(this.body as string))
            }
        }
    }
})

const { NextRequest } = require('next/server')

// Mock dependencies
jest.mock('@/lib/prisma', () => {
    const mockClient = {
        savedDiagram: {
            findMany: jest.fn(),
            create: jest.fn(),
            delete: jest.fn()
        }
    }
    return {
        __esModule: true,
        default: mockClient,
        prisma: mockClient
    }
})

import prisma from '@/lib/prisma'

describe('Diagrams API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('POST /api/diagrams/save', () => {
        test('should save new diagram', async () => {
            const body = {
                projectId: 'p1',
                userId: 'u1',
                title: 'Diagram 1',
                diagramCode: 'graph TD; A-->B;',
                diagramType: 'mermaid'
            }
            const req = new NextRequest('http://localhost/api/diagrams/save', {
                method: 'POST',
                body: JSON.stringify(body)
            })

                ; (prisma.savedDiagram.create as jest.Mock).mockResolvedValue({
                    id: 'd1',
                    ...body
                })

            const res = await saveDiagramHandler(req)
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data.title).toBe(body.title)
        })

        test('should fail if required fields missing', async () => {
            const body = {
                projectId: 'p1',
                // Missing title and code
            }
            const req = new NextRequest('http://localhost/api/diagrams/save', {
                method: 'POST',
                body: JSON.stringify(body)
            })

            const res = await saveDiagramHandler(req)
            expect(res.status).toBe(400)
        })
    })

    describe('GET /api/diagrams/[projectId]', () => {
        test('should return diagrams for project', async () => {
            const params = Promise.resolve({ projectId: 'p1' })
            const req = new NextRequest('http://localhost/api/diagrams/p1', { method: 'GET' })

            const mockDiagrams = [
                { id: 'd1', title: 'D1' },
                { id: 'd2', title: 'D2' }
            ]

                ; (prisma.savedDiagram.findMany as jest.Mock).mockResolvedValue(mockDiagrams)

            const context = { params }
            const res = await getDiagramsHandler(req, context)
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.data).toHaveLength(2)
            expect(prisma.savedDiagram.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { projectId: 'p1' }
            }))
        })
    })

    describe('DELETE /api/diagrams/[projectId]', () => {
        test('should delete diagram', async () => {
            const params = Promise.resolve({ projectId: 'p1' })
            const req = new NextRequest('http://localhost/api/diagrams/p1?diagramId=d1', { method: 'DELETE' })

            const context = { params }
            const res = await deleteDiagramHandler(req, context)
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.success).toBe(true)
            expect(prisma.savedDiagram.delete).toHaveBeenCalledWith({
                where: { id: 'd1' }
            })
        })

        test('should fail if diagramId missing', async () => {
            const params = Promise.resolve({ projectId: 'p1' })
            const req = new NextRequest('http://localhost/api/diagrams/p1', { method: 'DELETE' })

            const context = { params }
            const res = await deleteDiagramHandler(req, context)

            expect(res.status).toBe(400)
        })
    })
})
