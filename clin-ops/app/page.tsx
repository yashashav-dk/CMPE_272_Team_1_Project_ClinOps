'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type User = { id: string; email: string; name?: string; createdAt: string }

type AuthFormProps = { mode: 'login' | 'register'; onSuccess: (u: User) => void }

function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const body: any = { email, password }
    if (mode === 'register') body.name = name
    const res = await fetch(`/api/auth/${mode === 'register' ? 'register' : 'login'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => null)
      setError(j?.error || 'Request failed')
      setLoading(false)
      return
    }
    const user = await res.json()
    onSuccess(user)
    setLoading(false)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 w-full max-w-sm">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border rounded px-3 py-2"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border rounded px-3 py-2"
        required
        minLength={8}
      />
      {mode === 'register' && (
        <input
          type="text"
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border rounded px-3 py-2"
        />
      )}
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {loading ? 'Please wait…' : mode === 'register' ? 'Sign up' : 'Log in'}
      </button>
    </form>
  )
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const router = useRouter()

  useEffect(() => {
    let ignore = false
    ;(async () => {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (res.ok) {
        const u = await res.json()
        if (!ignore) {
          setUser(u)
          // Redirect to first project if user is logged in
          const projectsRes = await fetch('/api/projects', { credentials: 'include' })
          if (projectsRes.ok) {
            const result = await projectsRes.json()
            if (result.success && result.data.length > 0) {
              router.push(`/${result.data[0].id}`)
              return
            }
          }
        }
      } else {
        if (!ignore) setUser(null)
      }
      if (!ignore) setLoading(false)
    })()
    return () => {
      ignore = true
    }
  }, [router])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <header className="w-full border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="font-semibold">ClinOps</div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-700">{user.email}</span>
                <button onClick={logout} className="border rounded px-3 py-1">Logout</button>
              </>
            ) : (
              <>
                <button onClick={() => setMode('login')} className={`border rounded px-3 py-1 ${mode === 'login' ? 'bg-black text-white' : ''}`}>Login</button>
                <button onClick={() => setMode('register')} className={`border rounded px-3 py-1 ${mode === 'register' ? 'bg-black text-white' : ''}`}>Sign up</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-10">
          {!user ? (
            <div className="grid md:grid-cols-2 gap-10 items-start">
              <div className="space-y-6">
                <h1 className="text-3xl font-semibold">Welcome to ClinOps</h1>
                <p className="text-gray-600">Sign up or log in to continue. Once authenticated, you will see the app experience below.</p>
                <div className="flex gap-2">
                  <button onClick={() => setMode('login')} className={`border rounded px-3 py-1 ${mode === 'login' ? 'bg-black text-white' : ''}`}>Login</button>
                  <button onClick={() => setMode('register')} className={`border rounded px-3 py-1 ${mode === 'register' ? 'bg-black text-white' : ''}`}>Sign up</button>
                </div>
                <div className="pt-2">
                  <AuthForm mode={mode} onSuccess={(u) => setUser(u)} />
                </div>
              </div>
              <div className="border rounded p-4">
                <div className="text-sm text-gray-600 mb-2">Preview</div>
                <div className="text-gray-500">You will see the app here after logging in.</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-semibold">Welcome to ClinOps</h2>
                <p className="text-gray-600 max-w-md">
                  You don't have any projects yet. Create your first clinical trial project to get started.
                </p>
              </div>
              <button
                onClick={async () => {
                  const name = prompt('Enter project name:')
                  if (!name?.trim()) return

                  const res = await fetch('/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ name: name.trim() })
                  })

                  if (res.ok) {
                    const result = await res.json()
                    if (result.success) {
                      router.push(`/${result.data.id}`)
                    }
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Create Your First Project
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
