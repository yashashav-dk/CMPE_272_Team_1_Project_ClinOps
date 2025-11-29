/**
 * Integration Tests for AI API
 */

import { POST as generateHandler } from '../../app/api/ai/generate/route'
import { POST as saveChatHandler } from '../../app/api/ai/chat/save/route'
import { GET as getChatHandler } from '../../app/api/ai/chat/[projectId]/route'
import { POST as feedbackHandler } from '../../app/api/ai/feedback/route'

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
            text() {
                return Promise.resolve(this.body as string)
            }
        }
    }
})

const { NextRequest } = require('next/server')

// Mock dependencies
jest.mock('@/lib/prisma', () => {
    const mockClient = {
        aiResponseCache: {
            findUnique: jest.fn(),
            upsert: jest.fn()
        },
        project: {
            upsert: jest.fn()
        },
        chatHistory: {
            create: jest.fn(),
            findFirst: jest.fn()
        },
        message: {
            create: jest.fn()
        },
        tabContent: {
            create: jest.fn()
        },
        tabContentGeneration: {
            create: jest.fn()
        },
        $transaction: jest.fn((callback) => callback(mockClient))
    }
    return {
        __esModule: true,
        default: mockClient,
        prisma: mockClient
    }
})

jest.mock('../../services/ai', () => ({
    callExternalAI: jest.fn()
}))

import prisma from '@/lib/prisma'
import { callExternalAI } from '../../services/ai'

describe('AI API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('POST /api/ai/generate', () => {
        test('should generate new response if not cached', async () => {
            const body = { prompt: 'Hello', projectId: 'p1' }
            const req = new NextRequest('http://localhost/api/ai/generate', {
                method: 'POST',
                body: JSON.stringify(body)
            })

                ; (prisma.aiResponseCache.findUnique as jest.Mock).mockResolvedValue(null)
                ; (callExternalAI as jest.Mock).mockResolvedValue({
                    success: true,
                    response: 'AI Response'
                })

            const res = await generateHandler(req)
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.response).toBe('AI Response')
            expect(data.cached).toBe(false)
            expect(callExternalAI).toHaveBeenCalled()
        })

        test('should return cached response', async () => {
            const body = { prompt: 'Hello', projectId: 'p1' }
            const req = new NextRequest('http://localhost/api/ai/generate', {
                method: 'POST',
                body: JSON.stringify(body)
            })

                ; (prisma.aiResponseCache.findUnique as jest.Mock).mockResolvedValue({
                    response: 'Cached Response',
                    updatedAt: new Date()
                })

            const res = await generateHandler(req)
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.response).toBe('Cached Response')
            expect(data.cached).toBe(true)
            expect(callExternalAI).not.toHaveBeenCalled()
        })
    })

    describe('POST /api/ai/chat/save', () => {
        test('should save chat session', async () => {
            const body = {
                projectId: 'p1',
                userId: 'u1',
                messages: [{ text: 'Hi', sender: 'user' }]
            }
            const req = new NextRequest('http://localhost/api/ai/chat/save', {
                method: 'POST',
                body: JSON.stringify(body)
            })

            const res = await saveChatHandler(req)
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.success).toBe(true)
            expect(prisma.$transaction).toHaveBeenCalled()
            expect(prisma.project.upsert).toHaveBeenCalled()
            expect(prisma.chatHistory.create).toHaveBeenCalled()
            expect(prisma.message.create).toHaveBeenCalled()
        })

        test('should fail if required fields missing', async () => {
            const body = {
                // Missing projectId and userId
            }
            const req = new NextRequest('http://localhost/api/ai/chat/save', {
                method: 'POST',
                body: JSON.stringify(body)
            })

            const res = await saveChatHandler(req)
            expect(res.status).toBe(400)
        })
    })

    describe('GET /api/ai/chat/[projectId]', () => {
        test('should return chat history', async () => {
            const params = Promise.resolve({ projectId: 'p1' })
            const req = new NextRequest('http://localhost/api/ai/chat/p1', { method: 'GET' })

                ; (prisma.chatHistory.findFirst as jest.Mock).mockResolvedValue({
                    id: 'c1',
                    projectId: 'p1',
                    userId: 'u1',
                    messages: [],
                    tabContents: [],
                    tabGenerations: []
                })

            const context = { params }
            const res = await getChatHandler(req, context)
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data.id).toBe('c1')
        })
    })

    describe('POST /api/ai/feedback', () => {
        test('should record feedback', async () => {
            const body = { type: 'up' }
            const req = new NextRequest('http://localhost/api/ai/feedback', {
                method: 'POST',
                body: JSON.stringify(body)
            })

            const res = await feedbackHandler(req)
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.success).toBe(true)
        })
    })
})
