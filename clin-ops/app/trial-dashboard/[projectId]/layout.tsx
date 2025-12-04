'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/app/components/Sidebar'

type User = {
  id: string
  email: string
  name?: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let ignore = false
      ; (async () => {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (res.ok) {
          const u = await res.json()
          if (!ignore) setUser(u)
        } else {
          if (!ignore) {
            setUser(null)
            // router.push('/') // Removed redirect for guest users
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

  // if (!user) {
  //   return null
  // }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentUser={user || undefined} />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
