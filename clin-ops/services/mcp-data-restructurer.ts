// MCP-based Data Restructurer Service
// Uses AI to transform unstructured markdown into structured dashboard-ready JSON

import { generateAIResponse } from './ai'
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
5. Extract process steps and workflows as workflow widgets
6. Extract checklists and important lists as list widgets
7. Capture remaining important text as text widgets

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

    // Fallback: Create a basic structured response with text and diagram widgets
    // We manually extract mermaid diagrams to ensure they are preserved as distinct widgets

    const widgets: Array<any> = [];
    let lastIndex = 0;
    let widgetCount = 0;

    // Regex for standard markdown code blocks
    const mermaidRegex = /```(?:mermaid)?\s*\n([\s\S]*?)```/g;

    // Regex for unwrapped mermaid code (often found in error messages in the input)
    // Captures content after "The diagram code is shown below:" until a clear section break or end of file
    const unwrappedMermaidRegex = /The diagram code is shown below:\s*\n([\s\S]*?)(?=\n(?:[A-Z][a-zA-Z\s&]+:|(?:\d+\.)+\s+[A-Z]|\n\n[A-Z]|$))/g;

    let match;

    // Helper to process matches
    const processMatch = (code: string, index: number, fullMatch: string) => {
      // Add text before the diagram
      if (index > lastIndex) {
        const textContent = unstructuredContent.slice(lastIndex, index).trim();
        if (textContent) {
          widgets.push({
            id: `text-fallback-${widgetCount++}`,
            type: 'text',
            title: 'Section Content',
            order: widgetCount,
            content: {
              markdown: textContent,
              summary: 'Content section'
            }
          });
        }
      }

      // Add the diagram
      const diagramCode = code.trim();
      // Try to guess diagram type
      let diagramType = 'flowchart'; // Default
      if (diagramCode.includes('gantt')) diagramType = 'gantt';
      else if (diagramCode.includes('sequenceDiagram')) diagramType = 'sequenceDiagram';
      else if (diagramCode.includes('classDiagram')) diagramType = 'classDiagram';
      else if (diagramCode.includes('stateDiagram')) diagramType = 'stateDiagram';
      else if (diagramCode.includes('erDiagram')) diagramType = 'erDiagram';
      else if (diagramCode.includes('journey')) diagramType = 'journey';
      else if (diagramCode.includes('pie')) diagramType = 'pie';
      else if (diagramCode.includes('timeline')) diagramType = 'timeline';

      widgets.push({
        id: `diagram-fallback-${widgetCount++}`,
        type: 'diagram',
        title: 'Visual Diagram',
        order: widgetCount,
        content: {
          diagramType,
          diagramCode,
          description: 'Extracted diagram'
        }
      });

      lastIndex = index + fullMatch.length;
    };

    // Process standard code blocks first
    while ((match = mermaidRegex.exec(unstructuredContent)) !== null) {
      processMatch(match[1], match.index, match[0]);
    }

    // If we didn't find anything with standard blocks, try the unwrapped regex
    // We reset lastIndex only if we are starting a new search and haven't processed anything, 
    // but here we might have mixed content. 
    // However, usually it's one format or the other. 
    // If we found standard blocks, we probably parsed the file correctly.
    // If not, let's try the unwrapped one.

    if (widgets.length === 0) {
      lastIndex = 0; // Reset for second pass
      while ((match = unwrappedMermaidRegex.exec(unstructuredContent)) !== null) {
        // The match[0] includes the intro text, match[1] is the code.
        // We want to treat the intro text as part of the "previous" text or just skip it?
        // The regex captures "The diagram code is shown below:\n" as part of the match.
        // We should probably include that intro text in the previous text block if we want to keep context,
        // but the user wants the diagram.
        // Let's just use the match index.
        processMatch(match[1], match.index, match[0]);
      }
    }

    // Add remaining text
    if (lastIndex < unstructuredContent.length) {
      const remainingText = unstructuredContent.slice(lastIndex).trim();
      if (remainingText) {
        widgets.push({
          id: `text-fallback-${widgetCount++}`,
          type: 'text',
          title: 'Additional Content',
          order: widgetCount,
          content: {
            markdown: remainingText,
            summary: 'Remaining content'
          }
        });
      }
    }

    // If no diagrams found, return original content as single text widget
    if (widgets.length === 0) {
      widgets.push({
        id: 'text-fallback',
        type: 'text',
        title: 'Content',
        order: 0,
        content: {
          markdown: unstructuredContent,
          summary: 'Original content (restructuring failed)'
        }
      });
    }

    return {
      metadata: {
        tabType,
        persona,
        title: `${tabType} Content`,
        generatedAt: new Date().toISOString()
      },
      widgets
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
- Workflow: study startup process
- Checklist: trial setup tasks

For "trialTimeline":
- Gantt chart with all phases
- Timeline widget with critical path milestones
- Workflow: sequential process steps
- KPIs: days to first patient, enrollment rate
- Table: milestone tracker with dates and status

For "taskChecklists":
- Multiple list widgets (pre-study, enrollment, safety, closeout)
- Workflow: approval and review process
- KPIs: checklist completion percentage
- Timeline: task deadlines

For "qualityMetrics":
- KPIs: query rate, SAE reporting timeliness, enrollment forecast accuracy
- Table: metrics dashboard with targets and actuals
- Diagram: quality metrics framework flowchart

For "documentControl":
- Table: document inventory with versions and expiration
- Checklist: required documents
- Workflow: document review and approval process
- ER Diagram: document relationships
- KPIs: document compliance percentage

For "complianceDiagrams":
- Multiple flowchart diagrams (ICF workflow, SAE reporting, data integrity)
- Workflow: compliance review steps
- Checklist: compliance requirements
- Timeline: regulatory submission schedule

For "teamWorkflows":
- Multiple workflow widgets for different team processes
- Flowchart diagrams showing process flows
- Checklist: workflow checkpoints
- Timeline: workflow milestones

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
