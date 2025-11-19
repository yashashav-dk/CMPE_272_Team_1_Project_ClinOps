'use client'

import React, { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { generateAIResponse } from '../services/ai-client'

interface MermaidDiagramProps {
  chart: string
  className?: string
  projectId?: string
  contextInfo?: string
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, className = '', projectId, contextInfo }) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isFixing, setIsFixing] = useState(false)
  const [fixedChart, setFixedChart] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveTitle, setSaveTitle] = useState('')
  const [saveDescription, setSaveDescription] = useState('')

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
4. Preserve the original diagram's intent, structure, and level of detail (do NOT replace it with a generic template)
5. Fix only the syntax issues that would cause parsing errors

Return only the corrected diagram code, nothing else (no explanations or commentary).`

      const result = await generateAIResponse({
        prompt: fixPrompt,
        forceRefresh: true,
        projectId: projectId || 'diagram-fix',
        persona: 'diagramFixer',
        tabType: contextInfo || 'diagram'
      })

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

  const handleSaveDiagram = async () => {
    if (!saveTitle.trim()) {
      alert('Please enter a title for the diagram')
      return
    }

    setIsSaving(true)

    try {
      const diagramToSave = fixedChart || chart

      // Detect diagram type from the code
      const typeMatch = diagramToSave.match(/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitgraph|mindmap|timeline)/i)
      const diagramType = typeMatch ? typeMatch[1] : 'unknown'

      const response = await fetch('/api/diagrams/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: projectId || 'default-project',
          userId: 'default-user',
          title: saveTitle,
          description: saveDescription || null,
          diagramCode: diagramToSave,
          diagramType,
          context: contextInfo ? { info: contextInfo } : null
        })
      })

      const result = await response.json()

      if (result.success) {
        setIsSaved(true)
        setShowSaveDialog(false)
        setSaveTitle('')
        setSaveDescription('')

        // Reset saved indicator after 3 seconds
        setTimeout(() => setIsSaved(false), 3000)
      } else {
        alert(`Failed to save diagram: ${result.error}`)
      }
    } catch (error) {
      console.error('Error saving diagram:', error)
      alert('Failed to save diagram')
    } finally {
      setIsSaving(false)
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

      // Targeted fix: normalize edges like `D -- U.S. Sites -- G[...]` to `D --> G[...]`
      // This pattern (node -- label -- node[label]) is not valid Mermaid edge syntax
      cleanChart = cleanChart.replace(
        /\b([A-Za-z0-9_]+)\s*--\s*[^-\n]+?\s*--\s*([A-Za-z0-9_]+)(\[[^\]]*\])/g,
        '$1 --> $2$3'
      );

      // Ensure any standalone `end` keyword is on its own line
      // Sometimes the LLM (or previous processing) produces lines like
      // `C->>DM: Enters data ... EDC end` which Mermaid cannot parse.
      // This splits such cases into:
      //   C->>DM: Enters data ... EDC
      //   end
      cleanChart = cleanChart.replace(/(.*?)(\s+end\b)/g, (match, before) => {
        // If the line already starts with `end`, leave it as-is
        if (/^\s*end\b/.test(match)) return match;
        return `${before}\nend`;
      });

      // Handle cases where `end` is attached directly to a preceding token
      cleanChart = cleanChart.replace(/([A-Z0-9\]\)})"'])end\b/g, '$1\nend');

      // Handle specific malformed token `EDCend` seen in some diagrams by
      // splitting it into `EDC` and a closing `end` on the next line.
      cleanChart = cleanChart.replace(/EDCend\b/g, 'EDC\nend');

      // Additional safety: comment out stray plain-text lines that are not valid Mermaid syntax
      // This prevents narrative lines like "Site Initiation Visit (SIV) & Tech Qualifi..." from
      // causing parse errors while keeping actual diagram definitions intact.
      const diagramLines = cleanChart.split('\n');
      const processedLines = diagramLines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        // Keep known directive / structure lines as-is
        if (/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitgraph|mindmap|timeline|sankey|xychart|quadrantChart|requirement|subgraph|end|section|click|style|link|accTitle|accDescr|accDescription|axisFormat)\b/i.test(trimmed)) {
          return line;
        }

        // Keep lines that clearly contain edges or node definitions
        if (/[<>-]{2,}|==>|:::|\[.*\]|\{.*\}/.test(trimmed)) {
          return line;
        }

        // Otherwise, treat as a comment so Mermaid ignores it
        return `%% ${line}`;
      });

      cleanChart = processedLines.join('\n');

      // NOTE: The aggressive auto-fix regex chain below is intentionally disabled
      // because it was over-correcting valid Mermaid diagrams and causing
      // widespread syntax errors across tabs. We keep the code for potential
      // future tuning, but it is not executed.
      if (false) {
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
    <>
      <div className={`mermaid-container bg-transparent rounded-lg p-4 border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="flex justify-between items-center mb-3">
          {isError && (
            <div className="flex-1 flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2 mr-2">
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

          {/* Save Button */}
          <button
            onClick={() => setShowSaveDialog(true)}
            disabled={isSaving}
            className={`px-3 py-1 ${isSaved ? 'bg-green-500' : 'bg-indigo-500 hover:bg-indigo-600'} disabled:bg-gray-300 text-white text-xs rounded flex items-center gap-1`}
          >
            {isSaved ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved!
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save
              </>
            )}
          </button>
        </div>

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

      {/* Save Dialog Modal */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Save Diagram</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="Enter diagram title"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowSaveDialog(false)
                  setSaveTitle('')
                  setSaveDescription('')
                }}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDiagram}
                disabled={isSaving || !saveTitle.trim()}
                className="px-4 py-2 text-sm bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white rounded-lg flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  'Save Diagram'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MermaidDiagram 