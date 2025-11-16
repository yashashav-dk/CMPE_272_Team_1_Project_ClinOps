/**
 * Tests for dashboard content parser
 */

import { parseTabContent } from '../services/dashboard-parser'

describe('Dashboard Content Parser', () => {

  describe('parseTabContent', () => {

    test('should extract Mermaid diagrams', () => {
      const content = `
# Trial Timeline

Here is the trial timeline:

\`\`\`mermaid
gantt
    title LUMA-201 Trial Timeline
    dateFormat YYYY-MM-DD
    section Pre-Study
    Protocol Finalized: 2025-01-15, 30d
\`\`\`

This shows the major milestones.
`

      const result = parseTabContent('trialTimeline', content)

      expect(result.widgets.length).toBeGreaterThan(0)
      const diagramWidget = result.widgets.find(w => w.widgetType === 'diagram')
      expect(diagramWidget).toBeDefined()
      expect(diagramWidget?.content.diagramType).toBe('gantt')
      expect(diagramWidget?.content.diagramCode).toContain('LUMA-201')
    })

    test('should extract KPIs from markdown', () => {
      const content = `
## Key Metrics

**Enrollment Progress:** 125 / 500 (on-track)
**Site Activation:** 15 / 25 sites
**Query Resolution Time:** 7 days
`

      const result = parseTabContent('qualityMetrics', content)

      const kpiWidgets = result.widgets.filter(w => w.widgetType === 'kpi')
      expect(kpiWidgets.length).toBeGreaterThan(0)

      const enrollmentKPI = kpiWidgets.find(w => w.title.includes('Enrollment'))
      expect(enrollmentKPI).toBeDefined()
      expect(enrollmentKPI?.content.value).toBe(125)
      expect(enrollmentKPI?.content.target).toBe(500)
    })

    test('should extract markdown tables', () => {
      const content = `
## Site Performance

| Site | Enrolled | Target | Status |
|------|----------|--------|--------|
| UCSF | 25 | 30 | On Track |
| MD Anderson | 18 | 25 | Behind |
| Mayo Clinic | 22 | 20 | Ahead |
`

      const result = parseTabContent('trialOverview', content)

      const tableWidget = result.widgets.find(w => w.widgetType === 'table')
      expect(tableWidget).toBeDefined()
      expect(tableWidget?.content.headers).toEqual(['Site', 'Enrolled', 'Target', 'Status'])
      expect(tableWidget?.content.data.length).toBe(3)
      expect(tableWidget?.content.data[0]['Site']).toBe('UCSF')
    })

    test('should extract timeline milestones', () => {
      const content = `
## Key Milestones

- Protocol Finalized: Jan 2025
- First Site Initiation: Feb 2025
- First Patient In (FPI): Mar 2025
- 50% Enrollment: Nov 2025
- Last Patient In (LPI): Mar 2026
- Database Lock: Jul 2026
`

      const result = parseTabContent('trialTimeline', content)

      const timelineWidget = result.widgets.find(w => w.widgetType === 'timeline')
      expect(timelineWidget).toBeDefined()
      expect(timelineWidget?.content.milestones.length).toBeGreaterThan(0)

      const fpiMilestone = timelineWidget?.content.milestones.find(m => m.event.includes('FPI'))
      expect(fpiMilestone).toBeDefined()
      expect(fpiMilestone?.date).toContain('2025')
    })

    test('should extract lists', () => {
      const content = `
## Pre-Study Checklist

- IRB submission prepared
- Site contracts executed
- Staff training completed
- Pharmacy setup done
- Drug accountability system ready
`

      const result = parseTabContent('taskChecklists', content)

      const listWidget = result.widgets.find(w => w.widgetType === 'list')
      expect(listWidget).toBeDefined()
      expect(listWidget?.content.items.length).toBeGreaterThan(0)
      expect(listWidget?.content.items).toContain('IRB submission prepared')
    })

    test('should handle content with multiple diagrams', () => {
      const content = `
# Workflows

## Enrollment Workflow

\`\`\`mermaid
flowchart TD
    A[Screen Patient] --> B{Eligible?}
    B -->|Yes| C[Enroll]
    B -->|No| D[Screen Failure]
\`\`\`

## SAE Reporting

\`\`\`mermaid
sequenceDiagram
    Coordinator->>PI: Report SAE
    PI->>Sponsor: Submit within 24h
\`\`\`
`

      const result = parseTabContent('teamWorkflows', content)

      const diagramWidgets = result.widgets.filter(w => w.widgetType === 'diagram')
      expect(diagramWidgets.length).toBe(2)
      expect(diagramWidgets[0].content.diagramType).toBe('flowchart')
      expect(diagramWidgets[1].content.diagramType).toBe('sequenceDiagram')
    })

    test('should create text widget for unparseable content', () => {
      const content = `
This is some plain text without any structured data.
Just narrative content about the trial.
`

      const result = parseTabContent('trialOverview', content)

      expect(result.widgets.length).toBe(1)
      const textWidget = result.widgets[0]
      expect(textWidget.widgetType).toBe('text')
      expect(textWidget.content.markdown).toContain('plain text')
    })

    test('should handle mixed content types', () => {
      const content = `
# Trial Overview

## Timeline

\`\`\`mermaid
gantt
    title Timeline
    dateFormat YYYY-MM-DD
    section Phase 1
    Start: 2025-01-01, 30d
\`\`\`

## Metrics

**Enrollment:** 50 / 100
**Sites:** 10 / 20

## Site List

| Site | Status |
|------|--------|
| Site A | Active |
| Site B | Pending |

## Tasks

- Complete IRB submission
- Train staff
- Setup pharmacy
`

      const result = parseTabContent('trialOverview', content)

      expect(result.widgets.length).toBeGreaterThan(3)

      const hasDiagram = result.widgets.some(w => w.widgetType === 'diagram')
      const hasKPI = result.widgets.some(w => w.widgetType === 'kpi')
      const hasTable = result.widgets.some(w => w.widgetType === 'table')
      const hasList = result.widgets.some(w => w.widgetType === 'list')

      expect(hasDiagram).toBe(true)
      expect(hasKPI).toBe(true)
      expect(hasTable).toBe(true)
      expect(hasList).toBe(true)
    })

    test('should preserve widget order', () => {
      const content = `
\`\`\`mermaid
graph TD
    A --> B
\`\`\`

**KPI:** 100

| A | B |
|---|---|
| 1 | 2 |
`

      const result = parseTabContent('test', content)

      expect(result.widgets[0].order).toBe(0)
      expect(result.widgets[1].order).toBe(1)
      expect(result.widgets[2].order).toBe(2)
    })

    test('should handle empty content', () => {
      const content = ''

      const result = parseTabContent('test', content)

      expect(result.widgets.length).toBe(1)
      expect(result.widgets[0].widgetType).toBe('text')
    })

    test('should extract diagram title from preceding heading', () => {
      const content = `
## Trial Enrollment Timeline

\`\`\`mermaid
gantt
    title Enrollment
    dateFormat YYYY-MM-DD
    section Phase
    Task: 2025-01-01, 30d
\`\`\`
`

      const result = parseTabContent('test', content)

      const diagramWidget = result.widgets.find(w => w.widgetType === 'diagram')
      expect(diagramWidget?.title).toBe('Trial Enrollment Timeline')
    })
  })
})
