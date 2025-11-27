'use client'

import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  subtext?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...', 
  subtext 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      {/* Main spinner container */}
      <div className={`relative ${sizeClasses[size]}`}>
        <div className={`absolute inset-0 rounded-full border-2 border-gray-200 dark:border-gray-700`}></div>
        <div className={`absolute inset-0 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin`}></div>
        
        {/* Inner pulsing dots */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex space-x-1">
            <div className={`${dotSize[size]} bg-indigo-600 rounded-full animate-pulse`}></div>
            <div className={`${dotSize[size]} bg-indigo-600 rounded-full animate-pulse delay-75`}></div>
            <div className={`${dotSize[size]} bg-indigo-600 rounded-full animate-pulse delay-150`}></div>
          </div>
        </div>
      </div>

      {/* Loading text */}
      <div className="text-center space-y-2">
        <div className="text-lg font-medium text-gray-700 dark:text-gray-300 animate-pulse">
          {text}
        </div>
        {subtext && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {subtext}
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <div className="w-48 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-shimmer"></div>
      </div>
    </div>
  )
}

export default LoadingSpinner
