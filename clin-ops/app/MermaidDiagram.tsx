'use client'

import React, { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { generateAIResponse } from '../services/ai-client'

interface MermaidDiagramProps {
  chart: string
  className?: string
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, className = '' }) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isFixing, setIsFixing] = useState(false)
  const [fixedChart, setFixedChart] = useState('')

  useEffect(() => {
    // Initialize mermaid with white text/lines and transparent background
    const initializeMermaid = async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#1e293b',
            primaryTextColor: '#ffffff',
            primaryBorderColor: '#ffffff',
            lineColor: '#ffffff',
            sectionBkgColor: 'transparent',
            altSectionBkgColor: 'transparent',
            gridColor: '#ffffff',
            secondaryColor: '#0f172a',
            tertiaryColor: '#334155',
            background: 'transparent',
            mainBkg: 'transparent',
            secondBkg: 'transparent',
            tertiaryBkg: 'transparent',
            cScale0: '#1e293b',
            cScale1: '#0f172a',
            cScale2: '#334155',
            cScale3: '#475569',
            cScale4: '#64748b',
            pie1: '#1e40af',
            pie2: '#7c3aed',
            pie3: '#dc2626',
            pie4: '#059669',
            pie5: '#d97706',
            pie6: '#c026d3',
            pie7: '#0891b2',
            pie8: '#65a30d',
            pie9: '#e11d48',
            pie10: '#0d9488',
            pie11: '#7c2d12',
            pie12: '#581c87'
          },
          fontFamily: 'Arial, sans-serif',
          fontSize: 12,
          suppressErrorRendering: true,
          logLevel: 'error',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'linear'
          },
          sequence: {
            diagramMarginX: 50,
            diagramMarginY: 10,
            actorMargin: 50,
            width: 150,
            height: 65,
            boxMargin: 10,
            boxTextMargin: 5,
            noteMargin: 10,
            messageMargin: 35,
            mirrorActors: true,
            bottomMarginAdj: 1,
            useMaxWidth: true
          },
          gantt: {
            titleTopMargin: 25,
            barHeight: 20,
            useMaxWidth: true
          }
        })
        setIsInitialized(true)
      } catch (error) {
        setIsInitialized(true) // Still set to true to prevent infinite loading
      }
    }

    initializeMermaid()
  }, [])

  const fixDiagram = async () => {
    setIsFixing(true)
    
    try {
      const fixPrompt = `Please fix this Mermaid diagram syntax error. Here's the error message and the diagram code:

Error: ${errorMessage}

Diagram Code:
${chart}

Please provide only the corrected Mermaid diagram code with proper syntax, enclosed in a code block. Make sure:
1. All node labels with special characters are properly quoted
2. Remove any trailing semicolons
3. Use proper Mermaid syntax
4. Keep the same diagram structure and content
5. Fix any syntax issues that would cause parsing errors

Return only the corrected diagram code, nothing else.`

      const result = await generateAIResponse(fixPrompt)
      
      if (result.success && result.response) {
        // Extract the diagram code from the response
        const codeBlockMatch = result.response.match(/```(?:mermaid)?\s*\n([\s\S]*?)```/);
        const correctedChart = codeBlockMatch ? codeBlockMatch[1].trim() : result.response.trim();
        
        setFixedChart(correctedChart)
        setIsError(false)
        setErrorMessage('')
        
        // Trigger re-render with the fixed chart
        renderDiagram(correctedChart)
      }
    } catch (error) {
      console.error('Error fixing diagram:', error)
    } finally {
      setIsFixing(false)
    }
  }

  const renderDiagram = async (chartToRender = chart) => {
    // Wait for initialization and ensure we have required elements
    if (!isInitialized || !elementRef.current || !chartToRender.trim()) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setIsError(false)
    setErrorMessage('')

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsError(true)
      setErrorMessage('Rendering timeout')
      setIsLoading(false)
      if (elementRef.current) {
        elementRef.current.innerHTML = `
          <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div class="text-yellow-600 dark:text-yellow-400 text-sm font-medium mb-2">
              Diagram Rendering Timeout
            </div>
            <div class="text-yellow-500 dark:text-yellow-300 text-xs mb-3">
              The diagram took too long to render. Code shown below:
            </div>
            <pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto border font-mono text-gray-800 dark:text-gray-200">${chartToRender}</pre>
          </div>
        `
      }
    }, 10000) // 10 second timeout

    try {
      // Clean the chart string with enhanced processing to fix common syntax issues
      let cleanChart = chartToRender.trim()
      
      // Only normalize line endings - preserve all other content
      cleanChart = cleanChart.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      
      // Only add diagram type if it's completely missing
      if (!cleanChart.match(/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitgraph|mindmap|timeline|sankey|xychart|quadrantChart|requirement|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)\b/i)) {
        // Detect sequence diagrams by looking for participants or sequence diagram syntax
        if (/participant\s+|actor\s+|\->>|\-\->>|activate\s+|deactivate\s+/.test(cleanChart)) {
          cleanChart = `sequenceDiagram\n${cleanChart}`;
        } else if (/-->|->|--/.test(cleanChart)) {
          cleanChart = `flowchart TD\n${cleanChart}`;
        }
      }
      
      // Fix common Mermaid syntax issues that cause parsing errors
      cleanChart = cleanChart
        // Remove trailing semicolons which can cause issues
        .replace(/;\s*$/gm, '')
        // Fix parentheses inside square brackets - replace with quotes
        .replace(/\[([^\[]*)\(([^)]*)\)([^\]]*)\]/g, '["$1($2)$3"]')
        // Fix parentheses inside curly braces
        .replace(/\{([^{}]*)\(([^)]*)\)([^{}]*)\}/g, '{"$1($2)$3"}')
        // Fix spaces in node IDs by wrapping problematic labels in quotes
        .replace(/-->\s*([A-Za-z_][A-Za-z0-9_]*)\[(.*?)\]/g, (match, nodeId, label) => {
          // If label contains problematic characters, wrap in quotes
          if (/[()\/\-\s]/.test(label)) {
            return `--> ${nodeId}["${label}"]`;
          }
          return match;
        })
        // Fix problematic characters in flowchart node definitions
        .replace(/([A-Za-z_][A-Za-z0-9_]*)\[([^\[]*[()\/\-][^\]]*)\]/g, '$1["$2"]')
        .replace(/([A-Za-z_][A-Za-z0-9_]*)\(([^()]*[\/\-][^()]*)\)/g, '$1("$2")')
        .replace(/([A-Za-z_][A-Za-z0-9_]*)\{([^{}]*[()\/\-][^{}]*)\}/g, '$1{"$2"}')
        // Fix subgraph syntax issues
        .replace(/subgraph\s+([^\{\n]*)\s*\n\s*([^;]+);\s*end/gm, (match, title, nodes) => {
          const nodeList = nodes.split(';').map((n: string) => n.trim()).filter((n: string) => n).join('\n        ');
          return `subgraph ${title}\n        ${nodeList}\n    end`;
        })

      // Gantt-specific cleanup: fix invalid 'section <title>: <rest>' lines
      if (/^\s*gantt\b/i.test(cleanChart)) {
        // Split lines where a colon follows the section title into a new line for the rest
        cleanChart = cleanChart
          .replace(/^(\s*section\s+)([^\n:]+):\s*(.+)$/gmi, (m, prefix, title, rest) => {
            const safeTitle = String(title).trim();
            const nextLine = String(rest).trim();
            return `${prefix}${safeTitle}\n${nextLine}`;
          })
          // Remove trailing colon on pure section lines like 'section Title:'
          .replace(/^(\s*section\s+)(.+?):\s*$/gmi, '$1$2');
      }
      
      // Generate unique ID for this diagram
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
      
      // Skip validation and go straight to rendering to avoid error notifications
      // Temporarily suppress console errors during rendering
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      console.error = () => {}; // Suppress error messages
      console.warn = () => {}; // Suppress warning messages
      
      try {
        // Render the diagram
        const renderResult = await mermaid.render(id, cleanChart)
        
        // Clear timeout since rendering succeeded
        clearTimeout(timeoutId)
        
        if (elementRef.current && renderResult && renderResult.svg) {
          elementRef.current.innerHTML = renderResult.svg
          
          // Add some styling to the rendered SVG
          const svg = elementRef.current.querySelector('svg');
          if (svg) {
            svg.style.maxWidth = '100%';
            svg.style.height = 'auto';
            svg.style.background = 'transparent';
          }
        } else {
          throw new Error('No SVG returned from mermaid.render')
        }
      } finally {
        // Restore console methods
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
      }
    } catch (error) {
      clearTimeout(timeoutId)
      const errorMsg = error instanceof Error ? error.message : 'Failed to render diagram';
      setIsError(true)
      setErrorMessage(errorMsg)
      
      if (elementRef.current) {
        elementRef.current.innerHTML = `
          <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div class="text-yellow-600 dark:text-yellow-400 text-sm font-medium mb-2">
              Diagram Rendering Issue - Showing as Code
            </div>
            <div class="text-yellow-500 dark:text-yellow-300 text-xs mb-3">
              ${errorMsg} - The diagram code is shown below:
            </div>
            <pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto border font-mono text-gray-800 dark:text-gray-200">${chartToRender}</pre>
          </div>
        `
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const chartToUse = fixedChart || chart;
    renderDiagram(chartToUse);
  }, [chart, isInitialized, fixedChart])

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-xs">Rendering diagram...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`mermaid-container bg-transparent rounded-lg p-4 border border-gray-200 dark:border-gray-700 ${className}`}>
      {isError && (
        <div className="mb-3 flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2">
          <span className="text-yellow-600 dark:text-yellow-400 text-xs">Diagram has syntax errors</span>
          <button
            onClick={fixDiagram}
            disabled={isFixing}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-xs rounded flex items-center gap-1"
          >
            {isFixing ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Fixing...
              </>
            ) : (
              'Fix Diagram'
            )}
          </button>
        </div>
      )}
      <div 
        ref={elementRef}
        className="mermaid-diagram flex justify-center items-center min-h-[100px] overflow-auto"
        style={{ 
          maxWidth: '100%',
          fontSize: '12px',
          background: 'transparent'
        }}
      />
    </div>
  )
}

export default MermaidDiagram 