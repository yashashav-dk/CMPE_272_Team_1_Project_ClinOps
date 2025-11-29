/**
 * Integration Tests for Dashboard API
 */

import { GET as getWidgetsHandler, DELETE as deleteWidgetsHandler } from '../../app/api/dashboard/[projectId]/route'
import { POST as addContentHandler } from '../../app/api/dashboard/add-content/route'
import { POST as generateStructuredHandler } from '../../app/api/dashboard/generate-structured/route'
import { PUT as updateWidgetHandler, GET as getWidgetHandler } from '../../app/api/dashboard/widget/[widgetId]/data/route'

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
jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: {
        dashboardWidget: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            deleteMany: jest.fn()
        }
    },
    prisma: {
        dashboardWidget: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            deleteMany: jest.fn()
        }
    }
}))

jest.mock('@/services/dashboard-parser', () => ({
    parseTabContent: jest.fn()
}))

jest.mock('@/services/mcp-data-restructurer', () => ({
    restructureToJSON: jest.fn(),
    structuredToDashboardWidgets: jest.fn(),
    generateStructuredContent: jest.fn()
}))

import prisma from '@/lib/prisma'
import { parseTabContent } from '@/services/dashboard-parser'
import { restructureToJSON, structuredToDashboardWidgets, generateStructuredContent } from '@/services/mcp-data-restructurer'

describe('Dashboard API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('GET /api/dashboard/[projectId]', () => {
        test('should return widgets grouped by tab', async () => {
            const params = Promise.resolve({ projectId: 'p1' })
            const req = new NextRequest('http://localhost/api/dashboard/p1', { method: 'GET' })

            const mockWidgets = [
                { id: 'w1', projectId: 'p1', tabType: 'overview', order: 1 },
                { id: 'w2', projectId: 'p1', tabType: 'details', order: 1 }
            ]

                ; (prisma.dashboardWidget.findMany as jest.Mock).mockResolvedValue(mockWidgets)

            const context = { params }
            const res = await getWidgetsHandler(req, context)
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data.widgets).toHaveLength(2)
            expect(data.data.widgetsByTab.overview).toHaveLength(1)
            expect(data.data.widgetsByTab.details).toHaveLength(1)
        })
    })

    describe('DELETE /api/dashboard/[projectId]', () => {
        test('should delete all widgets for project', async () => {
            const params = Promise.resolve({ projectId: 'p1' })
            const req = new NextRequest('http://localhost/api/dashboard/p1', { method: 'DELETE' })

                ; (prisma.dashboardWidget.deleteMany as jest.Mock).mockResolvedValue({ count: 5 })

            const context = { params }
            const res = await deleteWidgetsHandler(req, context)
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.message).toContain('Deleted 5 widgets')
            expect(prisma.dashboardWidget.deleteMany).toHaveBeenCalledWith({
                where: { projectId: 'p1' }
            })
        })

        test('should delete specific widget if widgetId param present', async () => {
            const params = Promise.resolve({ projectId: 'p1' })
            const req = new NextRequest('http://localhost/api/dashboard/p1?widgetId=w1', { method: 'DELETE' })

            const context = { params }
            const res = await deleteWidgetsHandler(req, context)
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(prisma.dashboardWidget.delete).toHaveBeenCalledWith({
                where: { id: 'w1' }
            })
        })
    })

    describe('POST /api/dashboard/add-content', () => {
        test('should add content using legacy parser', async () => {
            const body = {
                projectId: 'p1',
                userId: 'u1',
                tabType: 'overview',
                content: 'raw content'
            }
            const req = new NextRequest('http://localhost/api/dashboard/add-content', {
                method: 'POST',
                body: JSON.stringify(body)
            })

                ; (parseTabContent as jest.Mock).mockReturnValue({
                    widgets: [{ widgetType: 'text', title: 'Title', content: 'Content', order: 1 }]
                })
                ; (prisma.dashboardWidget.create as jest.Mock).mockResolvedValue({ id: 'w1' })

            const res = await addContentHandler(req)
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.data.widgetsCreated).toBe(1)
            expect(data.data.mode).toBe('parsed')
            expect(prisma.dashboardWidget.deleteMany).toHaveBeenCalled()
        })

        test('should add content using structured restructurer', async () => {
            const body = {
                projectId: 'p1',
                userId: 'u1',
                tabType: 'overview',
                content: 'raw content',
                useStructured: true,
                persona: 'analyst'
            }
            const req = new NextRequest('http://localhost/api/dashboard/add-content', {
                method: 'POST',
                body: JSON.stringify(body)
            })

                ; (restructureToJSON as jest.Mock).mockResolvedValue({})
                ; (structuredToDashboardWidgets as jest.Mock).mockReturnValue([
                    { title: 'Widget 1' }
                ])
                ; (prisma.dashboardWidget.create as jest.Mock).mockResolvedValue({ id: 'w1' })

            const res = await addContentHandler(req)
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.data.mode).toBe('structured')
            expect(restructureToJSON).toHaveBeenCalled()
        })
    })

    describe('POST /api/dashboard/generate-structured', () => {
        test('should generate structured content', async () => {
            const body = {
                projectId: 'p1',
                userId: 'u1',
                tabType: 'overview',
                persona: 'analyst',
                projectInfo: 'info'
            }
            const req = new NextRequest('http://localhost/api/dashboard/generate-structured', {
                method: 'POST',
                body: JSON.stringify(body)
            })

                ; (generateStructuredContent as jest.Mock).mockResolvedValue({ metadata: {} })
                ; (structuredToDashboardWidgets as jest.Mock).mockReturnValue([
                    { title: 'Widget 1' }
                ])
                ; (prisma.dashboardWidget.create as jest.Mock).mockResolvedValue({ id: 'w1' })

            const res = await generateStructuredHandler(req)
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.data.widgetsCreated).toBe(1)
            expect(generateStructuredContent).toHaveBeenCalled()
        })
    })

    describe('PUT /api/dashboard/widget/[widgetId]/data', () => {
        test('should update widget data', async () => {
            const params = { widgetId: 'w1' }
            const body = { projectId: 'p1', data: { updated: true } }
            const req = new NextRequest('http://localhost/api/dashboard/widget/w1/data', {
                method: 'PUT',
                body: JSON.stringify(body)
            })

                ; (prisma.dashboardWidget.update as jest.Mock).mockResolvedValue({
                    id: 'w1',
                    content: body.data
                })

            const res = await updateWidgetHandler(req, { params })
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.data.content).toEqual(body.data)
        })
    })
})
