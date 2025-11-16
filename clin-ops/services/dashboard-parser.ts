// Dashboard content parser service
// Parses markdown content from tabs and extracts structured data for dashboard widgets

export type WidgetType = 'diagram' | 'kpi' | 'table' | 'timeline' | 'list' | 'text'

export interface ParsedWidget {
  widgetType: WidgetType
  title: string
  content: any
  rawContent: string
  order: number
}

export interface ParseResult {
  widgets: ParsedWidget[]
  tabType: string
}

/**
 * Parse tab content and extract widgets for dashboard
 */
export function parseTabContent(tabType: string, content: string): ParseResult {
  const widgets: ParsedWidget[] = []
  let order = 0

  // Extract Mermaid diagrams
  const diagramRegex = /```(?:mermaid|diagram)?\s*\n([\s\S]*?)```/g
  let match
  let lastIndex = 0

  while ((match = diagramRegex.exec(content)) !== null) {
    const diagramCode = match[1].trim()

    // Detect diagram type
    const typeMatch = diagramCode.match(/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitgraph|mindmap|timeline)/i)
    const diagramType = typeMatch ? typeMatch[1] : 'flowchart'

    // Get title from preceding heading if available
    const beforeDiagram = content.slice(lastIndex, match.index)
    const headingMatch = beforeDiagram.match(/#{1,6}\s+(.+?)$/m)
    const title = headingMatch ? headingMatch[1].trim() : `${capitalize(diagramType)} Diagram`

    widgets.push({
      widgetType: 'diagram',
      title,
      content: {
        diagramCode,
        diagramType
      },
      rawContent: match[0],
      order: order++
    })

    lastIndex = match.index + match[0].length
  }

  // Extract KPIs (numbers with labels) - improved regex
  const kpiRegex = /\*\*([^*]+?):\*\*\s*(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?))?\s*(?:\(([^)]+)\))?|(\w+(?:\s+\w+)*):\s*(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?))?\s*(?:\(([^)]+)\))?/gm
  while ((match = kpiRegex.exec(content)) !== null) {
    const label = (match[1] || match[5])?.trim()
    const value = parseFloat(match[2] || match[6])
    const target = match[3] || match[7] ? parseFloat(match[3] || match[7]) : undefined
    const status = match[4] || match[8]

    if (label && !isNaN(value)) {
      widgets.push({
        widgetType: 'kpi',
        title: label,
        content: {
          value,
          target,
          unit: 'number',
          status: status ? status.toLowerCase() : (target && value >= target ? 'on-track' : 'at-risk')
        },
        rawContent: match[0],
        order: order++
      })
    }
  }

  // Extract tables (markdown tables)
  const tableRegex = /(\|[^\n]+\|[\s\S]*?(?=\n\n|\n#{1,6}|$))/gm
  while ((match = tableRegex.exec(content)) !== null) {
    const tableText = match[1].trim()
    const rows = tableText.split('\n').filter(line => line.trim() && !line.match(/^\|[\s:-]+\|$/))

    if (rows.length > 1) {
      // Get heading before table
      const beforeTable = content.slice(0, match.index)
      const headingMatch = beforeTable.match(/#{1,6}\s+(.+?)$/m)
      const title = headingMatch ? headingMatch[1].trim() : 'Data Table'

      // Parse table structure
      const headers = rows[0].split('|').filter(h => h.trim()).map(h => h.trim())
      const data = rows.slice(1).map(row => {
        const cells = row.split('|').filter(c => c.trim()).map(c => c.trim())
        const rowData: Record<string, string> = {}
        headers.forEach((header, idx) => {
          rowData[header] = cells[idx] || ''
        })
        return rowData
      })

      widgets.push({
        widgetType: 'table',
        title,
        content: {
          headers,
          data
        },
        rawContent: match[0],
        order: order++
      })
    }
  }

  // Extract timeline/milestones (dates with events)
  const milestoneRegex = /(?:^|\n)(?:\*\*|-)?\s*(.+?):\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4}-\d{2}-\d{2})/gim
  const milestones: Array<{ event: string; date: string }> = []

  while ((match = milestoneRegex.exec(content)) !== null) {
    milestones.push({
      event: match[1].trim(),
      date: match[2].trim()
    })
  }

  if (milestones.length > 0) {
    widgets.push({
      widgetType: 'timeline',
      title: 'Key Milestones',
      content: {
        milestones
      },
      rawContent: milestones.map(m => `${m.event}: ${m.date}`).join('\n'),
      order: order++
    })
  }

  // Extract bullet/numbered lists (important items)
  const listRegex = /#{1,6}\s+(.+?)\n((?:(?:\*|-|\d+\.)\s+.+\n?)+)/gm
  while ((match = listRegex.exec(content)) !== null) {
    const title = match[1].trim()
    const listContent = match[2].trim()
    const items = listContent.split('\n')
      .map(line => line.replace(/^(?:\*|-|\d+\.)\s+/, '').trim())
      .filter(item => item.length > 0)

    if (items.length > 2) { // Only create widget if substantial list
      widgets.push({
        widgetType: 'list',
        title,
        content: {
          items
        },
        rawContent: match[0],
        order: order++
      })
    }
  }

  // If no widgets extracted, create a text widget with full content
  if (widgets.length === 0) {
    widgets.push({
      widgetType: 'text',
      title: getTabDisplayName(tabType),
      content: {
        markdown: content
      },
      rawContent: content,
      order: 0
    })
  }

  return {
    widgets,
    tabType
  }
}

/**
 * Get display name for tab type
 */
function getTabDisplayName(tabType: string): string {
  const names: Record<string, string> = {
    trialOverview: 'Trial Overview',
    taskChecklists: 'Task Checklists',
    teamWorkflows: 'Team Workflows',
    trialTimeline: 'Trial Timeline',
    qualityMetrics: 'Quality Metrics',
    protocolRequirements: 'Protocol Requirements',
    documentControl: 'Document Control',
    complianceDiagrams: 'Compliance Diagrams',
    riskControls: 'Risk & Controls',
    auditPreparation: 'Audit Preparation',
    smartAlerts: 'Smart Alerts'
  }
  return names[tabType] || tabType
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}
