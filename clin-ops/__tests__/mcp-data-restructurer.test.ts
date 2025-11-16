/**
 * Tests for MCP data restructurer
 */

import { restructureToJSON, structuredToDashboardWidgets } from '../services/mcp-data-restructurer'
import { StructuredDashboardResponse } from '../services/structured-output-schema'

// Mock the AI client
jest.mock('../services/ai-client', () => ({
  generateAIResponse: jest.fn()
}))

import { generateAIResponse } from '../services/ai-client'

describe('MCP Data Restructurer', () => {

  describe('structuredToDashboardWidgets', () => {

    test('should convert structured response to dashboard widgets', () => {
      const structuredResponse: StructuredDashboardResponse = {
        metadata: {
          tabType: 'trialOverview',
          persona: 'trialCoordinator',
          title: 'Trial Overview',
          generatedAt: '2025-01-01T00:00:00Z'
        },
        widgets: [
          {
            id: 'diagram-1',
            type: 'diagram',
            title: 'Timeline',
            order: 0,
            content: {
              diagramType: 'gantt',
              diagramCode: 'gantt\n  title Timeline'
            }
          },
          {
            id: 'kpi-1',
            type: 'kpi',
            title: 'Enrollment',
            order: 1,
            content: {
              value: 100,
              target: 500,
              unit: 'count',
              status: 'on-track'
            }
          }
        ]
      }

      const widgets = structuredToDashboardWidgets(
        structuredResponse,
        'project-123',
        'user-456'
      )

      expect(widgets.length).toBe(2)

      expect(widgets[0]).toMatchObject({
        projectId: 'project-123',
        userId: 'user-456',
        tabType: 'trialOverview',
        widgetType: 'diagram',
        title: 'Timeline',
        order: 0
      })

      expect(widgets[0].content).toMatchObject({
        diagramType: 'gantt',
        diagramCode: 'gantt\n  title Timeline'
      })

      expect(widgets[1]).toMatchObject({
        projectId: 'project-123',
        userId: 'user-456',
        tabType: 'trialOverview',
        widgetType: 'kpi',
        title: 'Enrollment',
        order: 1
      })
    })

    test('should preserve widget order', () => {
      const structuredResponse: StructuredDashboardResponse = {
        metadata: {
          tabType: 'test',
          persona: 'trialCoordinator',
          title: 'Test',
          generatedAt: '2025-01-01'
        },
        widgets: [
          {
            id: 'widget-3',
            type: 'text',
            title: 'Third',
            order: 2,
            content: { markdown: 'Text 3' }
          },
          {
            id: 'widget-1',
            type: 'text',
            title: 'First',
            order: 0,
            content: { markdown: 'Text 1' }
          },
          {
            id: 'widget-2',
            type: 'text',
            title: 'Second',
            order: 1,
            content: { markdown: 'Text 2' }
          }
        ]
      }

      const widgets = structuredToDashboardWidgets(
        structuredResponse,
        'project-123',
        'user-456'
      )

      expect(widgets[0].order).toBe(2)
      expect(widgets[1].order).toBe(0)
      expect(widgets[2].order).toBe(1)
    })

    test('should handle empty widgets array', () => {
      const structuredResponse: StructuredDashboardResponse = {
        metadata: {
          tabType: 'test',
          persona: 'trialCoordinator',
          title: 'Test',
          generatedAt: '2025-01-01'
        },
        widgets: []
      }

      const widgets = structuredToDashboardWidgets(
        structuredResponse,
        'project-123',
        'user-456'
      )

      expect(widgets.length).toBe(0)
    })
  })

  describe('restructureToJSON', () => {

    beforeEach(() => {
      jest.clearAllMocks()
    })

    test('should successfully restructure markdown to JSON', async () => {
      const mockResponse = {
        success: true,
        response: JSON.stringify({
          metadata: {
            tabType: 'trialTimeline',
            persona: 'trialCoordinator',
            title: 'Trial Timeline',
            generatedAt: '2025-01-01T00:00:00Z'
          },
          widgets: [
            {
              id: 'diagram-1',
              type: 'diagram',
              title: 'Timeline Diagram',
              order: 0,
              content: {
                diagramType: 'gantt',
                diagramCode: 'gantt\n  title Timeline'
              }
            }
          ]
        })
      }

      ;(generateAIResponse as jest.Mock).mockResolvedValue(mockResponse)

      const markdownContent = `
# Trial Timeline

\`\`\`mermaid
gantt
  title Timeline
\`\`\`
`

      const result = await restructureToJSON(
        markdownContent,
        'trialTimeline',
        'trialCoordinator',
        'project-123'
      )

      expect(result.metadata.tabType).toBe('trialTimeline')
      expect(result.widgets.length).toBe(1)
      expect(result.widgets[0].type).toBe('diagram')
    })

    test('should handle JSON in code block', async () => {
      const mockResponse = {
        success: true,
        response: '```json\n' + JSON.stringify({
          metadata: {
            tabType: 'test',
            persona: 'trialCoordinator',
            title: 'Test',
            generatedAt: '2025-01-01'
          },
          widgets: []
        }) + '\n```'
      }

      ;(generateAIResponse as jest.Mock).mockResolvedValue(mockResponse)

      const result = await restructureToJSON(
        'test content',
        'test',
        'trialCoordinator',
        'project-123'
      )

      expect(result.metadata.tabType).toBe('test')
      expect(result.widgets).toEqual([])
    })

    test('should handle JSON with extra text', async () => {
      const validJSON = {
        metadata: {
          tabType: 'test',
          persona: 'trialCoordinator',
          title: 'Test',
          generatedAt: '2025-01-01'
        },
        widgets: []
      }

      const mockResponse = {
        success: true,
        response: 'Here is the structured data:\n\n' + JSON.stringify(validJSON) + '\n\nEnd of data.'
      }

      ;(generateAIResponse as jest.Mock).mockResolvedValue(mockResponse)

      const result = await restructureToJSON(
        'test content',
        'test',
        'trialCoordinator',
        'project-123'
      )

      expect(result.metadata.tabType).toBe('test')
    })

    test('should fallback to text widget on parsing error', async () => {
      const mockResponse = {
        success: true,
        response: 'Invalid JSON response'
      }

      ;(generateAIResponse as jest.Mock).mockResolvedValue(mockResponse)

      const originalContent = 'Original markdown content'

      const result = await restructureToJSON(
        originalContent,
        'test',
        'trialCoordinator',
        'project-123'
      )

      expect(result.widgets.length).toBe(1)
      expect(result.widgets[0].type).toBe('text')
      expect(result.widgets[0].content.markdown).toBe(originalContent)
      expect(result.widgets[0].content.summary).toContain('restructuring failed')
    })

    test('should fallback on AI service failure', async () => {
      const mockResponse = {
        success: false,
        error: 'AI service unavailable'
      }

      ;(generateAIResponse as jest.Mock).mockResolvedValue(mockResponse)

      const originalContent = 'Original content'

      const result = await restructureToJSON(
        originalContent,
        'test',
        'trialCoordinator',
        'project-123'
      )

      expect(result.widgets.length).toBe(1)
      expect(result.widgets[0].type).toBe('text')
    })

    test('should call AI service with correct prompt', async () => {
      const mockResponse = {
        success: true,
        response: JSON.stringify({
          metadata: {
            tabType: 'test',
            persona: 'trialCoordinator',
            title: 'Test',
            generatedAt: '2025-01-01'
          },
          widgets: []
        })
      }

      ;(generateAIResponse as jest.Mock).mockResolvedValue(mockResponse)

      await restructureToJSON(
        'content',
        'trialTimeline',
        'trialCoordinator',
        'project-123'
      )

      expect(generateAIResponse).toHaveBeenCalledWith({
        prompt: expect.stringContaining('data restructuring agent'),
        projectId: 'project-123',
        persona: 'trialCoordinator',
        tabType: 'trialTimeline_restructure'
      })
    })
  })
})
