/**
 * Tests for AI service wrapper
 */

import { callExternalAI, generateAIResponse, chatWithAI } from '../services/ai'
import { llmService } from '../services/controller/AIController'

// Mock the AIController
jest.mock('../services/controller/AIController', () => ({
    llmService: {
        generateResponse: jest.fn()
    },
    generatePromptHash: jest.fn().mockReturnValue('mock-hash')
}))

describe('AI Service Wrapper', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('callExternalAI', () => {
        test('should successfully call llmService and return response', async () => {
            const mockResponse = 'AI response content'
                ; (llmService.generateResponse as jest.Mock).mockResolvedValue(mockResponse)

            const result = await callExternalAI('test prompt')

            expect(llmService.generateResponse).toHaveBeenCalledWith('test prompt', undefined)
            expect(result).toEqual({
                success: true,
                response: mockResponse,
                cached: false
            })
        })

        test('should handle errors from llmService', async () => {
            const mockError = new Error('API Error')
                ; (llmService.generateResponse as jest.Mock).mockRejectedValue(mockError)

            const result = await callExternalAI('test prompt')

            expect(result).toEqual({
                success: false,
                error: 'API Error'
            })
        })

        test('should pass options to llmService', async () => {
            const options = { temperature: 0.5 }
                ; (llmService.generateResponse as jest.Mock).mockResolvedValue('response')

            await callExternalAI('test prompt', options)

            expect(llmService.generateResponse).toHaveBeenCalledWith('test prompt', options)
        })
    })

    describe('generateAIResponse', () => {
        test('should handle string prompt (legacy format)', async () => {
            ; (llmService.generateResponse as jest.Mock).mockResolvedValue('response')

            const result = await generateAIResponse('test prompt')

            expect(llmService.generateResponse).toHaveBeenCalledWith('test prompt', undefined)
            expect(result.success).toBe(true)
        })

        test('should handle object options (new format)', async () => {
            ; (llmService.generateResponse as jest.Mock).mockResolvedValue('response')

            const options = {
                prompt: 'test prompt',
                projectId: '123',
                persona: 'tester'
            }

            const result = await generateAIResponse(options)

            expect(llmService.generateResponse).toHaveBeenCalledWith('test prompt', undefined)
            expect(result.success).toBe(true)
        })

        test('should pass AI options from new format', async () => {
            ; (llmService.generateResponse as jest.Mock).mockResolvedValue('response')

            const aiOptions = { temperature: 0.8 }
            const options = {
                prompt: 'test prompt',
                options: aiOptions
            }

            await generateAIResponse(options)

            expect(llmService.generateResponse).toHaveBeenCalledWith('test prompt', aiOptions)
        })
    })

    describe('chatWithAI', () => {
        test('should format messages into a single prompt', async () => {
            ; (llmService.generateResponse as jest.Mock).mockResolvedValue('response')

            const messages = [
                { role: 'system' as const, content: 'System prompt' },
                { role: 'user' as const, content: 'User message' }
            ]

            await chatWithAI(messages)

            const expectedPrompt = 'SYSTEM: System prompt\n\nUSER: User message'
            expect(llmService.generateResponse).toHaveBeenCalledWith(expectedPrompt, undefined)
        })
    })
})
