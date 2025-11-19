'use client'

import Feedback from './components/feedback'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type User = { id: string; email: string; name?: string; createdAt: string }

type AuthFormProps = { mode: 'login' | 'register'; onSuccess: (u: User) => void }

function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const body: any = { email, password }
    if (mode === 'register') {
      body.firstName = firstName
      body.lastName = lastName
    }
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
        <>
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="border rounded px-3 py-2"
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="border rounded px-3 py-2"
            required
          />
        </>
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
  const searchParams = useSearchParams()

  // Sync auth mode from URL query (e.g. /?auth=login or /?auth=register)
  useEffect(() => {
    const authMode = searchParams.get('auth')
    if (authMode === 'login' || authMode === 'register') {
      setMode(authMode)
    }
  }, [searchParams])

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

  async function createGuestProject() {
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
          if (res.status === 401 || result.error === 'Unauthorized') {
            setUser(null)
            await createGuestProject()
          } else {
            alert(`Failed to create project: ${result.error || 'Unknown error'}`)
          }
        }
      } else {
        await createGuestProject()
      }
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project')
    } finally {
      setIsCreating(false)
    }
  }

  function handleAuthSuccess(u: User) {
    setUser(u)
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-50">
      <header className="w-full border-b border-white/10 backdrop-blur-sm bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/40">
              <span className="text-xs font-bold tracking-tight">CO</span>
            </div>
            <div>
              <div className="font-semibold tracking-tight text-sm">ClinOps</div>
              <div className="text-[11px] text-slate-400">AI Co‑pilot for Clinical Trials</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {user ? (
              <>
                <span className="text-slate-300 hidden sm:inline">{user.email}</span>
                <button
                  onClick={logout}
                  className="border border-slate-600/70 bg-slate-900/60 hover:bg-slate-800/80 text-slate-100 rounded-full px-3 py-1 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setMode('login')}
                  className={`rounded-full px-3 py-1 border text-xs transition-colors ${
                    mode === 'login'
                      ? 'bg-slate-50 text-slate-900 border-slate-50'
                      : 'border-slate-600/70 text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setMode('register')}
                  className={`rounded-full px-3 py-1 border text-xs transition-colors ${
                    mode === 'register'
                      ? 'bg-indigo-500 text-white border-indigo-400 shadow shadow-indigo-500/40'
                      : 'border-slate-600/70 text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-10 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left: Hero + visuals */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Prototype • Instant trial workspaces</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight">
                Launch your clinical trial
                <span className="block text-indigo-300">with an AI co‑pilot in minutes.</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl">
                Create structured requirements, timelines, and dashboards for complex studies without the usual onboarding friction.
                Try it as a guest or sign up to keep your projects in one place.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-2.5 text-sm font-medium shadow-lg shadow-indigo-500/40 transition-transform hover:-translate-y-0.5"
                >
                  <span>New clinical project</span>
                  <span className="text-indigo-100 text-xs">No login required</span>
                </button>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Spin up a sandbox trial space. You can link it to an account later so nothing is lost.
                </p>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 max-w-md text-[11px] text-slate-300">
                <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-3 py-2">
                  <div className="text-slate-100 font-medium text-xs">AI brief</div>
                  <div>Create PRDs, FAQs, and risk logs from a short description.</div>
                </div>
                <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-3 py-2">
                  <div className="text-slate-100 font-medium text-xs">Smart dashboard</div>
                  <div>Turn chat output into visual widgets automatically.</div>
                </div>
                <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-3 py-2">
                  <div className="text-slate-100 font-medium text-xs">Team‑ready</div>
                  <div>Share projects with study leads and operations.</div>
                </div>
              </div>
            </div>

            {/* Right: Auth card */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-900/70 backdrop-blur-xl shadow-2xl shadow-slate-950/60 p-6 sm:p-7">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-slate-50 mb-1">
                    {mode === 'login' ? 'Log in to your workspace' : 'Create a ClinOps account'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {mode === 'login'
                      ? 'Access your saved clinical projects and dashboards.'
                      : 'Save projects, keep history, and collaborate with your team.'}
                  </p>
                </div>

                {!user ? (
                  <>
                    <AuthForm mode={mode} onSuccess={handleAuthSuccess} />
                    <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        {mode === 'login'
                          ? "Don't have an account?"
                          : 'Already have an account?'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                        className="text-indigo-300 hover:text-indigo-200 font-medium"
                      >
                        {mode === 'login' ? 'Sign up' : 'Log in'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-slate-200">
                    You are logged in as <span className="font-medium">{user.email}</span>. You can start by creating a new
                    project or open an existing one from the dashboard.
                  </div>
                )}
              </div>
            </div>
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
