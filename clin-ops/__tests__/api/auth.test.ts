/**
 * Integration Tests for Auth API
 */

import { POST as registerHandler } from '../../app/api/auth/register/route'
import { POST as loginHandler } from '../../app/api/auth/login/route'
import { POST as logoutHandler } from '../../app/api/auth/logout/route'
import { GET as meHandler } from '../../app/api/auth/me/route'

// Mock next/server
jest.mock('next/server', () => {
    return {
        NextResponse: {
            json: jest.fn((body, init) => {
                const cookies = new Map()
                return {
                    status: init?.status || 200,
                    json: async () => body,
                    cookies: {
                        set: jest.fn((name, value, options) => {
                            cookies.set(name, { value, ...options })
                        }),
                        get: jest.fn((name) => cookies.get(name)),
                        delete: jest.fn((name) => cookies.delete(name)),
                    }
                }
            })
        },
        NextRequest: class {
            constructor(url, init) {
                this.url = url
                this.method = init?.method || 'GET'
                this.body = init?.body
            }
            json() {
                return Promise.resolve(JSON.parse(this.body as string))
            }
        }
    }
})

const { NextRequest } = require('next/server')

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn()
        }
    }
}))

jest.mock('@/lib/hash', () => ({
    hashPassword: jest.fn(),
    verifyPassword: jest.fn()
}))

jest.mock('@/lib/jwt', () => ({
    signAuthToken: jest.fn(),
    verifyAuthToken: jest.fn()
}))

jest.mock('next/headers', () => ({
    cookies: jest.fn()
}))

// Import mocks to control them
import prisma from '@/lib/prisma'
import { hashPassword, verifyPassword } from '@/lib/hash'
import { signAuthToken, verifyAuthToken } from '@/lib/jwt'
import { cookies } from 'next/headers'

describe('Auth API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('POST /api/auth/register', () => {
        test('should register new user successfully', async () => {
            const body = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User'
            }
            const req = new NextRequest('http://localhost/api/auth/register', {
                method: 'POST',
                body: JSON.stringify(body)
            })

                // Mock Prisma: No existing user, then create user
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
                ; (prisma.user.create as jest.Mock).mockResolvedValue({
                    id: 'user-1',
                    email: body.email,
                    name: body.name,
                    createdAt: new Date()
                })

                // Mock Hash & JWT
                ; (hashPassword as jest.Mock).mockResolvedValue('hashed-password')
                ; (signAuthToken as jest.Mock).mockResolvedValue('jwt-token')

            const res = await registerHandler(req)
            const data = await res.json()

            expect(res.status).toBe(201)
            expect(data.email).toBe(body.email)
            expect(res.cookies.get('auth')).toBeDefined()
            expect(prisma.user.create).toHaveBeenCalled()
        })

        test('should fail if email already exists', async () => {
            const body = {
                email: 'existing@example.com',
                password: 'password123'
            }
            const req = new NextRequest('http://localhost/api/auth/register', {
                method: 'POST',
                body: JSON.stringify(body)
            })

                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' })

            const res = await registerHandler(req)
            const data = await res.json()

            expect(res.status).toBe(409)
            expect(data.error).toBe('Email already registered')
        })
    })

    describe('POST /api/auth/login', () => {
        test('should login successfully with correct credentials', async () => {
            const body = {
                email: 'test@example.com',
                password: 'password123'
            }
            const req = new NextRequest('http://localhost/api/auth/login', {
                method: 'POST',
                body: JSON.stringify(body)
            })

                // Mock user found
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                    id: 'user-1',
                    email: body.email,
                    passwordHash: 'hashed-password',
                    name: 'Test User'
                })

                // Mock password verify true
                ; (verifyPassword as jest.Mock).mockResolvedValue(true)
                ; (signAuthToken as jest.Mock).mockResolvedValue('jwt-token')

            const res = await loginHandler(req)
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.email).toBe(body.email)
            expect(res.cookies.get('auth')).toBeDefined()
        })

        test('should fail with invalid credentials', async () => {
            const body = {
                email: 'test@example.com',
                password: 'wrongpassword'
            }
            const req = new NextRequest('http://localhost/api/auth/login', {
                method: 'POST',
                body: JSON.stringify(body)
            })

                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                    id: 'user-1',
                    passwordHash: 'hashed-password'
                })
                ; (verifyPassword as jest.Mock).mockResolvedValue(false)

            const res = await loginHandler(req)

            expect(res.status).toBe(401)
        })
    })

    describe('GET /api/auth/me', () => {
        test('should return user data if token is valid', async () => {
            // Mock cookies
            ; (cookies as jest.Mock).mockResolvedValue({
                get: () => ({ value: 'valid-token' })
            })

                // Mock JWT verify
                ; (verifyAuthToken as jest.Mock).mockResolvedValue({ sub: 'user-1' })

                // Mock Prisma user lookup
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                    id: 'user-1',
                    email: 'test@example.com',
                    name: 'Test User'
                })

            const res = await meHandler()
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.email).toBe('test@example.com')
        })

        test('should return 401 if no token', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: () => undefined
            })

            const res = await meHandler()
            expect(res.status).toBe(401)
        })

        test('should return 401 if token invalid', async () => {
            ; (cookies as jest.Mock).mockResolvedValue({
                get: () => ({ value: 'invalid-token' })
            })
                ; (verifyAuthToken as jest.Mock).mockRejectedValue(new Error('Invalid token'))

            const res = await meHandler()
            expect(res.status).toBe(401)
        })
    })

    describe('POST /api/auth/logout', () => {
        test('should clear auth cookie', async () => {
            const res = await logoutHandler()

            expect(res.status).toBe(200)
            // Check if maxAge is set to 0 to expire cookie
            const cookie = res.cookies.get('auth')
            expect(cookie).toBeDefined()
            expect(cookie?.maxAge).toBe(0)
        })
    })
})
