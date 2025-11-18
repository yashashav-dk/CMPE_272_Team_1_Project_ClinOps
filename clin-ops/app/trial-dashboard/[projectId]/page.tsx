'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import WidgetRenderer from './components/WidgetRenderer'
import { HiRefresh, HiOutlineTrash, HiOutlineThumbUp, HiOutlineThumbDown } from 'react-icons/hi'

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
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackRating, setFeedbackRating] = useState<'up' | 'down' | null>(null)
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

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

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) return
    try {
      setIsSubmittingFeedback(true)
      setFeedbackSubmitted(false)
      const prefix = feedbackRating === 'up'
        ? '[Thumbs Up] '
        : feedbackRating === 'down'
          ? '[Thumbs Down] '
          : ''
      const messageToSend = `${prefix}${feedbackMessage.trim()}`

      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          persona: 'dashboard',
          tabType: 'dashboard',
          projectId,
          userId: 'default-user',
        }),
      })

      setFeedbackSubmitted(true)
      setFeedbackMessage('')
      setTimeout(() => {
        setIsFeedbackOpen(false)
        setFeedbackSubmitted(false)
        setFeedbackRating(null)
      }, 1200)
    } catch (err) {
      console.error('Error submitting dashboard feedback:', err)
    } finally {
      setIsSubmittingFeedback(false)
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

            <div className="flex gap-2 items-center">
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

              <button
                type="button"
                onClick={() => setIsFeedbackOpen(true)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs"
              >
                <HiOutlineThumbUp className="w-4 h-4" />
                <HiOutlineThumbDown className="w-4 h-4" />
                <span>Feedback</span>
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
                    {tabType
                      .replace(/([A-Z])/g, ' $1')
                      .trim()
                      .replace(/^[a-zA-Z]/, (c) => c.toUpperCase())}
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

      {isFeedbackOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-20">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 w-full max-w-sm text-xs">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">Dashboard Feedback</h3>
              <button
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setIsFeedbackOpen(false)}
                disabled={isSubmittingFeedback}
              >
                ✕
              </button>
            </div>
            <p className="mb-2 text-gray-600 dark:text-gray-300">
              Help us improve the Clinical Trial Dashboard for project <span className="font-semibold">{projectId}</span>.
            </p>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-gray-600 dark:text-gray-300">Rate this dashboard:</span>
              <button
                type="button"
                className={`p-1 rounded-full border text-base flex items-center justify-center ${feedbackRating === 'up' ? 'bg-green-100 border-green-500 text-green-600 dark:bg-green-900/30 dark:border-green-400' : 'border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-300'}`}
                onClick={() => setFeedbackRating(feedbackRating === 'up' ? null : 'up')}
                disabled={isSubmittingFeedback}
              >
                <HiOutlineThumbUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`p-1 rounded-full border text-base flex items-center justify-center ${feedbackRating === 'down' ? 'bg-red-100 border-red-500 text-red-600 dark:bg-red-900/30 dark:border-red-400' : 'border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-300'}`}
                onClick={() => setFeedbackRating(feedbackRating === 'down' ? null : 'down')}
                disabled={isSubmittingFeedback}
              >
                <HiOutlineThumbDown className="h-4 w-4" />
              </button>
            </div>
            <textarea
              className="w-full h-24 text-xs border border-gray-300 dark:border-gray-600 rounded p-2 mb-2 dark:bg-gray-800 dark:text-white"
              placeholder="What do you like or dislike about this dashboard?"
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              disabled={isSubmittingFeedback}
            />
            {feedbackSubmitted && (
              <div className="mb-2 text-green-600 dark:text-green-400">
                Thank you for your feedback!
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setIsFeedbackOpen(false)}
                disabled={isSubmittingFeedback}
              >
                Cancel
              </button>
              <button
                className={`px-3 py-1 rounded text-white ${feedbackMessage.trim() && !isSubmittingFeedback ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-gray-400 cursor-not-allowed'}`}
                onClick={handleSubmitFeedback}
                disabled={!feedbackMessage.trim() || isSubmittingFeedback}
              >
                {isSubmittingFeedback ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
