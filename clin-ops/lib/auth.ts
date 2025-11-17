import { NextRequest } from 'next/server'
import { verifyAuthToken } from './jwt'

/**
 * Verify authentication token from request cookies
 * Returns the JWT payload if valid, null if invalid
 */
export async function verifyAuth(request: NextRequest): Promise<{ userId: string; email: string } | null> {
  try {
    const token = request.cookies.get('auth')?.value
    if (!token) {
      return null
    }

    const payload = await verifyAuthToken(token)
    return {
      userId: String(payload.sub),
      email: payload.email
    }
  } catch {
    return null
  }
}
