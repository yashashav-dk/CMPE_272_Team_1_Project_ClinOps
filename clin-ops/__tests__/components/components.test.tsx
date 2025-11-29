/**
 * Unit Tests for Shared UI Components
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import LogoutButton from '../../app/components/LogoutButton'
import Feedback from '../../app/components/feedback'
import Sidebar from '../../app/components/Sidebar'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        refresh: jest.fn()
    }),
    useParams: () => ({
        projectId: 'p1'
    })
}))

// Mock fetch
global.fetch = jest.fn()

describe('Shared Components', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('LogoutButton', () => {
        test('renders logout button', () => {
            render(<LogoutButton />)
            expect(screen.getByText('Logout')).toBeInTheDocument()
        })

        test('handles logout click', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValue({ ok: true })

            render(<LogoutButton />)
            fireEvent.click(screen.getByText('Logout'))

            expect(screen.getByText('Logging out…')).toBeInTheDocument()
            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', expect.any(Object))
                expect(mockPush).toHaveBeenCalledWith('/')
            })
        })
    })

    describe('Feedback', () => {
        test('renders feedback buttons', () => {
            render(<Feedback />)
            expect(screen.getByText('👍')).toBeInTheDocument()
            expect(screen.getByText('👎')).toBeInTheDocument()
        })

        test('handles feedback submission', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValue({ ok: true })

            render(<Feedback />)
            fireEvent.click(screen.getByText('👍'))

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith('/api/feedback', expect.objectContaining({
                    body: JSON.stringify({ type: 'up' })
                }))
                expect(screen.getByText(/Thanks for your feedback/)).toBeInTheDocument()
            })
        })
    })

    describe('Sidebar', () => {
        const mockUser = { id: 'u1', email: 'test@example.com', name: 'Test User' }
        const mockProjects = [
            { id: 'p1', name: 'Project 1', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
            { id: 'p2', name: 'Project 2', createdAt: '2023-01-02', updatedAt: '2023-01-02' }
        ]

        test('renders sidebar with user email', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValue({
                json: async () => ({ success: true, data: [] })
            })

            render(<Sidebar currentUser={mockUser} />)

            expect(screen.getByText(mockUser.email)).toBeInTheDocument()
            expect(screen.getByText('ClinOps')).toBeInTheDocument()
        })

        test('fetches and displays projects', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValue({
                json: async () => ({ success: true, data: mockProjects })
            })

            render(<Sidebar currentUser={mockUser} />)

            await waitFor(() => {
                expect(screen.getByText('Project 1')).toBeInTheDocument()
                expect(screen.getByText('Project 2')).toBeInTheDocument()
            })
        })

        test('opens new project modal', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValue({
                json: async () => ({ success: true, data: [] })
            })

            render(<Sidebar currentUser={mockUser} />)

            fireEvent.click(screen.getByText('New Project'))

            expect(screen.getByText('Create New Project')).toBeInTheDocument()
            expect(screen.getByPlaceholderText('Enter project name')).toBeInTheDocument()
        })
    })
})
