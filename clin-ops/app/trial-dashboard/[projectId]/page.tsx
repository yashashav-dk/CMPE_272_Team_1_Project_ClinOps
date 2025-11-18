'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import WidgetRenderer from './components/WidgetRenderer'
import { HiRefresh, HiOutlineTrash } from 'react-icons/hi'
import LogoutButton from '@/app/components/LogoutButton'

interface DashboardWidget {
  id: string
  projectId: string
  userId: string
  tabType: string
  widgetType: string
  title: string
  content: any
  rawContent: string
  order: number
  createdAt: string
  updatedAt: string
}

interface DashboardData {
  widgets: DashboardWidget[]
  widgetsByTab: Record<string, DashboardWidget[]>
  totalWidgets: number
  tabCount: number
}

export default function TrialDashboard() {
  const params = useParams()
  const projectId = params?.projectId as string

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/dashboard/${projectId}`)
      const result = await response.json()

      if (result.success) {
        setDashboardData(result.data)
      } else {
        setError(result.error || 'Failed to load dashboard')
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err)
      setError('Failed to load dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchDashboard()
    }
  }, [projectId])

  const handleDeleteWidget = async (widgetId: string) => {
    if (!confirm('Are you sure you want to remove this widget from the dashboard?')) {
      return
    }

    try {
      const response = await fetch(`/api/dashboard/${projectId}?widgetId=${widgetId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        // Refresh dashboard
        fetchDashboard()
      } else {
        alert(`Failed to delete widget: ${result.error}`)
      }
    } catch (err) {
      console.error('Error deleting widget:', err)
      alert('Failed to delete widget')
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to remove ALL widgets from the dashboard? This cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/dashboard/${projectId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        // Refresh dashboard
        fetchDashboard()
      } else {
        alert(`Failed to clear dashboard: ${result.error}`)
      }
    } catch (err) {
      console.error('Error clearing dashboard:', err)
      alert('Failed to clear dashboard')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
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
            onClick={fetchDashboard}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Clinical Trial Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {dashboardData?.totalWidgets || 0} widgets across {dashboardData?.tabCount || 0} categories
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={fetchDashboard}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <HiRefresh className="w-4 h-4" />
                Refresh
              </button>

              {dashboardData && dashboardData.totalWidgets > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                  Clear All
                </button>
              )}

              <a
                href={`/${projectId}`}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg"
              >
                Back to Chat
              </a>

              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {!dashboardData || dashboardData.totalWidgets === 0 ? (
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No dashboard content yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start by sending content from the chat interface using the "Send to Dashboard" button.
            </p>
            <a
              href={`/${projectId}`}
              className="inline-block px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg"
            >
              Go to Chat
            </a>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(dashboardData.widgetsByTab).map(([tabType, widgets]) => (
              <div key={tabType}>
                {/* Section Header */}
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {tabType.replace(/([A-Z])/g, ' $1').trim()}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Widgets Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {widgets.map((widget) => (
                    <WidgetRenderer
                      key={widget.id}
                      widget={widget}
                      onDelete={handleDeleteWidget}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
