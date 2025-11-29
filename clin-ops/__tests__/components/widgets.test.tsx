/**
 * Unit Tests for Dashboard Widgets
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import WidgetRenderer from '../../app/trial-dashboard/[projectId]/components/WidgetRenderer'
import EnhancedKPICard, { KPIData } from '../../app/trial-dashboard/[projectId]/components/EnhancedKPICard'

// Mock Recharts
jest.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Line: () => <div>Line</div>
}))

// Mock React Markdown
jest.mock('react-markdown', () => ({ children }: { children: React.ReactNode }) => <div>{children}</div>)

// Mock Sub-components
jest.mock('../../app/trial-dashboard/[projectId]/components/EnhancedMermaidViewer', () => () => <div data-testid="mermaid-viewer">Mermaid Viewer</div>)
jest.mock('../../app/trial-dashboard/[projectId]/components/AdvancedTable', () => () => <div data-testid="advanced-table">Advanced Table</div>)
jest.mock('../../app/trial-dashboard/[projectId]/components/InteractiveTimeline', () => () => <div data-testid="timeline">Timeline</div>)
jest.mock('../../app/trial-dashboard/[projectId]/components/InteractiveWorkflow', () => () => <div data-testid="workflow">Workflow</div>)
jest.mock('../../app/trial-dashboard/[projectId]/components/InteractiveChecklist', () => () => <div data-testid="checklist">Checklist</div>)
jest.mock('../../app/trial-dashboard/[projectId]/components/EnhancedInteractiveChecklist', () => () => <div data-testid="enhanced-checklist">Enhanced Checklist</div>)
jest.mock('../../app/trial-dashboard/[projectId]/components/InteractiveTable', () => () => <div data-testid="interactive-table">Interactive Table</div>)
jest.mock('../../app/trial-dashboard/[projectId]/components/ChartWidget', () => () => <div data-testid="chart-widget">Chart Widget</div>)

describe('Dashboard Widgets', () => {
    describe('EnhancedKPICard', () => {
        const mockKPI: KPIData = {
            value: 100,
            target: 200,
            unit: 'count',
            status: 'on-track',
            trend: 'up',
            trendValue: 10
        }

        test('renders KPI value and target', () => {
            render(<EnhancedKPICard kpi={mockKPI} title="Test KPI" />)
            expect(screen.getByText('100')).toBeInTheDocument()
            expect(screen.getByText('/ 200')).toBeInTheDocument()
            expect(screen.getByText('Test KPI')).toBeInTheDocument()
        })

        test('renders status badge', () => {
            render(<EnhancedKPICard kpi={mockKPI} title="Test KPI" />)
            expect(screen.getByText('on track')).toBeInTheDocument()
        })

        test('renders trend indicator', () => {
            render(<EnhancedKPICard kpi={mockKPI} title="Test KPI" />)
            expect(screen.getByText('+10.0%')).toBeInTheDocument()
        })
    })

    describe('WidgetRenderer', () => {
        const baseWidget = {
            id: 'w1',
            projectId: 'p1',
            title: 'Test Widget',
            tabType: 'overview',
            rawContent: ''
        }

        test('renders KPI widget', () => {
            const widget = {
                ...baseWidget,
                widgetType: 'kpi',
                content: {
                    value: 100,
                    unit: 'count',
                    status: 'on-track'
                }
            }
            render(<WidgetRenderer widget={widget} />)
            expect(screen.getByText('100')).toBeInTheDocument()
        })

        test('renders chart widget', () => {
            const widget = {
                ...baseWidget,
                widgetType: 'chart',
                content: {
                    chartType: 'bar',
                    data: [],
                    description: 'Test Chart'
                }
            }
            render(<WidgetRenderer widget={widget} />)
            expect(screen.getByTestId('chart-widget')).toBeInTheDocument()
        })

        test('renders table widget', () => {
            const widget = {
                ...baseWidget,
                widgetType: 'table',
                content: {
                    rows: [],
                    headers: []
                }
            }
            render(<WidgetRenderer widget={widget} />)
            expect(screen.getByTestId('advanced-table')).toBeInTheDocument()
        })

        test('renders diagram widget', () => {
            const widget = {
                ...baseWidget,
                widgetType: 'diagram',
                content: {
                    diagramCode: 'graph TD; A-->B;'
                }
            }
            render(<WidgetRenderer widget={widget} />)
            expect(screen.getByTestId('mermaid-viewer')).toBeInTheDocument()
        })

        test('renders text widget', () => {
            const widget = {
                ...baseWidget,
                widgetType: 'text',
                content: {
                    markdown: '# Hello World'
                }
            }
            render(<WidgetRenderer widget={widget} />)
            expect(screen.getByText('# Hello World')).toBeInTheDocument()
        })

        test('handles delete action', () => {
            const onDelete = jest.fn()
            const widget = {
                ...baseWidget,
                widgetType: 'text',
                content: { markdown: 'test' }
            }
            render(<WidgetRenderer widget={widget} onDelete={onDelete} />)

            const deleteBtn = screen.getByTitle('Remove from dashboard')
            fireEvent.click(deleteBtn)

            expect(onDelete).toHaveBeenCalledWith('w1')
        })
    })
})
