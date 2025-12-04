/**
 * Tests for AI Chat service
 */

import { saveChatData, loadChatData, clearChatData, autoSaveChatData, ChatMessage } from '../services/aiChat'
import { req } from '../services/_req'

// Mock the request utility
jest.mock('../services/_req', () => ({
    req: {
        post: jest.fn(),
        get: jest.fn(),
        put: jest.fn()
    }
}))

describe('AI Chat Service', () => {
    const mockProjectId = 'project-123'
    const mockUserId = 'user-456'
    const mockMessages: ChatMessage[] = [
        { text: 'Hello', sender: 'user', timestamp: '2025-01-01T00:00:00Z' },
        { text: 'Hi there', sender: 'ai', timestamp: '2025-01-01T00:00:01Z' }
    ]

    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    describe('saveChatData', () => {
        test('should successfully save chat data', async () => {
            const mockResponse = {
                success: true,
                data: { id: 'chat-1' }
            }
                ; (req.post as jest.Mock).mockResolvedValue(mockResponse)

            const result = await saveChatData(mockProjectId, mockUserId, mockMessages)

            expect(req.post).toHaveBeenCalledWith('/api/ai/chat/save', expect.objectContaining({
                projectId: mockProjectId,
                userId: mockUserId,
                messages: mockMessages
            }))
            expect(result).toEqual(mockResponse)
        })

        test('should handle nested response structure', async () => {
            const mockResponse = {
                success: true,
                message: 'Saved'
            }
                ; (req.post as jest.Mock).mockResolvedValue(mockResponse)

            const result = await saveChatData(mockProjectId, mockUserId, mockMessages)

            expect(result).toEqual(mockResponse)
        })

        test('should handle API errors', async () => {
            const mockError = new Error('Network Error')
                ; (req.post as jest.Mock).mockRejectedValue(mockError)

            const result = await saveChatData(mockProjectId, mockUserId, mockMessages)

            expect(result.success).toBe(false)
            expect(result.error).toBe('Network Error')
        })

        test('should throw error if projectId is missing', async () => {
            const result = await saveChatData('', mockUserId, mockMessages)
            expect(result.success).toBe(false)
            expect(result.error).toContain('Project ID is required')
        })
    })

    describe('loadChatData', () => {
        test('should successfully load chat data', async () => {
            const mockResponse = {
                success: true,
                data: {
                    messages: mockMessages
                }
            }
                ; (req.get as jest.Mock).mockResolvedValue(mockResponse)

            const result = await loadChatData(mockProjectId)

            expect(req.get).toHaveBeenCalledWith(`/api/ai/chat/${mockProjectId}`)
            expect(result).toEqual(mockResponse)
        })

        test('should handle API errors', async () => {
            const mockError = new Error('Not Found')
                ; (req.get as jest.Mock).mockRejectedValue(mockError)

            const result = await loadChatData(mockProjectId)

            expect(result.success).toBe(false)
            expect(result.error).toBe('Not Found')
        })
    })

    describe('clearChatData', () => {
        test('should successfully clear chat data', async () => {
            const mockResponse = {
                success: true
            }
                ; (req.put as jest.Mock).mockResolvedValue(mockResponse)

            const result = await clearChatData(mockProjectId)

            expect(req.put).toHaveBeenCalledWith(`/api/ai/chat/clear/${mockProjectId}`)
            expect(result).toEqual(mockResponse)
        })
    })

    describe('autoSaveChatData', () => {
        test('should debounce save calls', () => {
            const mockResponse = { data: { success: true } }
                ; (req.post as jest.Mock).mockResolvedValue(mockResponse)

            // Call multiple times rapidly
            autoSaveChatData(mockProjectId, mockUserId, mockMessages, undefined, undefined, undefined, undefined, undefined, 1000)
            autoSaveChatData(mockProjectId, mockUserId, mockMessages, undefined, undefined, undefined, undefined, undefined, 1000)
            autoSaveChatData(mockProjectId, mockUserId, mockMessages, undefined, undefined, undefined, undefined, undefined, 1000)

            // Should not have called yet
            expect(req.post).not.toHaveBeenCalled()

            // Fast forward time
            jest.runAllTimers()

            // Should have called only once
            expect(req.post).toHaveBeenCalledTimes(1)
        })
    })
})
