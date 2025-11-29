/**
 * Unit Tests for Request Utility
 */

import { req } from '../../services/_req'

// Mock fetch
global.fetch = jest.fn()

describe('_req', () => {
    beforeEach(() => {
        jest.clearAllMocks()
            ; (global.fetch as jest.Mock).mockReset()
    })

    test('post calls fetch with correct options', async () => {
        const mockResponse = { success: true }
            ; (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            })

        const data = { foo: 'bar' }
        const result = await req.post('/api/test', data)

        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/test'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        expect(result).toEqual(mockResponse)
    })

    test('get calls fetch with correct options', async () => {
        const mockResponse = { data: 'test' }
            ; (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            })

        const result = await req.get('/api/test')

        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/test'), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        expect(result).toEqual(mockResponse)
    })

    test('handles errors', async () => {
        ; (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: async () => 'Error details'
        })

        await expect(req.post('/api/test', {})).rejects.toEqual(
            expect.objectContaining({
                response: {
                    data: {
                        error: 'HTTP 500: Internal Server Error',
                        details: 'Error details'
                    }
                }
            })
        )
    })
})
