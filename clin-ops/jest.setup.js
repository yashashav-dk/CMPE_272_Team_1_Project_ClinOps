// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill Request/Response/Headers for Node environment if missing
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init) {
      try {
        this.url = input
      } catch (e) {
        Object.defineProperty(this, 'url', { value: input, writable: true, configurable: true })
      }
      this.method = init?.method || 'GET'
      this.headers = new Headers(init?.headers)
      this.body = init?.body
      this.json = async () => {
        if (typeof this.body === 'string') return JSON.parse(this.body)
        return this.body
      }
    }
  }
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body
      this.status = init?.status || 200
      this.headers = new Headers(init?.headers)
      this.cookies = {
        set: jest.fn(),
        get: jest.fn(),
        getAll: jest.fn(),
        delete: jest.fn(),
      }
    }
    json() {
      return Promise.resolve(this.body)
    }
    static json(body, init) {
      const res = new Response(body, init)
      return res
    }
  }
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init) {
      this.map = new Map(Object.entries(init || {}))
    }
    get(name) { return this.map.get(name) }
    set(name, value) { this.map.set(name, value) }
    entries() { return this.map.entries() }
  }
}

// Mock environment variables for tests
process.env.GEMINI_API_KEY = 'test-api-key'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  useParams() {
    return {
      projectId: 'test-project',
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Suppress console errors during tests (optional)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}
