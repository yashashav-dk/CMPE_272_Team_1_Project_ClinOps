/**
 * Unit Tests for Main Pages
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import LandingPage from '../../app/page'
import DashboardPage from '../../app/dashboard/[projectId]/page'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        refresh: jest.fn()
    }),
    useSearchParams: () => ({
        get: jest.fn()
    }),
    useParams: () => ({
        projectId: 'p1'
    })
}))

// Mock MermaidDiagram
jest.mock('../../app/MermaidDiagram', () => () => <div data-testid="mermaid-diagram">Mermaid Diagram</div>)

// Mock LoadingSpinner
jest.mock('../../app/LoadingSpinner', () => () => <div data-testid="loading-spinner">Loading...</div>)

// Mock fetch
global.fetch = jest.fn()

// Mock window.confirm
global.confirm = jest.fn()

describe('Main Pages', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('LandingPage', () => {
        test('renders hero section', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValue({ ok: false }) // No user

            render(<LandingPage />)

            expect(screen.getByText(/Streamline Your Clinical Trials/i)).toBeInTheDocument()
            expect(screen.getByText('Create Your First Project - No Login Required')).toBeInTheDocument()
        })

        test('renders auth form when no user', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValue({ ok: false })

            render(<LandingPage />)

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
                expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
            })
        })

        test('redirects if user is logged in', async () => {
            ; (global.fetch as jest.Mock).mockImplementation((url) => {
                if (url === '/api/auth/me') {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({ id: 'u1', email: 'test@example.com' })
                    })
                }
                if (url === '/api/projects') {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({ success: true, data: [{ id: 'p1' }] })
                    })
                }
                return Promise.resolve({ ok: false })
            })

            render(<LandingPage />)

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/p1')
            })
        })
    })

    describe('DashboardPage', () => {
        const mockDiagrams = [
            {
                id: 'd1',
                title: 'Test Diagram',
                diagramCode: 'graph TD; A-->B;',
                diagramType: 'mermaid',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ]

        test('renders diagrams', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValue({
                json: async () => ({ success: true, data: mockDiagrams })
            })

            render(<DashboardPage />)

            await waitFor(() => {
                expect(screen.getByText('Test Diagram')).toBeInTheDocument()
                expect(screen.getByTestId('mermaid-diagram')).toBeInTheDocument()
            })
        })

        test('handles delete diagram', async () => {
            ; (global.fetch as jest.Mock).mockImplementation((url, options) => {
                if (options?.method === 'DELETE') {
                    return Promise.resolve({
                        json: async () => ({ success: true })
                    })
                }
                return Promise.resolve({
                    json: async () => ({ success: true, data: mockDiagrams })
                })
            })
                ; (global.confirm as jest.Mock).mockReturnValue(true)

            render(<DashboardPage />)

            await waitFor(() => {
                expect(screen.getByText('Test Diagram')).toBeInTheDocument()
            })

            const deleteBtn = screen.getByTitle('Delete diagram')
            fireEvent.click(deleteBtn)

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('?diagramId=d1'),
                    expect.objectContaining({ method: 'DELETE' })
                )
                expect(screen.queryByText('Test Diagram')).not.toBeInTheDocument()
            })
        })

        test('displays error state', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValue({
                json: async () => ({ success: false, error: 'Failed to fetch' })
            })

            render(<DashboardPage />)

            await waitFor(() => {
                expect(screen.getByText('Failed to fetch')).toBeInTheDocument()
            })
        })
    })
})

