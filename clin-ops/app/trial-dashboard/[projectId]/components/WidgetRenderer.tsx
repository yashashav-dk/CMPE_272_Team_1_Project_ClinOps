'use client'

import React from 'react'
import MermaidDiagram from '@/app/MermaidDiagram'
import ReactMarkdown from 'react-markdown'
import InteractiveTimeline from './InteractiveTimeline'
import InteractiveWorkflow from './InteractiveWorkflow'
import InteractiveChecklist from './InteractiveChecklist'
import InteractiveTable from './InteractiveTable'
import EnhancedInteractiveChecklist from './EnhancedInteractiveChecklist'
import EnhancedMermaidViewer from './EnhancedMermaidViewer'
import ChartWidget from './ChartWidget'
import EnhancedKPICard from './EnhancedKPICard'
import AdvancedTable from './AdvancedTable'

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
            <EnhancedMermaidViewer
              chart={widget.content.diagramCode}
              projectId={widget.projectId}
              contextInfo={widget.tabType}
              title={widget.title}
            />
          </div>
        )

      case 'kpi':
        return (
          <EnhancedKPICard
            kpi={widget.content}
            title={widget.title}
          />
        )

      case 'table':
        return (
          <AdvancedTable
            data={widget.content.data || widget.content.rows || []}
            headers={widget.content.headers}
            widgetId={widget.id}
            projectId={widget.projectId}
            title={widget.title}
            enableSearch={true}
            enablePagination={true}
            enableExport={true}
            enableColumnVisibility={true}
          />
        )

      case 'timeline':
        return (
          <InteractiveTimeline milestones={widget.content.milestones} />
        )

      case 'workflow':
        return (
          <InteractiveWorkflow steps={widget.content.steps} />
        )

      case 'list':
        return (
          <EnhancedInteractiveChecklist 
            items={widget.content.items} 
            listType={widget.content.listType}
            widgetId={widget.id}
            projectId={widget.projectId}
          />
        )

      case 'text':
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{widget.content.markdown}</ReactMarkdown>
          </div>
        )

      case 'chart':
        return (
          <ChartWidget
            type={widget.content.chartType}
            data={widget.content.data}
            xAxisKey={widget.content.xAxisKey}
            yAxisKeys={widget.content.yAxisKeys}
            title={widget.content.description}
            colors={widget.content.colors}
          />
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
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
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