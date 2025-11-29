/**
 * Integration Tests for Health Check API
 */

import { GET as healthHandler } from '../../app/api/health/route'

// Mock next/server
jest.mock('next/server', () => {
    return {
        NextResponse: {
            json: jest.fn((body, init) => ({
                status: init?.status || 200,
                json: async () => body,
            }))
        }
    }
})

describe('Health Check API', () => {
    describe('GET /api/health', () => {
        test('should return ok status', async () => {
            const res = await healthHandler()
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.status).toBe('ok')
            expect(data.uptime).toBeDefined()
        })
    })
})
