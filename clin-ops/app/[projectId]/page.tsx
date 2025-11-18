'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ContextAwareChat from '@/app/ContextAwareChat'
import LogoutButton from '@/app/components/LogoutButton'

type User = { id: string; email: string; name?: string; createdAt?: string }

export default function ProjectChatPage() {
  const params = useParams()
  const projectId = params?.projectId as string
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (!ignore) {
          if (res.ok) {
            const u = await res.json()
            setUser(u)
          } else {
            setUser(null)
          }
        }
      } catch {
        if (!ignore) setUser(null)
      }
    })()
    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="font-semibold">ClinOps</div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-700">{user.email}</span>
                <LogoutButton />
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/?auth=login')}
                  className="border rounded px-3 py-1 text-sm"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push('/?auth=register')}
                  className="border rounded px-3 py-1 text-sm"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="h-full">
          <ContextAwareChat key={projectId} />
        </div>
      </main>
    </div>
  )
}
