// Structured output schema for LLM responses
// This enforces a consistent data structure that maps directly to dashboard widgets

export interface StructuredDashboardResponse {
  metadata: {
    tabType: string
    persona: string
    title: string
    generatedAt: string
  }

  widgets: Array<
    | DiagramWidget
    | KPIWidget
    | TableWidget
    | TimelineWidget
    | ListWidget
    | TextWidget
  >
}

export interface BaseWidget {
  id: string
  type: 'diagram' | 'kpi' | 'table' | 'timeline' | 'list' | 'text'
  title: string
  order: number
}

export interface DiagramWidget extends BaseWidget {
  type: 'diagram'
  content: {
    diagramType: 'gantt' | 'flowchart' | 'sequenceDiagram' | 'erDiagram' | 'classDiagram' | 'stateDiagram' | 'pie' | 'journey' | 'gitgraph' | 'mindmap' | 'timeline'
    diagramCode: string
    description?: string
  }
}

export interface KPIWidget extends BaseWidget {
  type: 'kpi'
  content: {
    value: number
    target?: number
    unit: 'number' | 'percentage' | 'days' | 'count'
    status: 'on-track' | 'at-risk' | 'critical' | 'unknown'
    trend?: 'up' | 'down' | 'stable'
    description?: string
  }
}

export interface TableWidget extends BaseWidget {
  type: 'table'
  content: {
    headers: string[]
    rows: Record<string, string | number>[]
    description?: string
  }
}

export interface TimelineWidget extends BaseWidget {
  type: 'timeline'
  content: {
    milestones: Array<{
      name: string
      date: string
      status: 'completed' | 'in-progress' | 'upcoming' | 'delayed'
      description?: string
      dependencies?: string[]
    }>
  }
}

export interface ListWidget extends BaseWidget {
  type: 'list'
  content: {
    items: Array<{
      text: string
      checked?: boolean
      priority?: 'high' | 'medium' | 'low'
      category?: string
    }>
    listType: 'checklist' | 'bullet' | 'numbered' | 'requirements'
  }
}

export interface TextWidget extends BaseWidget {
  type: 'text'
  content: {
    markdown: string
    summary?: string
  }
}

// Validation functions
export function validateStructuredResponse(data: any): data is StructuredDashboardResponse {
  if (!data || typeof data !== 'object') return false
  if (!data.metadata || !data.widgets) return false
  if (!Array.isArray(data.widgets)) return false

  // Validate metadata
  const { metadata } = data
  if (!metadata.tabType || !metadata.persona || !metadata.title) return false

  // Validate each widget
  for (const widget of data.widgets) {
    if (!widget.type || !widget.title || widget.order === undefined) return false

    switch (widget.type) {
      case 'diagram':
        if (!widget.content?.diagramCode || !widget.content?.diagramType) return false
        break
      case 'kpi':
        if (widget.content?.value === undefined || !widget.content?.unit) return false
        break
      case 'table':
        if (!Array.isArray(widget.content?.headers) || !Array.isArray(widget.content?.rows)) return false
        break
      case 'timeline':
        if (!Array.isArray(widget.content?.milestones)) return false
        break
      case 'list':
        if (!Array.isArray(widget.content?.items)) return false
        break
      case 'text':
        if (!widget.content?.markdown) return false
        break
      default:
        return false
    }
  }

  return true
}

// Template for LLM to follow
export const STRUCTURED_OUTPUT_TEMPLATE = `
IMPORTANT: You MUST return your response as valid JSON following this exact structure:

{
  "metadata": {
    "tabType": "string - the tab type (e.g., 'trialOverview', 'taskChecklists')",
    "persona": "string - either 'trialCoordinator' or 'regulatoryAdvisor'",
    "title": "string - descriptive title for this content",
    "generatedAt": "string - ISO date string"
  },
  "widgets": [
    // Array of widgets - include ALL relevant widgets for comprehensive dashboard
    {
      "id": "unique-id-1",
      "type": "diagram",
      "title": "Trial Timeline",
      "order": 0,
      "content": {
        "diagramType": "gantt",
        "diagramCode": "gantt\\n    title LUMA-201 Trial Timeline\\n    dateFormat YYYY-MM-DD\\n    section Pre-Study\\n    Protocol Finalized: 2025-01-15, 30d",
        "description": "Optional description of what this diagram shows"
      }
    },
    {
      "id": "unique-id-2",
      "type": "kpi",
      "title": "Enrollment Progress",
      "order": 1,
      "content": {
        "value": 125,
        "target": 500,
        "unit": "count",
        "status": "on-track",
        "trend": "up",
        "description": "Current enrollment vs target"
      }
    },
    {
      "id": "unique-id-3",
      "type": "table",
      "title": "Site Performance",
      "order": 2,
      "content": {
        "headers": ["Site", "Enrolled", "Target", "Status"],
        "rows": [
          {"Site": "UCSF", "Enrolled": "25", "Target": "30", "Status": "On Track"},
          {"Site": "MD Anderson", "Enrolled": "18", "Target": "25", "Status": "Behind"}
        ],
        "description": "Performance metrics by site"
      }
    },
    {
      "id": "unique-id-4",
      "type": "timeline",
      "title": "Key Milestones",
      "order": 3,
      "content": {
        "milestones": [
          {
            "name": "First Patient In",
            "date": "2025-03-01",
            "status": "upcoming",
            "description": "First subject enrolled in trial",
            "dependencies": ["IRB Approval", "Site Activation"]
          }
        ]
      }
    },
    {
      "id": "unique-id-5",
      "type": "list",
      "title": "Pre-Study Checklist",
      "order": 4,
      "content": {
        "items": [
          {"text": "IRB submission prepared", "checked": true, "priority": "high"},
          {"text": "Site contracts executed", "checked": false, "priority": "high"}
        ],
        "listType": "checklist"
      }
    }
  ]
}

RULES:
1. Return ONLY valid JSON - no markdown, no code blocks, no explanatory text
2. Include multiple widgets (diagrams, KPIs, tables, timelines, lists) to create a comprehensive dashboard
3. Use real data from the project information provided
4. Ensure all Mermaid diagram syntax is properly escaped (use \\n for newlines in JSON strings)
5. Make KPI values realistic based on project timeline and scope
6. Include status indicators (on-track, at-risk, critical) based on logical assessment
7. Create actionable checklists with priority levels
8. Ensure all dates use ISO format (YYYY-MM-DD)
9. Generate unique IDs for each widget (e.g., "diagram-1", "kpi-enrollment", "table-sites")
`;
