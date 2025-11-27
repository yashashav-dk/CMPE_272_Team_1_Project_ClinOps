/**
 * Unit Tests for Visualization Widgets
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import InteractiveTimeline from '../../app/trial-dashboard/[projectId]/components/InteractiveTimeline'
import InteractiveWorkflow from '../../app/trial-dashboard/[projectId]/components/InteractiveWorkflow'
import EnhancedMermaidViewer from '../../app/trial-dashboard/[projectId]/components/EnhancedMermaidViewer'

// Mock MermaidDiagram
jest.mock('../../app/MermaidDiagram', () => () => <div data-testid="mermaid-diagram">Mermaid Diagram</div>)

describe('Visualization Widgets', () => {
    describe('InteractiveTimeline', () => {
        const mockMilestones = [
            { name: 'M1', date: '2023-01-01', status: 'completed' as const, description: 'Desc 1' },
            { name: 'M2', date: '2023-02-01', status: 'upcoming' as const, dependencies: ['M1'] }
        ]

        test('renders milestones', () => {
            render(<InteractiveTimeline milestones={mockMilestones} />)
            expect(screen.getByText('M1')).toBeInTheDocument()
            expect(screen.getByText('M2')).toBeInTheDocument()
        })

        test('filters by status', () => {
            render(<InteractiveTimeline milestones={mockMilestones} />)

            const completedFilterBtn = screen.getByRole('button', { name: /Completed/i })
            fireEvent.click(completedFilterBtn)

            expect(screen.getByText('M1')).toBeInTheDocument()
            expect(screen.queryByText('M2')).not.toBeInTheDocument()
        })

        test('expands milestone details', () => {
            render(<InteractiveTimeline milestones={mockMilestones} />)

            const milestone = screen.getByText('M1')
            fireEvent.click(milestone)

            expect(screen.getByText('Desc 1')).toBeInTheDocument()
        })
    })

    describe('InteractiveWorkflow', () => {
        const mockSteps = [
            { name: 'Step 1', status: 'completed' as const, description: 'Desc 1' },
            { name: 'Step 2', status: 'active' as const }
        ]

        test('renders steps', () => {
            render(<InteractiveWorkflow steps={mockSteps} />)
            expect(screen.getByText('Step 1')).toBeInTheDocument()
            expect(screen.getByText('Step 2')).toBeInTheDocument()
        })

        test('toggles view mode', () => {
            render(<InteractiveWorkflow steps={mockSteps} />)

            const toggleBtn = screen.getByText('Switch to Horizontal View')
            fireEvent.click(toggleBtn)

            expect(screen.getByText('Switch to Vertical View')).toBeInTheDocument()
        })

        test('expands step details', () => {
            render(<InteractiveWorkflow steps={mockSteps} />)

            const step = screen.getByText('Step 1')
            fireEvent.click(step)

            expect(screen.getByText('Desc 1')).toBeInTheDocument()
        })
    })

    describe('EnhancedMermaidViewer', () => {
        test('renders diagram', () => {
            render(
                <EnhancedMermaidViewer
                    chart="graph TD; A-->B;"
                    projectId="p1"
                    title="Test Diagram"
                />
            )
            expect(screen.getByTestId('mermaid-diagram')).toBeInTheDocument()
        })

        test('handles zoom controls', () => {
            render(
                <EnhancedMermaidViewer
                    chart="graph TD; A-->B;"
                    projectId="p1"
                />
            )

            const zoomInBtn = screen.getByTitle('Zoom In')
            fireEvent.click(zoomInBtn)

            expect(screen.getByText('110%')).toBeInTheDocument()

            const resetBtn = screen.getByTitle('Reset Zoom')
            fireEvent.click(resetBtn)

            expect(screen.getByText('100%')).toBeInTheDocument()
        })

        test('toggles fullscreen', () => {
            render(
                <EnhancedMermaidViewer
                    chart="graph TD; A-->B;"
                    projectId="p1"
                />
            )

            const fullscreenBtn = screen.getByTitle('Fullscreen')
            fireEvent.click(fullscreenBtn)

            expect(screen.getByText('Close Fullscreen')).toBeInTheDocument()
        })
    })
})
