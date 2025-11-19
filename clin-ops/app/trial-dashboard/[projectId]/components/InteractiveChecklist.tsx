'use client'

import React, { useState } from 'react'
import { IoCheckmarkCircle, IoEllipseOutline, IoFilter, IoArrowUp, IoArrowDown, IoRemoveCircleOutline } from 'react-icons/io5'

interface ChecklistItem {
  text: string
  checked?: boolean
  priority?: 'high' | 'medium' | 'low'
  category?: string
}

interface InteractiveChecklistProps {
  items: ChecklistItem[]
  listType?: 'checklist' | 'bullet' | 'numbered' | 'requirements'
}

export default function InteractiveChecklist({ items, listType = 'checklist' }: InteractiveChecklistProps) {
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'priority' | 'status' | 'none'>('none')

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400'
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'low':
        return 'text-green-600 dark:text-green-400'
      default:
        return 'text-gray-500 dark:text-gray-400'
    }
  }

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'high':
        return <IoArrowUp className="w-3 h-3" />
      case 'low':
        return <IoArrowDown className="w-3 h-3" />
      default:
        return <IoRemoveCircleOutline className="w-3 h-3" />
    }
  }

  // Filter items
  let filteredItems = items

  if (filterPriority !== 'all') {
    filteredItems = filteredItems.filter(item => item.priority === filterPriority)
  }

  if (filterCategory !== 'all') {
    filteredItems = filteredItems.filter(item => item.category === filterCategory)
  }

  // Sort items
  if (sortBy === 'priority') {
    const priorityOrder = { high: 0, medium: 1, low: 2, undefined: 3 }
    filteredItems = [...filteredItems].sort((a, b) => {
      const aOrder = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3
      const bOrder = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3
      return aOrder - bOrder
    })
  } else if (sortBy === 'status') {
    filteredItems = [...filteredItems].sort((a, b) => {
      if (a.checked === b.checked) return 0
      return a.checked ? 1 : -1
    })
  }

  // Get unique categories
  const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean)))
  const priorities = Array.from(new Set(items.map(item => item.priority).filter(Boolean)))

  // Calculate stats
  const completedCount = items.filter(item => item.checked).length
  const totalCount = items.length
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Filters & Controls */}
      {(priorities.length > 0 || categories.length > 0) && (
        <div className="flex flex-wrap gap-2 items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
          <div className="flex flex-wrap gap-2 items-center">
            <IoFilter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            
            {priorities.length > 0 && (
              <div className="flex gap-1">
                <button
                  onClick={() => setFilterPriority('all')}
                  className={`px-2 py-1 text-xs rounded ${
                    filterPriority === 'all'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  All Priority
                </button>
                {priorities.map(priority => (
                  <button
                    key={priority}
                    onClick={() => setFilterPriority(priority || 'all')}
                    className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                      filterPriority === priority
                        ? getPriorityBadge(priority)
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {getPriorityIcon(priority)}
                    {priority}
                  </button>
                ))}
              </div>
            )}

            {categories.length > 0 && (
              <div className="flex gap-1">
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`px-2 py-1 text-xs rounded ${
                    filterCategory === 'all'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  All Categories
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setFilterCategory(category || 'all')}
                    className={`px-2 py-1 text-xs rounded ${
                      filterCategory === category
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'priority' | 'status' | 'none')}
            className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <option value="none">Default Order</option>
            <option value="priority">Sort by Priority</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>
      )}

      {/* Checklist Items */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No items match the current filters
          </div>
        ) : (
          filteredItems.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                item.checked
                  ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:shadow-sm'
              }`}
            >
              {/* Checkbox Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {item.checked ? (
                  <IoCheckmarkCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <IoEllipseOutline className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-sm ${
                      item.checked
                        ? 'line-through text-gray-500 dark:text-gray-400'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {listType === 'numbered' && `${idx + 1}. `}
                    {item.text}
                  </span>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.priority && (
                      <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${getPriorityBadge(item.priority)}`}>
                        {getPriorityIcon(item.priority)}
                        {item.priority}
                      </span>
                    )}
                    {item.category && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Progress Bar */}
      {listType === 'checklist' && totalCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Completion Progress</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {completedCount} / {totalCount} ({Math.round(completionPercentage)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                completionPercentage === 100
                  ? 'bg-green-500'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500'
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
