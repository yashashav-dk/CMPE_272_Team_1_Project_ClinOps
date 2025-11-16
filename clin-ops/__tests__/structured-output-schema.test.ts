/**
 * Tests for structured output schema validation
 */

import {
  validateStructuredResponse,
  StructuredDashboardResponse,
  DiagramWidget,
  KPIWidget,
  TableWidget,
  TimelineWidget,
  ListWidget,
  TextWidget
} from '../services/structured-output-schema'

describe('Structured Output Schema Validation', () => {

  describe('validateStructuredResponse', () => {

    test('should validate a complete valid response', () => {
      const validResponse: StructuredDashboardResponse = {
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
            title: 'Trial Timeline',
            order: 0,
            content: {
              diagramType: 'gantt',
              diagramCode: 'gantt\n  title Timeline\n  dateFormat YYYY-MM-DD\n  section Phase\n  Milestone: 2025-01-01, 30d',
              description: 'Trial timeline overview'
            }
          },
          {
            id: 'kpi-1',
            type: 'kpi',
            title: 'Enrollment',
            order: 1,
            content: {
              value: 125,
              target: 500,
              unit: 'count',
              status: 'on-track',
              trend: 'up'
            }
          }
        ]
      }

      expect(validateStructuredResponse(validResponse)).toBe(true)
    })

    test('should reject response with missing metadata', () => {
      const invalidResponse = {
        widgets: []
      }

      expect(validateStructuredResponse(invalidResponse)).toBe(false)
    })

    test('should reject response with missing widgets', () => {
      const invalidResponse = {
        metadata: {
          tabType: 'trialOverview',
          persona: 'trialCoordinator',
          title: 'Test'
        }
      }

      expect(validateStructuredResponse(invalidResponse)).toBe(false)
    })

    test('should reject response with invalid widget type', () => {
      const invalidResponse = {
        metadata: {
          tabType: 'trialOverview',
          persona: 'trialCoordinator',
          title: 'Test',
          generatedAt: '2025-01-01'
        },
        widgets: [
          {
            id: 'test-1',
            type: 'invalid-type',
            title: 'Test',
            order: 0,
            content: {}
          }
        ]
      }

      expect(validateStructuredResponse(invalidResponse)).toBe(false)
    })

    test('should validate diagram widget', () => {
      const response: StructuredDashboardResponse = {
        metadata: {
          tabType: 'test',
          persona: 'trialCoordinator',
          title: 'Test',
          generatedAt: '2025-01-01'
        },
        widgets: [
          {
            id: 'diagram-1',
            type: 'diagram',
            title: 'Test Diagram',
            order: 0,
            content: {
              diagramType: 'flowchart',
              diagramCode: 'flowchart TD\n  A --> B'
            }
          }
        ]
      }

      expect(validateStructuredResponse(response)).toBe(true)
    })

    test('should reject diagram widget without diagramCode', () => {
      const response = {
        metadata: {
          tabType: 'test',
          persona: 'trialCoordinator',
          title: 'Test',
          generatedAt: '2025-01-01'
        },
        widgets: [
          {
            id: 'diagram-1',
            type: 'diagram',
            title: 'Test',
            order: 0,
            content: {
              diagramType: 'flowchart'
            }
          }
        ]
      }

      expect(validateStructuredResponse(response)).toBe(false)
    })

    test('should validate KPI widget', () => {
      const response: StructuredDashboardResponse = {
        metadata: {
          tabType: 'test',
          persona: 'trialCoordinator',
          title: 'Test',
          generatedAt: '2025-01-01'
        },
        widgets: [
          {
            id: 'kpi-1',
            type: 'kpi',
            title: 'Test KPI',
            order: 0,
            content: {
              value: 100,
              unit: 'percentage',
              status: 'on-track'
            }
          }
        ]
      }

      expect(validateStructuredResponse(response)).toBe(true)
    })

    test('should reject KPI widget without value', () => {
      const response = {
        metadata: {
          tabType: 'test',
          persona: 'trialCoordinator',
          title: 'Test',
          generatedAt: '2025-01-01'
        },
        widgets: [
          {
            id: 'kpi-1',
            type: 'kpi',
            title: 'Test',
            order: 0,
            content: {
              unit: 'percentage'
            }
          }
        ]
      }

      expect(validateStructuredResponse(response)).toBe(false)
    })

    test('should validate table widget', () => {
      const response: StructuredDashboardResponse = {
        metadata: {
          tabType: 'test',
          persona: 'trialCoordinator',
          title: 'Test',
          generatedAt: '2025-01-01'
        },
        widgets: [
          {
            id: 'table-1',
            type: 'table',
            title: 'Test Table',
            order: 0,
            content: {
              headers: ['Column 1', 'Column 2'],
              rows: [
                { 'Column 1': 'Value 1', 'Column 2': 'Value 2' }
              ]
            }
          }
        ]
      }

      expect(validateStructuredResponse(response)).toBe(true)
    })

    test('should validate timeline widget', () => {
      const response: StructuredDashboardResponse = {
        metadata: {
          tabType: 'test',
          persona: 'trialCoordinator',
          title: 'Test',
          generatedAt: '2025-01-01'
        },
        widgets: [
          {
            id: 'timeline-1',
            type: 'timeline',
            title: 'Test Timeline',
            order: 0,
            content: {
              milestones: [
                {
                  name: 'Milestone 1',
                  date: '2025-01-01',
                  status: 'upcoming'
                }
              ]
            }
          }
        ]
      }

      expect(validateStructuredResponse(response)).toBe(true)
    })

    test('should validate list widget', () => {
      const response: StructuredDashboardResponse = {
        metadata: {
          tabType: 'test',
          persona: 'trialCoordinator',
          title: 'Test',
          generatedAt: '2025-01-01'
        },
        widgets: [
          {
            id: 'list-1',
            type: 'list',
            title: 'Test List',
            order: 0,
            content: {
              items: [
                { text: 'Item 1', checked: true }
              ],
              listType: 'checklist'
            }
          }
        ]
      }

      expect(validateStructuredResponse(response)).toBe(true)
    })

    test('should validate text widget', () => {
      const response: StructuredDashboardResponse = {
        metadata: {
          tabType: 'test',
          persona: 'trialCoordinator',
          title: 'Test',
          generatedAt: '2025-01-01'
        },
        widgets: [
          {
            id: 'text-1',
            type: 'text',
            title: 'Test Text',
            order: 0,
            content: {
              markdown: '# Test Content'
            }
          }
        ]
      }

      expect(validateStructuredResponse(response)).toBe(true)
    })

    test('should validate response with multiple widget types', () => {
      const response: StructuredDashboardResponse = {
        metadata: {
          tabType: 'trialOverview',
          persona: 'trialCoordinator',
          title: 'Test',
          generatedAt: '2025-01-01'
        },
        widgets: [
          {
            id: 'diagram-1',
            type: 'diagram',
            title: 'Diagram',
            order: 0,
            content: {
              diagramType: 'gantt',
              diagramCode: 'gantt\n  title Test'
            }
          },
          {
            id: 'kpi-1',
            type: 'kpi',
            title: 'KPI',
            order: 1,
            content: {
              value: 50,
              unit: 'percentage',
              status: 'on-track'
            }
          },
          {
            id: 'table-1',
            type: 'table',
            title: 'Table',
            order: 2,
            content: {
              headers: ['A', 'B'],
              rows: []
            }
          }
        ]
      }

      expect(validateStructuredResponse(response)).toBe(true)
    })
  })
})
