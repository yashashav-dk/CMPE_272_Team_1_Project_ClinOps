'use client'

import Feedback from './components/feedback'
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
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
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
      } catch (error) {
        // Gracefully handle fetch errors - allow guest access
        console.error('Auth check failed:', error)
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

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()

    if (!newProjectName.trim()) {
      alert('Please enter a project name')
      return
    }

    setIsCreating(true)

    try {
      if (user) {
        // Authenticated user - create project via API
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: newProjectName.trim(),
            description: newProjectDescription.trim() || undefined
          })
        })

        if (res.ok) {
          const result = await res.json()
          if (result.success) {
            router.push(`/${result.data.id}`)
          } else {
            alert(`Failed to create project: ${result.error}`)
          }
        } else {
          const result = await res.json().catch(() => ({}))
          alert(`Failed to create project: ${result.error || 'Unknown error'}`)
        }
      } else {
        // Guest user - create local project
        const projectId = `project-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
        if (typeof window !== 'undefined') {
          const meta = {
            name: newProjectName.trim(),
            description: newProjectDescription.trim() || undefined
          }
          window.localStorage.setItem(`project:${projectId}:meta`, JSON.stringify(meta))
        }
        setShowProjectModal(false)
        setNewProjectName('')
        setNewProjectDescription('')
        router.push(`/${projectId}`)
      }
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project')
    } finally {
      setIsCreating(false)
    }
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
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold">Welcome to ClinOps</h1>
              <p className="text-gray-600 max-w-2xl text-lg">
                Spin up a clinical trial project with an AI co-pilot in minutes. No login required to try it out.
              </p>
            </div>
            <button
              onClick={() => setShowProjectModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg font-medium text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Create a Project
            </button>
            <p className="text-sm text-gray-500">
              Start experimenting immediately. {!user && 'Create an account later to save your work.'}
            </p>
          </div>
        </div>
      </main>

      {/* New Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Create New Project
            </h3>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g., LUMA-201 Phase III Trial"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Brief description of your clinical trial project"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isCreating}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProjectModal(false)
                    setNewProjectName('')
                    setNewProjectDescription('')
                  }}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newProjectName.trim()}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg"
                >
                  {isCreating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
