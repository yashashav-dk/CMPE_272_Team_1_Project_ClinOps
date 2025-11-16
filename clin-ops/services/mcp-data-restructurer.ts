// MCP-based Data Restructurer Service
// Uses AI to transform unstructured markdown into structured dashboard-ready JSON

import { generateAIResponse } from './ai-client'
import {
  StructuredDashboardResponse,
  validateStructuredResponse,
  STRUCTURED_OUTPUT_TEMPLATE
} from './structured-output-schema'

/**
 * MCP Agent: Transform unstructured LLM markdown into structured JSON
 */
export async function restructureToJSON(
  unstructuredContent: string,
  tabType: string,
  persona: string,
  projectId: string
): Promise<StructuredDashboardResponse> {
  const prompt = `You are a data restructuring agent. Your task is to analyze the following clinical trial content and extract structured data for a dashboard.

${STRUCTURED_OUTPUT_TEMPLATE}

Original Content to Restructure:
---
${unstructuredContent}
---

ANALYSIS INSTRUCTIONS:
1. Extract ALL diagrams (mermaid code blocks) as diagram widgets
2. Identify KPIs (numbers with targets/goals) as kpi widgets
3. Extract tables (markdown tables) as table widgets
4. Find milestones/dates as timeline widgets
5. Extract checklists and important lists as list widgets
6. Capture remaining important text as text widgets

CRITICAL: Return ONLY the JSON object. No markdown formatting, no explanations, no code blocks.
Start your response with { and end with }
`

  try {
    const result = await generateAIResponse({
      prompt,
      projectId,
      persona,
      tabType: `${tabType}_restructure`
    })

    if (!result.success || !result.response) {
      throw new Error('Failed to restructure content')
    }

    // Clean the response - remove markdown code blocks if present
    let jsonStr = result.response.trim()

    // Remove markdown code blocks
    jsonStr = jsonStr.replace(/```json\s*/g, '')
    jsonStr = jsonStr.replace(/```\s*/g, '')

    // Find the first { and last }
    const firstBrace = jsonStr.indexOf('{')
    const lastBrace = jsonStr.lastIndexOf('}')

    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1)
    }

    // Parse JSON
    const parsed = JSON.parse(jsonStr)

    // Validate structure
    if (!validateStructuredResponse(parsed)) {
      throw new Error('Invalid structured response format')
    }

    return parsed
  } catch (error) {
    console.error('Error restructuring data:', error)

    // Fallback: Create a basic structured response with text widget
    return {
      metadata: {
        tabType,
        persona,
        title: `${tabType} Content`,
        generatedAt: new Date().toISOString()
      },
      widgets: [
        {
          id: 'text-fallback',
          type: 'text',
          title: 'Content',
          order: 0,
          content: {
            markdown: unstructuredContent,
            summary: 'Original content (restructuring failed)'
          }
        }
      ]
    }
  }
}

/**
 * MCP Agent: Generate structured content directly from project info
 * This bypasses unstructured content generation entirely
 */
export async function generateStructuredContent(
  tabType: string,
  persona: string,
  projectInfo: Record<string, string>,
  projectId: string
): Promise<StructuredDashboardResponse> {
  const projectInfoStr = Object.entries(projectInfo)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')

  const prompt = `You are a clinical trial dashboard content generator. Generate comprehensive, structured dashboard content for a clinical trial.

${STRUCTURED_OUTPUT_TEMPLATE}

Project Information:
${projectInfoStr}

Tab Type: ${tabType}
Persona: ${persona}

REQUIREMENTS:
1. Generate AT LEAST 5-10 widgets covering different aspects
2. Include at least one Mermaid diagram (gantt for timelines, flowchart for workflows, etc.)
3. Extract or calculate realistic KPIs based on project scope
4. Create actionable checklists and requirements
5. Include timeline milestones with dependencies
6. Add tables showing site performance, metrics, or requirements
7. Use real project data where available, make realistic estimates where needed
8. Ensure all data is consistent (dates align, totals match, etc.)

WIDGET TYPES TO INCLUDE (based on tab type):

For "trialOverview":
- Gantt diagram showing trial phases
- KPIs: enrollment progress, site activation, timeline status
- Table: site list with status
- Timeline: key milestones
- Checklist: trial setup tasks

For "trialTimeline":
- Gantt chart with all phases
- Timeline widget with critical path milestones
- KPIs: days to first patient, enrollment rate
- Table: milestone tracker with dates and status

For "taskChecklists":
- Multiple list widgets (pre-study, enrollment, safety, closeout)
- KPIs: checklist completion percentage
- Timeline: task deadlines

For "qualityMetrics":
- KPIs: query rate, SAE reporting timeliness, enrollment forecast accuracy
- Table: metrics dashboard with targets and actuals
- Diagram: quality metrics framework flowchart

For "documentControl":
- Table: document inventory with versions and expiration
- Checklist: required documents
- ER Diagram: document relationships
- KPIs: document compliance percentage

For "complianceDiagrams":
- Multiple flowchart diagrams (ICF workflow, SAE reporting, data integrity)
- Checklist: compliance requirements
- Timeline: regulatory submission schedule

CRITICAL: Return ONLY the JSON object. No markdown, no code blocks, no explanations.
`

  try {
    const result = await generateAIResponse({
      prompt,
      projectId,
      persona,
      tabType: `${tabType}_structured`,
      forceRefresh: false
    })

    if (!result.success || !result.response) {
      throw new Error('Failed to generate structured content')
    }

    // Clean and parse response
    let jsonStr = result.response.trim()
    jsonStr = jsonStr.replace(/```json\s*/g, '')
    jsonStr = jsonStr.replace(/```\s*/g, '')

    const firstBrace = jsonStr.indexOf('{')
    const lastBrace = jsonStr.lastIndexOf('}')

    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1)
    }

    const parsed = JSON.parse(jsonStr)

    if (!validateStructuredResponse(parsed)) {
      throw new Error('Invalid structured response format')
    }

    return parsed
  } catch (error) {
    console.error('Error generating structured content:', error)
    throw error
  }
}

/**
 * Helper: Convert structured response to dashboard widgets
 */
export function structuredToDashboardWidgets(
  structured: StructuredDashboardResponse,
  projectId: string,
  userId: string
) {
  return structured.widgets.map((widget) => ({
    projectId,
    userId,
    tabType: structured.metadata.tabType,
    widgetType: widget.type,
    title: widget.title,
    content: widget.content,
    rawContent: JSON.stringify(widget),
    order: widget.order
  }))
}
