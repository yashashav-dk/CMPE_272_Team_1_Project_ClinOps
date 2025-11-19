'use client'

import React, { useState } from 'react'
import { IoCheckmark, IoEllipseOutline, IoWarning, IoChevronForward, IoInformationCircle } from 'react-icons/io5'

interface WorkflowStep {
  name: string
  status: 'completed' | 'active' | 'pending' | 'blocked'
  description?: string
  assignee?: string
  dueDate?: string
  blockedReason?: string
}

interface InteractiveWorkflowProps {
  steps: WorkflowStep[]
  title?: string
}

export default function InteractiveWorkflow({ steps, title }: InteractiveWorkflowProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'vertical' | 'horizontal'>('vertical')

  const getStepIcon = (status: string, isActive: boolean) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
            <IoCheckmark className="w-5 h-5 text-white" />
          </div>
        )
      case 'active':
        return (
          <div className={`w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center ${isActive ? 'animate-pulse' : ''}`}>
            <IoEllipseOutline className="w-5 h-5 text-white fill-white" />
          </div>
        )
      case 'blocked':
        return (
          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
            <IoWarning className="w-5 h-5 text-white" />
          </div>
        )
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
            <IoEllipseOutline className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>
        )
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20'
      case 'active':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
      case 'blocked':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20'
      default:
        return 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
    }
  }

  const completedSteps = steps.filter(s => s.status === 'completed').length
  const progressPercentage = (completedSteps / steps.length) * 100

  if (viewMode === 'horizontal') {
    return (
      <div className="space-y-4">
        {/* View Toggle */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setViewMode('vertical')}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Switch to Vertical View
          </button>
        </div>

        {/* Horizontal Stepper */}
        <div className="relative">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <React.Fragment key={idx}>
                <div
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}
                >
                  {getStepIcon(step.status, expandedStep === idx)}
                  <div className="mt-2 text-xs text-center max-w-[100px] font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {step.name}
                  </div>
                </div>
                
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${
                    steps[idx].status === 'completed' && steps[idx + 1].status === 'completed'
                      ? 'bg-green-500'
                      : steps[idx].status === 'completed'
                      ? 'bg-gradient-to-r from-green-500 to-gray-300 dark:to-gray-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Expanded Step Details */}
        {expandedStep !== null && steps[expandedStep] && (
          <div className={`mt-4 p-4 rounded-lg border-2 ${getStatusColor(steps[expandedStep].status)} animate-in fade-in duration-200`}>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {steps[expandedStep].name}
            </h4>
            {steps[expandedStep].description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {steps[expandedStep].description}
              </p>
            )}
            <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
              {steps[expandedStep].assignee && (
                <span>Assignee: <strong>{steps[expandedStep].assignee}</strong></span>
              )}
              {steps[expandedStep].dueDate && (
                <span>Due: <strong>{steps[expandedStep].dueDate}</strong></span>
              )}
            </div>
            {steps[expandedStep].blockedReason && (
              <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs text-red-700 dark:text-red-400">
                <strong>Blocked:</strong> {steps[expandedStep].blockedReason}
              </div>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Workflow Progress</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {completedSteps} / {steps.length} steps
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  // Vertical View
  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-between items-center">
        {title && <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>}
        <button
          onClick={() => setViewMode('horizontal')}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Switch to Horizontal View
        </button>
      </div>

      {/* Vertical Workflow Steps */}
      <div className="relative space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="relative">
            {/* Connector Line */}
            {idx < steps.length - 1 && (
              <div className={`absolute left-5 top-12 w-0.5 h-full ${
                step.status === 'completed'
                  ? 'bg-green-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`} />
            )}

            {/* Step Card */}
            <div
              onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}
              className="flex items-start gap-4 cursor-pointer group"
            >
              {/* Icon */}
              <div className="relative z-10 flex-shrink-0">
                {getStepIcon(step.status, expandedStep === idx)}
              </div>

              {/* Content */}
              <div className={`flex-1 rounded-lg p-4 border-2 transition-all ${
                getStatusColor(step.status)
              } ${expandedStep === idx ? 'shadow-lg' : 'shadow-sm'} group-hover:shadow-md`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {step.name}
                      </h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        step.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        step.status === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        step.status === 'blocked' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {step.status}
                      </span>
                    </div>

                    {/* Quick Info */}
                    {!expandedStep && (step.assignee || step.dueDate) && (
                      <div className="mt-1 flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                        {step.assignee && <span>👤 {step.assignee}</span>}
                        {step.dueDate && <span>📅 {step.dueDate}</span>}
                      </div>
                    )}
                  </div>
                  
                  <IoChevronForward className={`w-4 h-4 text-gray-400 transition-transform ${
                    expandedStep === idx ? 'rotate-90' : ''
                  }`} />
                </div>

                {/* Expanded Details */}
                {expandedStep === idx && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2 animate-in fade-in duration-200">
                    {step.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {step.description}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {step.assignee && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Assignee:</span>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{step.assignee}</p>
                        </div>
                      )}
                      {step.dueDate && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Due Date:</span>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{step.dueDate}</p>
                        </div>
                      )}
                    </div>

                    {step.blockedReason && (
                      <div className="flex items-start gap-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs">
                        <IoInformationCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-red-700 dark:text-red-400">Blocked:</strong>
                          <p className="text-red-600 dark:text-red-300 mt-1">{step.blockedReason}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">Overall Progress</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {completedSteps} / {steps.length} completed ({Math.round(progressPercentage)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-green-500 via-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500 relative overflow-hidden"
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  )
}
