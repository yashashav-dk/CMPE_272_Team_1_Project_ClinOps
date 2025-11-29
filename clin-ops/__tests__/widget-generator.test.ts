/**
 * Tests for Widget Generator Service
 */

import * as fs from 'fs'
import { parseLLMResponses, generateWidgetsFromFile } from '../services/widget-generator'
import { restructureToJSON, structuredToDashboardWidgets } from '../services/mcp-data-restructurer'

// Mock fs
jest.mock('fs')

// Mock restructurer
jest.mock('../services/mcp-data-restructurer', () => ({
    restructureToJSON: jest.fn(),
    structuredToDashboardWidgets: jest.fn()
}))

describe('Widget Generator Service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('parseLLMResponses', () => {
        test('should parse valid file content correctly', () => {
            const mockFileContent = `
Agent Persona: Regulatory Advisor
Tab Name: Protocol Requirements
Refresh
Content line 1
Content line 2

Agent Persona: Trial Coordinator
Tab Name: Trial Overview
Refresh
Overview content
`
                ; (fs.readFileSync as jest.Mock).mockReturnValue(mockFileContent)

            const result = parseLLMResponses('dummy/path.txt')

            expect(result).toHaveLength(2)
            expect(result[0].personaName).toContain('Regulatory Advisor')
            expect(result[0].tabs).toHaveLength(1)
            expect(result[0].tabs[0].tabName).toBe('Tab Name: Protocol Requirements')
            expect(result[0].tabs[0].content).toContain('Content line 1')

            expect(result[1].personaName).toContain('Trial Coordinator')
            expect(result[1].tabs[0].tabName).toBe('Tab Name: Trial Overview')
        })

        test('should handle empty file', () => {
            ; (fs.readFileSync as jest.Mock).mockReturnValue('')
            const result = parseLLMResponses('dummy/path.txt')
            expect(result).toHaveLength(0)
        })
    })

    describe('generateWidgetsFromFile', () => {
        const mockParsedContent = `
Agent Persona: Trial Coordinator
Tab Name: Trial Overview
Refresh
Some content
`

        beforeEach(() => {
            ; (fs.readFileSync as jest.Mock).mockReturnValue(mockParsedContent)
                ; (restructureToJSON as jest.Mock).mockResolvedValue({
                    widgets: [{ id: 'w1', type: 'text' }]
                })
                ; (structuredToDashboardWidgets as jest.Mock).mockReturnValue([
                    { id: 'db-w1', widgetType: 'text' }
                ])
        })

        test('should process file and generate output', async () => {
            const result = await generateWidgetsFromFile('input.txt', 'output.json')

            expect(fs.readFileSync).toHaveBeenCalledWith('input.txt', 'utf-8')
            expect(restructureToJSON).toHaveBeenCalled()
            expect(structuredToDashboardWidgets).toHaveBeenCalled()
            expect(fs.writeFileSync).toHaveBeenCalled()

            expect(result.widgets).toHaveLength(1)
            expect(result.dbWidgets).toHaveLength(1)
        })

        test('should handle restructuring errors gracefully', async () => {
            ; (restructureToJSON as jest.Mock).mockRejectedValue(new Error('Parse Error'))

            const result = await generateWidgetsFromFile('input.txt', 'output.json')

            // Should still complete but with empty widgets for that tab
            expect(result.widgets).toHaveLength(0)
            expect(fs.writeFileSync).toHaveBeenCalled()
        })

        test('should map persona names correctly', async () => {
            const regulatoryContent = `
Agent Persona: Regulatory Advisor
Tab Name: Protocol Requirements
Refresh
Content
`
                ; (fs.readFileSync as jest.Mock).mockReturnValue(regulatoryContent)

            await generateWidgetsFromFile('input.txt', 'output.json')

            expect(restructureToJSON).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                'regulatoryAdvisor', // Should map to enum
                expect.any(String)
            )
        })
    })
})
