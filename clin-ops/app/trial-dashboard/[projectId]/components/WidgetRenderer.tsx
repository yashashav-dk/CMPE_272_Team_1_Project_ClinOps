'use client'

import React from 'react'
import MermaidDiagram from '@/app/MermaidDiagram'
import ReactMarkdown from 'react-markdown'

interface WidgetProps {
  widget: {
    id: string
    widgetType: string
    title: string
    content: any
    rawContent: string
    tabType: string
    projectId: string
  }
  onDelete?: (id: string) => void
}

export default function WidgetRenderer({ widget, onDelete }: WidgetProps) {
  const renderContent = () => {
    switch (widget.widgetType) {
      case 'diagram':
        return (
          <div className="w-full">
            <MermaidDiagram
              chart={widget.content.diagramCode}
              projectId={widget.projectId}
              contextInfo={widget.tabType}
            />
          </div>
        )

      case 'kpi':
        const percentage = widget.content.target
          ? Math.round((widget.content.value / widget.content.target) * 100)
          : null

        return (
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                {widget.title}
              </h4>
              {widget.content.status && (
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    widget.content.status === 'on-track'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}
                >
                  {widget.content.status}
                </span>
              )}
            </div>
            <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {widget.content.value}
              {widget.content.unit === '%' && '%'}
              {widget.content.target && (
                <span className="text-lg text-gray-500 dark:text-gray-400 ml-2">
                  / {widget.content.target}
                </span>
              )}
            </div>
            {percentage !== null && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    percentage >= 100
                      ? 'bg-green-500'
                      : percentage >= 70
                      ? 'bg-blue-500'
                      : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
            )}
          </div>
        )

      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {widget.content.headers.map((header: string, idx: number) => (
                    <th
                      key={idx}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {widget.content.data.map((row: any, rowIdx: number) => (
                  <tr key={rowIdx}>
                    {widget.content.headers.map((header: string, cellIdx: number) => (
                      <td
                        key={cellIdx}
                        className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300"
                      >
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      case 'timeline':
        return (
          <div className="space-y-4">
            {widget.content.milestones.map((milestone: any, idx: number) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-24 text-sm font-medium text-gray-600 dark:text-gray-400">
                  {milestone.date}
                </div>
                <div className="flex-1">
                  <div className="relative pl-4 border-l-2 border-indigo-200 dark:border-indigo-800 pb-4">
                    <div className="absolute left-0 top-0 w-3 h-3 bg-indigo-500 rounded-full -translate-x-[7px]"></div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {milestone.event}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )

      case 'list':
        return (
          <ul className="space-y-2">
            {widget.content.items.map((item: string, idx: number) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <span className="text-indigo-500 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )

      case 'text':
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{widget.content.markdown}</ReactMarkdown>
          </div>
        )

      default:
        return (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Unknown widget type: {widget.widgetType}
          </div>
        )
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Widget Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {widget.widgetType !== 'kpi' && (
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1 capitalize">
              {widget.title}
            </h3>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {widget.widgetType}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {widget.tabType.replace(/([A-Z])/g, ' $1').trim()}
            </span>
          </div>
        </div>

        {onDelete && (
          <button
            onClick={() => onDelete(widget.id)}
            className="ml-2 p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            title="Remove from dashboard"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Widget Content */}
      {renderContent()}
    </div>
  )
}
