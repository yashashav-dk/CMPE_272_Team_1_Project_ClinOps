'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { HiPlus, HiChat, HiTrash, HiPencil, HiFolder, HiViewGrid } from 'react-icons/hi'

interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

interface SidebarProps {
  currentUser?: {
    id: string
    email: string
    name?: string
  }
}

export default function Sidebar({ currentUser }: SidebarProps) {
  const router = useRouter()
  const params = useParams()
  const currentProjectId = params?.projectId as string

  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editProjectName, setEditProjectName] = useState('')

  useEffect(() => {
    if (currentUser) {
      fetchProjects()
    }
  }, [currentUser])

  const fetchProjects = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/projects', {
        credentials: 'include'
      })
      const result = await response.json()

      if (result.success) {
        setProjects(result.data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newProjectName.trim()) {
      alert('Please enter a project name')
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription || undefined
        })
      })

      const result = await response.json()

      if (result.success) {
        setProjects(prev => [result.data, ...prev])
        setShowNewProjectModal(false)
        setNewProjectName('')
        setNewProjectDescription('')

        // Navigate to new project
        router.push(`/${result.data.id}`)
      } else {
        alert(`Failed to create project: ${result.error}`)
      }
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const result = await response.json()

      if (result.success) {
        setProjects(prev => prev.filter(p => p.id !== projectId))

        // If we deleted the current project, navigate to first available project
        if (projectId === currentProjectId) {
          const remainingProjects = projects.filter(p => p.id !== projectId)
          if (remainingProjects.length > 0) {
            router.push(`/${remainingProjects[0].id}`)
          } else {
            router.push('/')
          }
        }
      } else {
        alert(`Failed to delete project: ${result.error}`)
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project')
    }
  }

  const handleRenameProject = async (projectId: string) => {
    if (!editProjectName.trim()) {
      setEditingProjectId(null)
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: editProjectName
        })
      })

      const result = await response.json()

      if (result.success) {
        setProjects(prev => prev.map(p =>
          p.id === projectId ? { ...p, name: editProjectName } : p
        ))
        setEditingProjectId(null)
        setEditProjectName('')
      } else {
        alert(`Failed to rename project: ${result.error}`)
      }
    } catch (error) {
      console.error('Error renaming project:', error)
      alert('Failed to rename project')
    }
  }

  if (!currentUser) {
    return null
  }

  return (
    <>
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-gray-100 flex flex-col h-screen">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-lg font-bold">ClinOps</h1>
          <p className="text-xs text-gray-400 mt-1">{currentUser.email}</p>
        </div>

        {/* New Project Button */}
        <div className="p-3">
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
          >
            <HiPlus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="text-xs font-semibold text-gray-400 px-3 py-2">
            Your Projects
          </div>

          {isLoading ? (
            <div className="text-center py-4 text-gray-400 text-sm">
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <HiFolder className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No projects yet</p>
              <p className="text-xs mt-1">Create your first project to get started</p>
            </div>
          ) : (
            <div className="space-y-1">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`group relative rounded-lg transition-colors ${
                    currentProjectId === project.id
                      ? 'bg-gray-800'
                      : 'hover:bg-gray-800'
                  }`}
                >
                  {editingProjectId === project.id ? (
                    <div className="p-2">
                      <input
                        type="text"
                        value={editProjectName}
                        onChange={(e) => setEditProjectName(e.target.value)}
                        onBlur={() => handleRenameProject(project.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameProject(project.id)
                          if (e.key === 'Escape') {
                            setEditingProjectId(null)
                            setEditProjectName('')
                          }
                        }}
                        className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-indigo-500"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => router.push(`/${project.id}`)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm"
                      >
                        <HiChat className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 truncate">{project.name}</span>
                      </button>

                      {/* Action buttons */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => router.push(`/trial-dashboard/${project.id}`)}
                          className="p-1 hover:bg-gray-700 rounded"
                          title="View Dashboard"
                        >
                          <HiViewGrid className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingProjectId(project.id)
                            setEditProjectName(project.name)
                          }}
                          className="p-1 hover:bg-gray-700 rounded"
                          title="Rename"
                        >
                          <HiPencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteProject(project.id)
                          }}
                          className="p-1 hover:bg-red-600 rounded"
                          title="Delete"
                        >
                          <HiTrash className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Section */}
        <div className="p-3 border-t border-gray-700">
          <div className="text-xs text-gray-400">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Create New Project
            </h3>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g., LUMA-201 Phase III Trial"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Brief description of your clinical trial project"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewProjectModal(false)
                    setNewProjectName('')
                    setNewProjectDescription('')
                  }}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newProjectName.trim()}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <HiPlus className="w-4 h-4" />
                      Create Project
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
