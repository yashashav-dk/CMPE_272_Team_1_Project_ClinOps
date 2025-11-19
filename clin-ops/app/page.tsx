'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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
        className="border border-gray-600 bg-gray-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border border-gray-600 bg-gray-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        required
        minLength={8}
      />
      {mode === 'register' && (
        <input
          type="text"
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-gray-600 bg-gray-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      )}
      {error && (
        <div className="text-red-400 text-sm">{error}</div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="bg-indigo-600 text-white rounded px-4 py-2 disabled:opacity-50 hover:bg-indigo-700 transition-colors"
      >
        {loading ? 'Please wait…' : mode === 'register' ? 'Sign up' : 'Log in'}
      </button>
    </form>
  )
}

// Component that uses useSearchParams - must be wrapped in Suspense
function AuthModeDetector({ setMode }: { setMode: (mode: 'login' | 'register') => void }) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const authMode = searchParams.get('auth')
    if (authMode === 'login' || authMode === 'register') {
      setMode(authMode)
    }
  }, [searchParams, setMode])

  return null
}

function HomeContent() {
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
            
            // Import any guest projects from localStorage first
            if (typeof window !== 'undefined') {
              const keys = Object.keys(window.localStorage)
              const projectMetaKeys = keys.filter(key => key.startsWith('project:') && key.endsWith(':meta'))
              
              for (const key of projectMetaKeys) {
                const projectId = key.replace('project:', '').replace(':meta', '')
                const metaStr = window.localStorage.getItem(key)
                
                if (metaStr) {
                  try {
                    const meta = JSON.parse(metaStr)
                    await fetch('/api/projects/ensure', {
                      method: 'POST',
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        projectId,
                        name: meta.name || 'Untitled Project',
                        description: meta.description || null
                      })
                    }).catch(err => console.error('Failed to import project:', projectId, err))
                  } catch (err) {
                    console.error('Failed to parse project meta:', key, err)
                  }
                }
              }
            }
            
            // Now fetch projects and redirect to first one
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
    // Import any guest projects from localStorage and check if user has projects
    ;(async () => {
      try {
        // First, import any guest projects from localStorage
        if (typeof window !== 'undefined') {
          const keys = Object.keys(window.localStorage)
          const projectMetaKeys = keys.filter(key => key.startsWith('project:') && key.endsWith(':meta'))
          
          for (const key of projectMetaKeys) {
            const projectId = key.replace('project:', '').replace(':meta', '')
            const metaStr = window.localStorage.getItem(key)
            
            if (metaStr) {
              try {
                const meta = JSON.parse(metaStr)
                // Try to ensure this project exists in the database
                await fetch('/api/projects/ensure', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    projectId,
                    name: meta.name || 'Untitled Project',
                    description: meta.description || null
                  })
                }).catch(err => console.error('Failed to import project:', projectId, err))
              } catch (err) {
                console.error('Failed to parse project meta:', key, err)
              }
            }
          }
        }
        
        // Then check if user has projects and show create project modal if not
        const projectsRes = await fetch('/api/projects', { credentials: 'include' })
        if (projectsRes.ok) {
          const result = await projectsRes.json()
          if (!result.success || result.data.length === 0) {
            // No projects, show create project modal
            setShowProjectModal(true)
          } else {
            // User has projects, redirect to the first one
            router.push(`/${result.data[0].id}`)
          }
        }
      } catch (error) {
        console.error('Failed to check projects after login:', error)
      }
    })()
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <header className="w-full bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">ClinOps</span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm font-medium text-gray-300">{user.email}</span>
                <button 
                  onClick={logout} 
                  className="text-sm font-medium text-gray-400 hover:text-indigo-400 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setShowProjectModal(true)}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-all"
                >
                  Create Project
                </button>
                <div className="h-6 w-px bg-gray-700"></div>
                <button 
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    setTimeout(() => {
                      const authSection = document.getElementById('auth');
                      if (authSection) {
                        authSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                  className="px-4 py-2 text-sm font-medium text-indigo-400 hover:text-white transition-colors"
                >
                  {mode === 'login' ? 'Sign up' : 'Log in'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight">
              Streamline Your Clinical Trials
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                with AI-Powered Efficiency
              </span>
            </h1>
            <p className="mt-6 text-xl text-gray-300 max-w-3xl mx-auto">
              From protocol design to regulatory submission, manage every aspect of your clinical trials with intelligent automation, real-time insights, and built-in compliance.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => setShowProjectModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl text-lg shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create Your First Project - No Login Required</span>
              </button>
              <button 
                className="px-8 py-4 bg-gray-800 text-white font-medium rounded-xl text-lg border-2 border-gray-700 hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                onClick={() => {
                  const element = document.getElementById('features');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
                <span>Explore Features</span>
              </button>
            </div>
            
          </div>

          {/* Key Features */}
          <div id="features" className="mt-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Comprehensive Trial Management</h2>
              <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
                Everything you need to run compliant, efficient clinical trials from start to finish
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  ),
                  title: 'Smart Trial Management',
                  description: 'Centralized dashboard with automated task tracking, customizable checklists, and real-time progress monitoring for all trial activities.'
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                  title: 'Regulatory Compliance Suite',
                  description: 'Automated compliance checking, document version control with audit trails, and pre-built templates for regulatory submissions.'
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ),
                  title: 'Collaboration Tools',
                  description: 'Role-based access control, secure document sharing with e-signatures, team communication channels, and comprehensive audit logs.'
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  title: 'AI-Powered Insights',
                  description: 'Predictive analytics for risk assessment, automated report generation, compliance gap analysis, and smart deadline alerts.'
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                  title: 'Documentation & Reporting',
                  description: 'Centralized document repository, automated report generation, customizable dashboards, and export options for submissions.'
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ),
                  title: 'Enterprise Security',
                  description: 'SOC 2 Type II certified, end-to-end encryption, HIPAA compliant infrastructure, and granular access controls.'
                }
              ].map((feature, index) => (
                <div key={index} className="bg-gray-800/50 p-6 rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-700/50 hover:border-indigo-500/30 group">
                  <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 w-14 h-14 rounded-lg flex items-center justify-center mb-4 text-indigo-400 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Personas Section */}
          <div className="mt-32">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Built for Your Role</h2>
              <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
                Tailored workflows for every member of your clinical trial team
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Trial Coordinators */}
              <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-2xl p-8 border border-indigo-500/30">
                <div className="flex items-center mb-6">
                  <div className="bg-indigo-600 rounded-lg p-3">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-white">Trial Coordinators</h3>
                    <p className="text-indigo-300 text-sm">Streamline daily operations</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[
                    'Manage trial overviews and comprehensive documentation',
                    'Track task checklists and team workflows efficiently',
                    'Monitor trial timelines and quality metrics in real-time',
                    'Ensure protocol compliance with automated checks',
                    'Manage site and patient data securely'
                  ].map((item, i) => (
                    <div key={i} className="flex items-start">
                      <svg className="w-5 h-5 text-indigo-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-200 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regulatory Advisors */}
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-2xl p-8 border border-purple-500/30">
                <div className="flex items-center mb-6">
                  <div className="bg-purple-600 rounded-lg p-3">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-white">Regulatory Advisors</h3>
                    <p className="text-purple-300 text-sm">Ensure compliance excellence</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[
                    'Ensure compliance with FDA, EMA, and global regulations',
                    'Manage document control and version tracking',
                    'Create compliance diagrams and workflow visualizations',
                    'Assess and mitigate regulatory risks proactively',
                    'Prepare for audits and inspections with confidence'
                  ].map((item, i) => (
                    <div key={i} className="flex items-start">
                      <svg className="w-5 h-5 text-purple-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-200 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mt-32">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Trusted by Clinical Professionals</h2>
              <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
                See how ClinOps is transforming clinical trial management worldwide
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  name: 'Dr. Sarah Chen',
                  role: 'Principal Investigator',
                  company: 'Memorial Research Institute',
                  quote: 'ClinOps has transformed how we manage multi-site trials. The real-time dashboards and automated compliance checks have saved us countless hours.',
                  image: '👩‍⚕️'
                },
                {
                  name: 'Marcus Thompson',
                  role: 'Clinical Research Coordinator',
                  company: 'BioPharma Solutions',
                  quote: 'The task management features are incredible. I can track all sites, monitor progress, and ensure protocol adherence from a single interface.',
                  image: '👨‍💼'
                },
                {
                  name: 'Dr. Emily Rodriguez',
                  role: 'Regulatory Affairs Specialist',
                  company: 'Global Clinical Trials Corp',
                  quote: 'The automated compliance checking and version control have been game-changers for our regulatory submissions. We passed our last audit with flying colors.',
                  image: '👩‍💼'
                },
                {
                  name: 'James Liu',
                  role: 'Clinical Operations Manager',
                  company: 'Innovate Therapeutics',
                  quote: 'ClinOps streamlined our entire workflow. The AI-powered insights help us identify risks early and make data-driven decisions faster.',
                  image: '👨‍⚕️'
                }
              ].map((testimonial, i) => (
                <div key={i} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center mb-4">
                    <div className="text-4xl mr-3">{testimonial.image}</div>
                    <div>
                      <div className="font-semibold text-white text-sm">{testimonial.name}</div>
                      <div className="text-indigo-400 text-xs">{testimonial.role}</div>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm italic leading-relaxed">"{testimonial.quote}"</p>
                  <div className="mt-3 text-xs text-gray-500">{testimonial.company}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Call to Action Section 
          <div className="mt-32 bg-gradient-to-br from-indigo-900/60 to-purple-900/60 rounded-3xl p-12 border border-indigo-500/30 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>
            
            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Clinical Trials?
              </h2>
              <p className="text-lg text-gray-200 mb-8">
                Join hundreds of research organizations using ClinOps to run faster, safer, and more compliant clinical trials.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="px-8 py-4 bg-white text-indigo-900 font-semibold rounded-xl text-lg shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-200"
                >
                  Start Your Free Trial
                </button>
                <button 
                  className="px-8 py-4 bg-transparent text-white font-medium rounded-xl text-lg border-2 border-white/30 hover:bg-white/10 transition-colors"
                  onClick={() => {
                    const element = document.getElementById('contact');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Schedule a Demo
                </button>
              </div>
              
              <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-300">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-indigo-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  No credit card required
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-indigo-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Free for 30 days
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-indigo-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Cancel anytime
                </div>
              </div>
            </div>
          </div>
*/}
          {/* Authentication Section */}
          {!user && (
            <div id="auth" className="mt-24 max-w-md mx-auto bg-gray-800/50 rounded-2xl shadow-xl overflow-hidden border border-gray-700/50">
              <div className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {mode === 'login' ? 'Welcome back' : 'Create your account'}
                  </h2>
                  <p className="text-gray-400">
                    {mode === 'login' 
                      ? 'Sign in to access your projects' 
                      : 'Create an account to save your work'}
                  </p>
                </div>
                
                <AuthForm mode={mode} onSuccess={handleAuthSuccess} />
                
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="text-indigo-400 hover:text-white text-sm font-medium"
                  >
                    {mode === 'login' 
                      ? "Don't have an account? Sign up" 
                      : 'Already have an account? Sign in'}
                  </button>
                </div>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-800/50 text-gray-400">Or get started with</span>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Project Without Account
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900/80 border-t border-gray-800 mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Guides</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-indigo-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Partners</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Compliance</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 sm:mb-0">
              <svg className="h-6 w-6 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className="text-gray-400 text-sm">© 2025 ClinOps. All rights reserved.</span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* New Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-7 max-w-md w-full mx-4 border border-indigo-500 shadow-2xl">
            <h3 className="text-lg font-semibold mb-5 text-white">
              Create New Project
            </h3>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g., LUMA-201 Phase III Trial"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-gray-500"
                  autoFocus
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Brief description of your clinical trial project"
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-gray-500"
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
                  className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newProjectName.trim()}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
                >
                  {isCreating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Auth mode detector wrapped in Suspense */}
      <Suspense fallback={null}>
        <AuthModeDetector setMode={setMode} />
      </Suspense>
    </div>
  )
}

// Default export with Suspense boundary
export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
