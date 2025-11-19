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
            
            // If user is logged in, ensure project exists in database
            if (projectId && u) {
              try {
                // Check if project exists, if not create it
                const checkRes = await fetch(`/api/projects/ensure?projectId=${projectId}`, {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    projectId,
                    name: getProjectNameFromLocalStorage(projectId) || 'Untitled Project'
                  })
                })
                
                if (!checkRes.ok) {
                  console.error('Failed to ensure project exists in database')
                }
              } catch (err) {
                console.error('Error ensuring project exists:', err)
              }
            }
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
  }, [projectId])
  
  // Helper to get project name from localStorage
  function getProjectNameFromLocalStorage(projectId: string): string | null {
    if (typeof window === 'undefined') return null
    try {
      const meta = window.localStorage.getItem(`project:${projectId}:meta`)
      if (meta) {
        const parsed = JSON.parse(meta)
        return parsed.name || null
      }
    } catch {
      return null
    }
    return null
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="flex-none w-full border-b">
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
      <main className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full">
          <ContextAwareChat key={projectId} />
        </div>
      </main>
    </div>
  )
}
