import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers)
  const cid = headers.get('x-correlation-id') || crypto.randomUUID()
  headers.set('x-correlation-id', cid)
  const response = NextResponse.next({ request: { headers } })
  response.headers.set('x-correlation-id', cid)
  return response
}
