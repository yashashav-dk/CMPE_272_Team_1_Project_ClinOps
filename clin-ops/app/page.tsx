'use client'

import { useEffect, useState } from 'react'
import ContextAwareChat from './ContextAwareChat'

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

  useEffect(() => {
    let ignore = false
    ;(async () => {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (res.ok) {
        const u = await res.json()
        if (!ignore) setUser(u)
      } else {
        if (!ignore) setUser(null)
      }
      if (!ignore) setLoading(false)
    })()
    return () => {
      ignore = true
    }
  }, [])

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
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Hello {user.name || user.email}</h2>
              <div className="h-[70vh] w-full border rounded">
                <ContextAwareChat />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
