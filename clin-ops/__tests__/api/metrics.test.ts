/**
 * Integration Tests for Metrics API
 */

import { GET as metricsHandler } from '../../app/api/metrics/route'

// Mock next/server
jest.mock('next/server', () => {
    return {
        NextResponse: class {
            constructor(body, init) {
                this.body = body
                this.status = init?.status || 200
                this.headers = new Map(Object.entries(init?.headers || {}))
            }
        }
    }
})

// Mock dependencies
jest.mock('@/lib/metrics', () => ({
    metricsText: jest.fn()
}))

import { metricsText } from '@/lib/metrics'

describe('Metrics API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('GET /api/metrics', () => {
        test('should return metrics', async () => {
            ; (metricsText as jest.Mock).mockResolvedValue('metrics_data')

            const res = await metricsHandler()

            expect(res.status).toBe(200)
            expect(res.body).toBe('metrics_data')
            expect(res.headers.get('Content-Type')).toContain('text/plain')
        })
    })
})
