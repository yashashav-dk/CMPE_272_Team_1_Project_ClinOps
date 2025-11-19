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
    <div className="h-screen flex flex-col bg-gray-950 text-gray-100">
      <header className="flex-shrink-0 w-full border-b border-gray-800 bg-gray-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-semibold tracking-tight">
              CO
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">
                ClinOps Project Workspace
              </div>
              <div className="text-xs text-gray-400 truncate">
                Project ID: <span className="font-mono text-[11px]">{projectId}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-gray-400">Signed in as</div>
                  <div className="text-sm font-medium text-white truncate max-w-[200px]">
                    {user.email}
                  </div>
                </div>
                <LogoutButton />
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/?auth=login')}
                  className="px-3 py-1.5 text-xs sm:text-sm rounded-md border border-gray-700 text-gray-100 hover:bg-gray-800 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push('/?auth=register')}
                  className="px-3 py-1.5 text-xs sm:text-sm rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-colors"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <ContextAwareChat key={projectId} user={user} />
      </main>
    </div>
  )
}