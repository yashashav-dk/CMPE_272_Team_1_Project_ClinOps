/**
 * Unit Tests for Service Utilities
 */

import { req } from '../../services/_req'
import { generateAIResponse, chatWithAI } from '../../services/ai-client'

// Mock fetch
global.fetch = jest.fn()

// Mock req for ai-client tests
jest.mock('../../services/_req', () => ({
    req: {
        post: jest.fn(),
        get: jest.fn(),
        put: jest.fn()
    }
}))

// _req tests will be in a separate file to avoid mock conflicts


// Re-write to handle mocking correctly
// We will create a separate test file for _req if needed, or use doMock.
// Let's try to put everything here but use doMock.

describe('ai-client', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('generateAIResponse calls req.post', async () => {
        const mockResponse = { success: true, response: 'AI Response' }
            ; (req.post as jest.Mock).mockResolvedValue(mockResponse)

        const result = await generateAIResponse('test prompt')

        expect(req.post).toHaveBeenCalledWith('/api/ai/generate', {
            prompt: 'test prompt',
            options: undefined,
            forceRefresh: false
        })
        expect(result).toEqual(mockResponse)
    })

    test('generateAIResponse handles errors', async () => {
        ; (req.post as jest.Mock).mockRejectedValue(new Error('API Error'))

        const result = await generateAIResponse('test prompt')

        expect(result).toEqual({
            success: false,
            error: 'API Error'
        })
    })

    test('chatWithAI formats messages', async () => {
        const mockResponse = { success: true, response: 'Chat Response' }
            ; (req.post as jest.Mock).mockResolvedValue(mockResponse)

        const messages = [
            { role: 'user' as const, content: 'Hello' },
            { role: 'assistant' as const, content: 'Hi' }
        ]

        await chatWithAI(messages)

        expect(req.post).toHaveBeenCalledWith('/api/ai/generate', expect.objectContaining({
            prompt: 'USER: Hello\n\nASSISTANT: Hi'
        }))
    })
})
