/**
 * Tests for LLM Service
 */

import {
    getTabDisplayName,
    getSystemPrompt,
    getTabPrompt,
    generateTabContent,
    generateComprehensiveTabContent
} from '../services/llm'
import { generateAIResponse } from '../services/ai-client'

// Mock the AI client
jest.mock('../services/ai-client', () => ({
    generateAIResponse: jest.fn()
}))

describe('LLM Service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getTabDisplayName', () => {
        test('should return correct names for trialCoordinator', () => {
            expect(getTabDisplayName('trialCoordinator', 'trialOverview')).toBe('Trial Overview')
            expect(getTabDisplayName('trialCoordinator', 'taskChecklists')).toBe('Task Checklists')
            expect(getTabDisplayName('trialCoordinator', 'unknown')).toBe('Trial Coordination')
        })

        test('should return correct names for regulatoryAdvisor', () => {
            expect(getTabDisplayName('regulatoryAdvisor', 'protocolRequirements')).toBe('Protocol Requirements')
            expect(getTabDisplayName('regulatoryAdvisor', 'documentControl')).toBe('Document Control')
            expect(getTabDisplayName('regulatoryAdvisor', 'unknown')).toBe('Regulatory Compliance')
        })
    })

    describe('getSystemPrompt', () => {
        test('should return regulatory focused prompt for regulatoryAdvisor', () => {
            const prompt = getSystemPrompt('regulatoryAdvisor', 'protocolRequirements')
            expect(prompt).toContain('Regulatory Compliance AI assistant')
            expect(prompt).toContain('Mermaid.js diagram')
        })

        test('should return operations focused prompt for trialCoordinator', () => {
            const prompt = getSystemPrompt('trialCoordinator', 'trialOverview')
            expect(prompt).toContain('Trial Operations AI assistant')
            expect(prompt).toContain('Mermaid.js diagram')
        })
    })

    describe('getTabPrompt', () => {
        test('should include project info in prompt', () => {
            const projectInfo = { Title: 'Test Trial', Phase: 'III' }
            const prompt = getTabPrompt('trialCoordinator', 'trialOverview', projectInfo)

            expect(prompt).toContain('Title: Test Trial')
            expect(prompt).toContain('Phase: III')
            expect(prompt).toContain('Mermaid.js diagram')
        })

        test('should return specific prompt for known tabs', () => {
            const prompt = getTabPrompt('trialCoordinator', 'trialTimeline')
            expect(prompt).toContain('Gantt chart')
            expect(prompt).toContain('Pre-Study Phase')
        })

        test('should return default prompt for unknown tabs', () => {
            const prompt = getTabPrompt('trialCoordinator', 'customTab')
            expect(prompt).toContain('Generate trial coordination documentation')
        })
    })

    describe('generateTabContent', () => {
        test('should generate content successfully', async () => {
            const mockResponse = {
                success: true,
                response: 'Generated content',
                cached: false
            }
                ; (generateAIResponse as jest.Mock).mockResolvedValue(mockResponse)

            const result = await generateTabContent('trialCoordinator', 'trialOverview')

            expect(generateAIResponse).toHaveBeenCalledTimes(2) // Initial + Refinement
            expect(result).toBe('Generated content')
        })

        test('should return cached content if available', async () => {
            const mockResponse = {
                success: true,
                response: 'Cached content',
                cached: true
            }
                ; (generateAIResponse as jest.Mock).mockResolvedValue(mockResponse)

            const result = await generateTabContent('trialCoordinator', 'trialOverview')

            expect(generateAIResponse).toHaveBeenCalledTimes(1)
            expect(result).toBe('Cached content')
        })

        test('should handle errors gracefully', async () => {
            ; (generateAIResponse as jest.Mock).mockRejectedValue(new Error('API Error'))

            const result = await generateTabContent('trialCoordinator', 'trialOverview')

            expect(result).toContain('(Error)')
            expect(result).toContain('API Error')
        })
    })

    describe('generateComprehensiveTabContent', () => {
        test('should perform multi-step generation', async () => {
            const mockResponse = {
                success: true,
                response: 'Content',
                cached: false
            }
                ; (generateAIResponse as jest.Mock).mockResolvedValue(mockResponse)

            const result = await generateComprehensiveTabContent('trialCoordinator', 'trialOverview')

            // Should call: Initial -> Alternative -> Consolidation -> Polishing
            expect(generateAIResponse).toHaveBeenCalledTimes(4)
            expect(result).toBe('Content')
        })

        test('should return cached comprehensive content', async () => {
            const mockResponse = {
                success: true,
                response: 'Cached Content',
                cached: true
            }
                ; (generateAIResponse as jest.Mock).mockResolvedValue(mockResponse)

            const result = await generateComprehensiveTabContent('trialCoordinator', 'trialOverview')

            expect(generateAIResponse).toHaveBeenCalledTimes(1)
            expect(result).toBe('Cached Content')
        })
    })
})
