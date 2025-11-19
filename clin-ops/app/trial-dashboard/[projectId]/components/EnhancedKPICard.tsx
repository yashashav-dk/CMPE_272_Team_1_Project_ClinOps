'use client'

import React from 'react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { HiArrowUp, HiArrowDown, HiMinus } from 'react-icons/hi'

export interface KPIData {
  value: number
  target?: number
  unit: 'number' | 'percentage' | 'days' | 'count' | 'currency'
  status: 'on-track' | 'at-risk' | 'critical' | 'unknown'
  trend?: 'up' | 'down' | 'stable'
  trendValue?: number // Percentage change
  historical?: Array<{ value: number }>
  description?: string
  label?: string
}

interface EnhancedKPICardProps {
  kpi: KPIData
  title: string
  onClick?: () => void
}

export default function EnhancedKPICard({ kpi, title, onClick }: EnhancedKPICardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
      case 'at-risk':
        return 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800'
      case 'critical':
        return 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800'
      default:
        return 'from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 border-gray-200 dark:border-gray-700'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'at-risk':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <HiArrowUp className="w-4 h-4 text-green-600 dark:text-green-400" />
      case 'down':
        return <HiArrowDown className="w-4 h-4 text-red-600 dark:text-red-400" />
      case 'stable':
        return <HiMinus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      default:
        return null
    }
  }

  const formatValue = (value: number, unit: string) => {
    switch (unit) {
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'currency':
        return `$${value.toLocaleString()}`
      case 'days':
        return `${value} ${value === 1 ? 'day' : 'days'}`
      case 'count':
        return value.toLocaleString()
      default:
        return value.toLocaleString()
    }
  }

  const percentage = kpi.target 
    ? Math.round((kpi.value / kpi.target) * 100) 
    : null

  return (
    <div
      className={`bg-gradient-to-br ${getStatusColor(kpi.status)} rounded-lg p-6 border ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </h4>
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusBadgeColor(kpi.status)}`}>
          {kpi.status.replace('-', ' ')}
        </span>
      </div>

      {/* Main Value */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              {formatValue(kpi.value, kpi.unit)}
            </span>
            {kpi.target && (
              <span className="text-lg text-gray-500 dark:text-gray-400">
                / {formatValue(kpi.target, kpi.unit)}
              </span>
            )}
          </div>
          
          {/* Trend Indicator */}
          {kpi.trend && (
            <div className="flex items-center gap-1 mt-1">
              {getTrendIcon(kpi.trend)}
              {kpi.trendValue !== undefined && (
                <span className={`text-xs font-medium ${
                  kpi.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                  kpi.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {kpi.trendValue > 0 ? '+' : ''}{kpi.trendValue.toFixed(1)}%
                </span>
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                vs last period
              </span>
            </div>
          )}
        </div>

        {/* Sparkline */}
        {kpi.historical && kpi.historical.length > 0 && (
          <div className="w-24 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={kpi.historical}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={
                    kpi.status === 'on-track' ? '#10b981' :
                    kpi.status === 'at-risk' ? '#f59e0b' :
                    kpi.status === 'critical' ? '#ef4444' :
                    '#6b7280'
                  }
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {percentage !== null && (
        <div className="mb-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                percentage >= 100
                  ? 'bg-green-500'
                  : percentage >= 70
                  ? 'bg-blue-500'
                  : percentage >= 40
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {percentage}% Complete
            </span>
            {percentage < 100 && (
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {formatValue(kpi.target! - kpi.value, kpi.unit)} remaining
              </span>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      {kpi.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          {kpi.description}
        </p>
      )}
    </div>
  )
}
