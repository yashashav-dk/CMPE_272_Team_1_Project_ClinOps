/**
 * Integration tests for dashboard workflow
 */

import { parseTabContent } from '../services/dashboard-parser'
import { validateStructuredResponse } from '../services/structured-output-schema'
import { structuredToDashboardWidgets } from '../services/mcp-data-restructurer'

describe('Dashboard Integration Tests', () => {

  describe('End-to-End: Markdown to Dashboard Widgets', () => {

    test('should parse markdown content and create valid dashboard widgets', () => {
      const markdownContent = `
# LUMA-201 Trial Overview

## Trial Timeline

\`\`\`mermaid
gantt
    title LUMA-201 Phase III Trial Timeline
    dateFormat YYYY-MM-DD
    section Pre-Study
    Protocol Finalized: 2025-01-15, 30d
    First SIV: 2025-02-15, 15d
    section Enrollment
    First Patient In: 2025-03-01, 1d
    Enrollment Period: 2025-03-01, 365d
\`\`\`

## Key Performance Indicators

**Enrollment Progress:** 0 / 500 (upcoming)
**Site Activation:** 0 / 25 (planning)
**Data Quality (Query Age):** 0 days (target: <15 days)

## Site Performance

| Site | Region | Status | Enrolled | Target |
|------|--------|--------|----------|--------|
| UCSF Medical Center | US | Planning | 0 | 30 |
| MD Anderson | US | Planning | 0 | 25 |
| Mayo Clinic | US | Planning | 0 | 20 |

## Key Milestones

- Protocol Finalized: January 2025
- First Site Initiation Visit: February 2025
- First Patient In (FPI): March 2025
- 50% Enrollment Complete: November 2025
- Last Patient In (LPI): March 2026
- Database Lock (DBL): July 2026

## Pre-Study Checklist

- IRB submission prepared and reviewed
- Site contracts negotiated and executed
- Staff training completed (GCP, protocol-specific)
- Pharmacy setup and drug accountability system
- Essential documents filed (CVs, licenses)
`

      // Parse the markdown content
      const parseResult = parseTabContent('trialOverview', markdownContent)

      // Verify we extracted multiple widget types
      expect(parseResult.widgets.length).toBeGreaterThan(5)

      // Verify diagram extraction
      const diagramWidgets = parseResult.widgets.filter(w => w.widgetType === 'diagram')
      expect(diagramWidgets.length).toBeGreaterThan(0)
      expect(diagramWidgets[0].content.diagramType).toBe('gantt')
      expect(diagramWidgets[0].content.diagramCode).toContain('LUMA-201')

      // Verify KPI extraction
      const kpiWidgets = parseResult.widgets.filter(w => w.widgetType === 'kpi')
      expect(kpiWidgets.length).toBeGreaterThan(0)
      const enrollmentKPI = kpiWidgets.find(w => w.title.includes('Enrollment'))
      expect(enrollmentKPI).toBeDefined()
      expect(enrollmentKPI?.content.value).toBe(0)
      expect(enrollmentKPI?.content.target).toBe(500)

      // Verify table extraction
      const tableWidgets = parseResult.widgets.filter(w => w.widgetType === 'table')
      expect(tableWidgets.length).toBeGreaterThan(0)
      expect(tableWidgets[0].content.headers).toContain('Site')
      expect(tableWidgets[0].content.data.length).toBe(3)

      // Verify timeline extraction
      const timelineWidgets = parseResult.widgets.filter(w => w.widgetType === 'timeline')
      expect(timelineWidgets.length).toBeGreaterThan(0)
      expect(timelineWidgets[0].content.milestones.length).toBeGreaterThan(3)

      // Verify list extraction
      const listWidgets = parseResult.widgets.filter(w => w.widgetType === 'list')
      expect(listWidgets.length).toBeGreaterThan(0)
      expect(listWidgets[0].content.items.length).toBeGreaterThan(3)
    })

    test('should handle complex clinical trial content', () => {
      const content = `
# Quality Metrics Dashboard

## Enrollment Metrics

\`\`\`mermaid
pie title Enrollment Status
    "Enrolled" : 125
    "Screening" : 30
    "Screen Failures" : 45
    "Remaining" : 300
\`\`\`

**Screening-to-Enrollment Ratio:** 2.5 (target: <3:1)
**Enrollment Rate:** 1.7 subjects/site/month
**Subject Retention Rate:** 95% (target: >85%)
**Visit Compliance:** 97% (target: >95%)

## Data Quality

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Query Rate | 0.4 queries/page | <0.5 | On Track |
| Query Aging (>30d) | 8% | <10% | On Track |
| Query Resolution Time | 6 days | <7 days | On Track |
| CRF Completion | 92% | >90% | On Track |

## Compliance Status

- SAE Reporting (<24h): 100% compliant
- ICF Version Compliance: 100% compliant
- Training Compliance: 98% compliant
- Document Completeness: 97% complete
`

      const result = parseTabContent('qualityMetrics', content)

      expect(result.widgets.length).toBeGreaterThan(6)

      // Should have pie diagram
      const pieWidget = result.widgets.find(w =>
        w.widgetType === 'diagram' && w.content.diagramType === 'pie'
      )
      expect(pieWidget).toBeDefined()

      // Should have multiple KPIs
      const kpis = result.widgets.filter(w => w.widgetType === 'kpi')
      expect(kpis.length).toBeGreaterThan(2)

      // Should have data quality table
      const tables = result.widgets.filter(w => w.widgetType === 'table')
      expect(tables.length).toBeGreaterThan(0)
      expect(tables[0].content.headers).toContain('Status')

      // Should have compliance checklist
      const lists = result.widgets.filter(w => w.widgetType === 'list')
      expect(lists.length).toBeGreaterThan(0)
    })
  })

  describe('Widget Conversion for Database', () => {

    test('should convert parsed widgets to database format', () => {
      const content = `
# Test Content

\`\`\`mermaid
flowchart TD
    A --> B
\`\`\`

**Test KPI:** 50 / 100
`

      const parseResult = parseTabContent('test', content)

      // This simulates what would happen in the API
      const widgets = parseResult.widgets.map((widget) => ({
        projectId: 'test-project',
        userId: 'test-user',
        tabType: parseResult.tabType,
        widgetType: widget.widgetType,
        title: widget.title,
        content: widget.content,
        rawContent: widget.rawContent,
        order: widget.order
      }))

      expect(widgets.length).toBe(2)

      // Verify structure matches database schema
      widgets.forEach(widget => {
        expect(widget).toHaveProperty('projectId')
        expect(widget).toHaveProperty('userId')
        expect(widget).toHaveProperty('tabType')
        expect(widget).toHaveProperty('widgetType')
        expect(widget).toHaveProperty('title')
        expect(widget).toHaveProperty('content')
        expect(widget).toHaveProperty('rawContent')
        expect(widget).toHaveProperty('order')
      })
    })
  })

  describe('Validation Chain', () => {

    test('should validate complete workflow from content to validated structure', () => {
      // Simulate structured response from MCP
      const structuredResponse = {
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
              value: 125,
              target: 500,
              unit: 'count',
              status: 'on-track'
            }
          },
          {
            id: 'table-1',
            type: 'table',
            title: 'Sites',
            order: 2,
            content: {
              headers: ['Site', 'Status'],
              rows: [{ Site: 'UCSF', Status: 'Active' }]
            }
          }
        ]
      }

      // Validate structure
      const isValid = validateStructuredResponse(structuredResponse)
      expect(isValid).toBe(true)

      // Convert to dashboard widgets
      const widgets = structuredToDashboardWidgets(
        structuredResponse,
        'project-123',
        'user-456'
      )

      expect(widgets.length).toBe(3)

      // Verify all widgets have required fields
      widgets.forEach(widget => {
        expect(widget.projectId).toBe('project-123')
        expect(widget.userId).toBe('user-456')
        expect(widget.tabType).toBe('trialTimeline')
        expect(widget.widgetType).toMatch(/^(diagram|kpi|table|timeline|list|text)$/)
        expect(widget.title).toBeTruthy()
        expect(widget.content).toBeTruthy()
        expect(widget.order).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('Error Handling', () => {

    test('should handle empty content gracefully', () => {
      const result = parseTabContent('test', '')

      expect(result.widgets.length).toBe(1)
      expect(result.widgets[0].widgetType).toBe('text')
    })

    test('should handle malformed tables', () => {
      const content = `
| Header 1 | Header 2
|----------|
| Value 1 | Value 2 | Extra |
`

      const result = parseTabContent('test', content)

      // Should not crash, might create text widget
      expect(result.widgets).toBeDefined()
    })

    test('should handle incomplete KPI patterns', () => {
      const content = `
**Incomplete KPI:**
**Another:** 50
`

      const result = parseTabContent('test', content)

      // Should parse what it can
      expect(result.widgets).toBeDefined()
    })
  })

  describe('Performance', () => {

    test('should handle large content efficiently', () => {
      const largeContent = `
# Large Document

${Array(50).fill(0).map((_, i) => `
## Section ${i}

\`\`\`mermaid
flowchart TD
    A${i} --> B${i}
\`\`\`

**Metric ${i}:** ${i * 10} / 100

| Col 1 | Col 2 |
|-------|-------|
| Val ${i} | Val ${i * 2} |

- Item ${i}.1
- Item ${i}.2
- Item ${i}.3
`).join('\n')}
`

      const startTime = Date.now()
      const result = parseTabContent('test', largeContent)
      const endTime = Date.now()

      // Should complete in reasonable time (< 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000)

      // Should extract many widgets
      expect(result.widgets.length).toBeGreaterThan(100)
    })
  })
})
