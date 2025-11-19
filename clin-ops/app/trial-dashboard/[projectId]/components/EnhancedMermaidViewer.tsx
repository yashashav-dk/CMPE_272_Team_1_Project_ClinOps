'use client'

import React, { useState } from 'react'
import MermaidDiagram from '@/app/MermaidDiagram'
import { HiZoomIn, HiZoomOut, HiArrowsExpand, HiDownload } from 'react-icons/hi'

interface EnhancedMermaidViewerProps {
  chart: string
  projectId: string
  contextInfo?: string
  title?: string
}

export default function EnhancedMermaidViewer({ 
  chart, 
  projectId, 
  contextInfo,
  title 
}: EnhancedMermaidViewerProps) {
  const [zoom, setZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50))
  }

  const handleReset = () => {
    setZoom(100)
  }

  const handleDownload = () => {
    // Create a downloadable SVG
    const svgElement = document.querySelector('.mermaid-diagram svg')
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement)
      const blob = new Blob([svgData], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${title || 'diagram'}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : ''}`}>
      {/* Controls */}
      <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 rounded transition-colors"
            title="Zoom Out"
          >
            <HiZoomOut className="w-4 h-4" />
          </button>
          
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[50px] text-center">
            {zoom}%
          </span>
          
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 rounded transition-colors"
            title="Zoom In"
          >
            <HiZoomIn className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleReset}
            className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 rounded transition-colors"
            title="Reset Zoom"
          >
            Reset
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 rounded transition-colors"
            title="Download SVG"
          >
            <HiDownload className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 rounded transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            <HiArrowsExpand className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Diagram Container */}
      <div 
        className={`overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 ${
          isFullscreen ? 'h-[calc(100vh-80px)]' : 'max-h-[600px]'
        }`}
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top left',
        }}
      >
        <div className="p-4 mermaid-diagram">
          <MermaidDiagram
            chart={chart}
            projectId={projectId}
            contextInfo={contextInfo}
          />
        </div>
      </div>

      {/* Help Text */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        💡 Use zoom controls to adjust view. Click fullscreen for better visibility.
      </p>

      {/* Fullscreen Overlay Close Button */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg shadow-lg"
        >
          Close Fullscreen
        </button>
      )}
    </div>
  )
}
