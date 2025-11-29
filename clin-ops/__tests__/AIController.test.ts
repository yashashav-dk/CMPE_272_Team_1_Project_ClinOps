/**
 * Tests for AI Controller
 */

import { llmService, generatePromptHash } from '../services/controller/AIController'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Mock Google Generative AI SDK
jest.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn(),
    HarmCategory: {
        HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
        HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH'
    },
    HarmBlockThreshold: {
        BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE'
    }
}))

describe('AI Controller', () => {
    let mockGenerateContent: jest.Mock
    let mockGetGenerativeModel: jest.Mock

    beforeEach(() => {
        jest.clearAllMocks()

        // Setup mock chain
        mockGenerateContent = jest.fn()
        mockGetGenerativeModel = jest.fn().mockReturnValue({
            generateContent: mockGenerateContent
        })
            ; (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
                getGenerativeModel: mockGetGenerativeModel
            }))

        // Reset environment variables
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key'
    })

    describe('GeminiProvider', () => {
        test('should successfully generate response', async () => {
            mockGenerateContent.mockResolvedValue({
                response: {
                    text: () => 'Generated text'
                }
            })

            // We need to access the private provider to test it directly, 
            // or we can test via llmService if we ensure it's using GeminiProvider
            // Since llmService is a singleton initialized at module load, we might need to rely on its public interface

            const response = await llmService.generateResponse('test prompt')
            expect(response).toBe('Generated text')
            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
                contents: [{ role: 'user', parts: [{ text: 'test prompt' }] }]
            }))
        })

        test('should retry on 503 error', async () => {
            // Fail twice with 503, then succeed
            const error503 = new Error('Service Unavailable')
                ; (error503 as any).status = 503

            mockGenerateContent
                .mockRejectedValueOnce(error503)
                .mockRejectedValueOnce(error503)
                .mockResolvedValue({
                    response: { text: () => 'Success after retry' }
                })

            const response = await llmService.generateResponse('test prompt')
            expect(response).toBe('Success after retry')
            expect(mockGenerateContent).toHaveBeenCalledTimes(3)
        })

        test('should throw on non-retryable error', async () => {
            const error400 = new Error('Bad Request')
                ; (error400 as any).status = 400

            mockGenerateContent.mockRejectedValue(error400)

            await expect(llmService.generateResponse('test prompt'))
                .rejects.toThrow('Failed to generate AI response')
        })
    })

    describe('Fallback Mechanism', () => {
        test('should switch to fallback on configuration error', async () => {
            // Simulate missing API key error from provider
            mockGenerateContent.mockRejectedValue(new Error('API key not configured'))

            const response = await llmService.generateResponse('test prompt')

            expect(response).toContain('fallback mode')
            expect(llmService.isFallbackActive).toBe(true)
        })
    })

    describe('generatePromptHash', () => {
        test('should generate consistent hash for same inputs', () => {
            const hash1 = generatePromptHash('prompt', 'user1', 'proj1')
            const hash2 = generatePromptHash('prompt', 'user1', 'proj1')
            expect(hash1).toBe(hash2)
        })

        test('should generate different hash for different inputs', () => {
            const hash1 = generatePromptHash('prompt1', 'user1')
            const hash2 = generatePromptHash('prompt2', 'user1')
            expect(hash1).not.toBe(hash2)
        })
    })
})
