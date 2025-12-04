'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { HiPlus, HiChat, HiTrash, HiPencil, HiFolder, HiViewGrid, HiChevronLeft, HiChevronRight } from 'react-icons/hi'

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
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    if (currentUser) {
      fetchProjects()
    }
  }, [currentUser])

  const fetchProjects = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/projects', { credentials: 'include' })
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

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription
        })
      })

      const result = await response.json()
      if (result.success) {
        setProjects([...projects, result.data])
        setShowNewProjectModal(false)
        setNewProjectName('')
        setNewProjectDescription('')
        router.push(`/${result.data.id}`)
      }
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const result = await response.json()
      if (result.success) {
        setProjects(projects.filter(p => p.id !== projectId))
        if (currentProjectId === projectId) {
          router.push('/')
        }
      }
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  const handleRenameProject = async (projectId: string) => {
    if (!editProjectName.trim()) return

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: editProjectName })
      })

      const result = await response.json()
      if (result.success) {
        setProjects(projects.map(p =>
          p.id === projectId ? { ...p, name: editProjectName } : p
        ))
        setEditingProjectId(null)
        setEditProjectName('')
      }
    } catch (error) {
      console.error('Error renaming project:', error)
    }
  }

  // if (!currentUser) return null // Allow rendering for guests

  return (
    <>
      {/* Sidebar */}
      <div
        className={`bg-gray-900 text-gray-100 flex flex-col h-screen transition-all duration-300 ease-in-out relative border-r border-gray-700
          ${isCollapsed ? 'w-16' : 'w-64'}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h1 className={`text-lg font-bold transition-opacity duration-200 overflow-hidden ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
            ClinOps
          </h1>

          {/* Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0 ${isCollapsed ? 'mx-auto' : ''}`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <HiChevronRight className="w-5 h-5" />
            ) : (
              <HiChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* User email */}
        {!isCollapsed && (
          <div className="text-xs text-gray-400 px-4 pt-2 pb-3 border-b border-gray-700 truncate">
            {currentUser?.email || 'Guest User'}
          </div>
        )}

        {/* New Project Button */}
        <div className="p-3">
          <button
            onClick={() => setShowNewProjectModal(true)}
            className={`w-full flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-all
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? 'New Project' : ''}
          >
            <HiPlus className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>New Project</span>}
          </button>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {!isCollapsed && (
            <div className="text-xs font-semibold text-gray-400 px-3 py-2 uppercase tracking-wide">
              Your Projects
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-4 text-gray-400 text-sm">
              {!isCollapsed && 'Loading...'}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <HiFolder className="w-12 h-12 mx-auto mb-2 opacity-50" />
              {!isCollapsed && (
                <>
                  <p>No projects yet</p>
                  <p className="text-xs mt-1">Create your first project</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`group relative rounded-lg transition-colors ${currentProjectId === project.id
                      ? 'bg-gray-800'
                      : 'hover:bg-gray-800'
                    }`}
                >
                  {editingProjectId === project.id && !isCollapsed ? (
                    // Rename Input
                    <div className="px-3 py-2">
                      <input
                        type="text"
                        value={editProjectName}
                        onChange={(e) => setEditProjectName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameProject(project.id)
                          if (e.key === 'Escape') {
                            setEditingProjectId(null)
                            setEditProjectName('')
                          }
                        }}
                        onBlur={() => handleRenameProject(project.id)}
                        className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <>
                      {/* Main Project Button */}
                      <button
                        onClick={() => router.push(`/${project.id}`)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm
                          ${isCollapsed ? 'justify-center' : ''}
                        `}
                        title={isCollapsed ? project.name : ''}
                      >
                        <HiChat className="w-5 h-5 flex-shrink-0" />
                        {!isCollapsed && <span className="truncate flex-1">{project.name}</span>}
                      </button>

                      {/* Action Buttons (visible on hover when expanded) */}
                      {!isCollapsed && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 rounded-md p-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/trial-dashboard/${project.id}`)
                            }}
                            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                            title="View Dashboard"
                          >
                            <HiViewGrid className="w-4 h-4 text-blue-400" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingProjectId(project.id)
                              setEditProjectName(project.name)
                            }}
                            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                            title="Rename Project"
                          >
                            <HiPencil className="w-4 h-4 text-yellow-400" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteProject(project.id)
                            }}
                            className="p-1.5 hover:bg-red-600 rounded transition-colors"
                            title="Delete Project"
                          >
                            <HiTrash className="w-4 h-4 text-red-400 hover:text-white" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-3 border-t border-gray-700 text-xs text-gray-400">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-4">Create New Project</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter project name"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewProjectModal(false)
                  setNewProjectName('')
                  setNewProjectDescription('')
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newProjectName.trim() || isCreating}
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}