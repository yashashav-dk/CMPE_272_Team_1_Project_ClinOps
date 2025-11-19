'use client'

import React, { useState } from 'react'
import { IoCheckmarkCircle, IoTimeOutline, IoAlertCircle, IoEllipseOutline, IoChevronDown, IoChevronForward } from 'react-icons/io5'

interface Milestone {
  name: string
  date: string
  status: 'completed' | 'in-progress' | 'upcoming' | 'delayed'
  description?: string
  dependencies?: string[]
}

interface InteractiveTimelineProps {
  milestones: Milestone[]
}

export default function InteractiveTimeline({ milestones }: InteractiveTimelineProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showDependencies, setShowDependencies] = useState(true)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <IoCheckmarkCircle className="w-5 h-5 text-green-500" />
      case 'in-progress':
        return <IoTimeOutline className="w-5 h-5 text-blue-500" />
      case 'delayed':
        return <IoAlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <IoEllipseOutline className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      delayed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      upcoming: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    }
    return styles[status as keyof typeof styles] || styles.upcoming
  }

  const filteredMilestones = statusFilter === 'all'
    ? milestones
    : milestones.filter(m => m.status === statusFilter)

  const statusCounts = {
    all: milestones.length,
    completed: milestones.filter(m => m.status === 'completed').length,
    'in-progress': milestones.filter(m => m.status === 'in-progress').length,
    upcoming: milestones.filter(m => m.status === 'upcoming').length,
    delayed: milestones.filter(m => m.status === 'delayed').length,
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2 items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                statusFilter === status
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)} ({count})
            </button>
          ))}
        </div>
        
        <button
          onClick={() => setShowDependencies(!showDependencies)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          {showDependencies ? <IoChevronDown className="w-3 h-3" /> : <IoChevronForward className="w-3 h-3" />}
          Dependencies
        </button>
      </div>

      {/* Timeline */}
      <div className="relative space-y-6">
        {filteredMilestones.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No milestones found for this filter
          </div>
        ) : (
          filteredMilestones.map((milestone, idx) => (
            <div
              key={idx}
              className={`relative transition-all ${
                selectedMilestone === idx ? 'scale-[1.02]' : ''
              }`}
            >
              {/* Connector Line */}
              {idx < filteredMilestones.length - 1 && (
                <div className="absolute left-[39px] top-12 w-0.5 h-full bg-gradient-to-b from-indigo-300 to-transparent dark:from-indigo-700" />
              )}

              {/* Milestone Card */}
              <div
                onClick={() => setSelectedMilestone(selectedMilestone === idx ? null : idx)}
                className="flex items-start gap-4 cursor-pointer group"
              >
                {/* Icon & Date */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div className="w-20 text-xs font-semibold text-gray-600 dark:text-gray-400 text-center">
                    {milestone.date}
                  </div>
                  <div className="relative z-10 p-2 bg-white dark:bg-gray-800 rounded-full border-2 border-indigo-200 dark:border-indigo-700 group-hover:border-indigo-400 dark:group-hover:border-indigo-500 transition-colors">
                    {getStatusIcon(milestone.status)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 group-hover:shadow-md group-hover:border-indigo-300 dark:group-hover:border-indigo-600 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {milestone.name}
                    </h4>
                    <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${getStatusBadge(milestone.status)}`}>
                      {milestone.status}
                    </span>
                  </div>

                  {/* Expanded Details */}
                  {selectedMilestone === idx && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2 animate-in fade-in duration-200">
                      {milestone.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {milestone.description}
                        </p>
                      )}
                      
                      {showDependencies && milestone.dependencies && milestone.dependencies.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Dependencies:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {milestone.dependencies.map((dep, depIdx) => (
                              <span
                                key={depIdx}
                                className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded"
                              >
                                {dep}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Progress Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Progress</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {statusCounts.completed} / {statusCounts.all} completed
          </span>
        </div>
        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(statusCounts.completed / statusCounts.all) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
