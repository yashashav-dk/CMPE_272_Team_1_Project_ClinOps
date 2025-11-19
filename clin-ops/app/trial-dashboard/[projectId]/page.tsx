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

interface DashboardReview {
  id: string
  projectId: string
  authorId: string
  text: string
  rating: number | null
  createdAt: string
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

  const [reviews, setReviews] = useState<DashboardReview[]>([])
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [isLoadingReviews, setIsLoadingReviews] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState<number | null>(null)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

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

  const fetchReviews = async () => {
    if (!projectId) return
    setIsLoadingReviews(true)
    try {
      const response = await fetch(`/api/dashboard/${projectId}/reviews`)
      const result = await response.json()
      if (result.success) {
        setReviews(result.data.reviews)
        setAverageRating(result.data.averageRating)
      }
    } catch (err) {
      console.error('Error fetching dashboard reviews:', err)
    } finally {
      setIsLoadingReviews(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchDashboard()
      fetchReviews()
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

  const handleSubmitReview = async () => {
    if (!reviewText.trim()) return
    try {
      setIsSubmittingReview(true)
      const response = await fetch(`/api/dashboard/${projectId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          authorId: 'default-user',
          text: reviewText.trim(),
          rating: reviewRating
        })
      })

      const result = await response.json()
      if (result.success) {
        setReviewText('')
        setReviewRating(null)
        fetchReviews()
      } else {
        alert(result.error || 'Failed to submit review')
      }
    } catch (err) {
      console.error('Error submitting dashboard review:', err)
      alert('Failed to submit review')
    } finally {
      setIsSubmittingReview(false)
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

  const totalWidgets = dashboardData?.totalWidgets || 0
  const tabCount = dashboardData?.tabCount || 0
  const mostPopulatedTab = dashboardData?.widgetsByTab
    ? Object.entries(dashboardData.widgetsByTab).reduce(
        (top, [tab, widgets]) => {
          if (!top) return { tab, count: widgets.length }
          return widgets.length > top.count ? { tab, count: widgets.length } : top
        },
        null as { tab: string; count: number } | null
      )
    : null

  const sortedReviews = [...reviews].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                Clinical Trial Dashboard
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {totalWidgets} widgets across {tabCount} categories
              </p>
            </div>

            <div className="flex gap-2 items-center">
              <button
                onClick={fetchDashboard}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
              >
                <HiRefresh className="w-4 h-4" />
                Refresh
              </button>

              {dashboardData && dashboardData.totalWidgets > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/60 shadow-sm"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                  Clear All
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsFeedbackOpen(true)}
                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-100 rounded-lg flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs shadow-sm"
              >
                <HiOutlineThumbUp className="w-4 h-4" />
                <HiOutlineThumbDown className="w-4 h-4" />
                <span>Feedback</span>
              </button>

              <a
                href={`/${projectId}`}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
              >
                Back to Chat
              </a>
            </div>
          </div>

          {/* Summary strip */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-indigo-500/20 dark:bg-indigo-500/40 rounded-lg px-4 py-3 border border-indigo-500 dark:border-indigo-700 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Total widgets</div>
              <div className="mt-1 text-2xl font-semibold text-indigo-900 dark:text-indigo-100">{totalWidgets}</div>
            </div>
            <div className="bg-emerald-500/20 dark:bg-emerald-500/40 rounded-lg px-4 py-3 border border-emerald-500 dark:border-emerald-700 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Categories</div>
              <div className="mt-1 text-2xl font-semibold text-emerald-900 dark:text-emerald-100">{tabCount}</div>
            </div>
            <div className="bg-amber-500/20 dark:bg-amber-500/40 rounded-lg px-4 py-3 border border-amber-500 dark:border-amber-700 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">Most populated category</div>
              <div className="mt-1 text-sm font-semibold text-amber-900 dark:text-amber-50 truncate">
                {mostPopulatedTab
                  ? `${mostPopulatedTab.tab
                      .replace(/([A-Z])/g, ' $1')
                      .trim()
                      .replace(/^[a-zA-Z]/, (c) => c.toUpperCase())} (${mostPopulatedTab.count})`
                  : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {!dashboardData || dashboardData.totalWidgets === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-700 shadow-sm">
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
            <p className="text-slate-600 dark:text-slate-300 mb-4">
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
            {Object.entries(dashboardData.widgetsByTab).map(([tabType, widgets]) => {
              const lastUpdated = widgets.reduce((latest, w) => {
                const t = new Date(w.updatedAt).getTime()
                return t > latest ? t : latest
              }, 0)

              const formattedTabLabel = tabType
                .replace(/([A-Z])/g, ' $1')
                .trim()
                .replace(/^[a-zA-Z]/, (c) => c.toUpperCase())

              return (
                <div key={tabType} className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950/60 shadow-md">
                  {/* Section Header */}
                  <div className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-indigo-600/10 dark:bg-indigo-500/20 px-3 py-1 mb-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-300" />
                        <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-200">
                          {formattedTabLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {lastUpdated > 0 && (
                      <div className="text-right text-[11px] text-slate-500 dark:text-slate-400">
                        <div>Last updated</div>
                        <div className="font-medium">
                          {new Date(lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Widgets Grid */}
                  <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {widgets.map((widget) => (
                      <WidgetRenderer
                        key={widget.id}
                        widget={widget}
                        onDelete={handleDeleteWidget}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Reviews Section */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Dashboard Reviews</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Share and view overall reviews for this project dashboard.
              </p>
            </div>
            <div className="flex items-center gap-4">
              {averageRating != null && (
                <div className="text-right">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Average Rating</div>
                  <div className="flex items-center gap-2">
                    <div className="flex text-yellow-400 text-base drop-shadow-[0_0_6px_rgba(250,204,21,0.55)]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>{i + 1 <= Math.round(averageRating) ? '★' : '☆'}</span>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {averageRating.toFixed(1)} / 5
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Reviews list */}
            <div className="lg:col-span-2 space-y-3 max-h-64 overflow-y-auto pr-1">
              {isLoadingReviews ? (
                <p className="text-sm text-slate-500 dark:text-slate-300">Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  No reviews yet. Be the first to add one below.
                </p>
              ) : (
                sortedReviews.map((review) => (
                  <div
                    key={review.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm bg-slate-50 dark:bg-slate-900/60"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-500 dark:text-slate-300">
                        {new Date(review.createdAt).toLocaleString()}
                      </span>
                      {review.rating != null && (
                        <span className="text-xs font-medium text-yellow-500">
                          {review.rating}/5
                        </span>
                      )}
                    </div>
                    <p className="text-slate-800 dark:text-slate-100 whitespace-pre-line">{review.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add review form */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50">Add a Review</h3>
              <textarea
                className="w-full h-24 text-xs border border-slate-300 dark:border-slate-600 rounded-lg p-2 mb-1 dark:bg-slate-900 dark:text-slate-50"
                placeholder="Write an overall review for this dashboard..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                disabled={isSubmittingReview}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-200">
                  <span>Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`px-1 ${
                        reviewRating === star
                          ? 'text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.55)]'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                      onClick={() => setReviewRating(reviewRating === star ? null : star)}
                      disabled={isSubmittingReview}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className={`px-3 py-1 rounded text-white text-xs shadow-sm ${
                    reviewText.trim() && !isSubmittingReview
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-slate-400 cursor-not-allowed'
                  }`}
                  onClick={handleSubmitReview}
                  disabled={!reviewText.trim() || isSubmittingReview}
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
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
