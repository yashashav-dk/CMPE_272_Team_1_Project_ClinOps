'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    if (loading) return
    setLoading(true)
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      setLoading(false)
      router.push('/')
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="border rounded px-3 py-1 text-sm bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50"
    >
      {loading ? 'Exiting...' : 'Exit'}
    </button>
  )
}
