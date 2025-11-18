'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/app/components/Sidebar'

type User = {
  id: string
  email: string
  name?: string
}

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let ignore = false
    ;(async () => {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (res.ok) {
        const u = await res.json()
        if (!ignore) setUser(u)
      } else {
        if (!ignore) {
          // Guest user - allow access without redirecting
          setUser(null)
        }
      }
      if (!ignore) setLoading(false)
    })()
    return () => {
      ignore = true
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {user && <Sidebar currentUser={user} />}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
