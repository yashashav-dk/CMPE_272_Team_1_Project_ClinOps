'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import MermaidDiagram from '@/app/MermaidDiagram'
import { HiOutlineTrash, HiRefresh } from 'react-icons/hi'

interface SavedDiagram {
  id: string
  projectId: string
  userId: string
  title: string
  description: string | null
  diagramCode: string
  diagramType: string | null
  context: any
  createdAt: string
  updatedAt: string
}

export default function Dashboard() {
  const params = useParams()
  const projectId = params?.projectId as string

  const [diagrams, setDiagrams] = useState<SavedDiagram[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDiagrams = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/diagrams/${projectId}`)
      const result = await response.json()

      if (result.success) {
        setDiagrams(result.data)
      } else {
        setError(result.error || 'Failed to load diagrams')
      }
    } catch (err) {
      console.error('Error fetching diagrams:', err)
      setError('Failed to load diagrams')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchDiagrams()
    }
  }, [projectId])

  const handleDelete = async (diagramId: string) => {
    if (!confirm('Are you sure you want to delete this diagram?')) {
      return
    }

    try {
      const response = await fetch(`/api/diagrams/${projectId}?diagramId=${diagramId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        // Remove from local state
        setDiagrams(diagrams.filter(d => d.id !== diagramId))
      } else {
        alert(`Failed to delete diagram: ${result.error}`)
      }
    } catch (err) {
      console.error('Error deleting diagram:', err)
      alert('Failed to delete diagram')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading diagrams...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchDiagrams}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Diagram Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View and manage all saved diagrams for this project
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={fetchDiagrams}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <HiRefresh className="w-4 h-4" />
                Refresh
              </button>

              <a
                href={`/${projectId}`}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg"
              >
                Back to Chat
              </a>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Total Diagrams
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {diagrams.length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Diagram Types
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {new Set(diagrams.map(d => d.diagramType).filter(Boolean)).size}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Last Updated
            </h3>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {diagrams.length > 0
                ? new Date(diagrams[0].updatedAt).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Diagrams Grid */}
        {diagrams.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No diagrams saved yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start saving diagrams from the chat interface to see them here.
            </p>
            <a
              href={`/${projectId}`}
              className="inline-block px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg"
            >
              Go to Chat
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {diagrams.map((diagram) => (
              <div
                key={diagram.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
              >
                {/* Diagram Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {diagram.title}
                    </h3>
                    {diagram.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {diagram.description}
                      </p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      {diagram.diagramType && (
                        <span className="inline-block px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded">
                          {diagram.diagramType}
                        </span>
                      )}
                      {diagram.context?.info && (
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                          {diagram.context.info}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(diagram.id)}
                    className="ml-2 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    title="Delete diagram"
                  >
                    <HiOutlineTrash className="w-5 h-5" />
                  </button>
                </div>

                {/* Diagram */}
                <div className="mb-3">
                  <MermaidDiagram
                    chart={diagram.diagramCode}
                    projectId={projectId}
                    contextInfo={diagram.context?.info}
                  />
                </div>

                {/* Metadata */}
                <div className="text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between">
                    <span>Created: {new Date(diagram.createdAt).toLocaleString()}</span>
                    <span>Updated: {new Date(diagram.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
