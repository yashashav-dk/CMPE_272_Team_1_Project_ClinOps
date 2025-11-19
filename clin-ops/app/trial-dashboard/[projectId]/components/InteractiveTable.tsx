'use client'

import React, { useState, useEffect } from 'react'
import { HiPencil, HiCheck, HiX, HiPlus, HiTrash, HiSave } from 'react-icons/hi'

interface TableData {
  headers: string[]
  data: Record<string, any>[]
}

interface InteractiveTableProps {
  initialData: TableData
  widgetId: string
  projectId: string
  onDataChange?: (newData: TableData) => void
}

export default function InteractiveTable({ 
  initialData, 
  widgetId, 
  projectId,
  onDataChange 
}: InteractiveTableProps) {
  const [tableData, setTableData] = useState<TableData>(initialData)
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Save data to backend
  const saveData = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/dashboard/widget/${widgetId}/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          data: tableData
        })
      })

      if (response.ok) {
        setHasUnsavedChanges(false)
        if (onDataChange) {
          onDataChange(tableData)
        }
      } else {
        console.error('Failed to save table data')
      }
    } catch (error) {
      console.error('Error saving table data:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Start editing a cell
  const startEditing = (rowIdx: number, header: string) => {
    setEditingCell({ row: rowIdx, col: header })
    setEditValue(String(tableData.data[rowIdx][header] || ''))
  }

  // Save cell edit
  const saveEdit = () => {
    if (editingCell) {
      const newData = [...tableData.data]
      newData[editingCell.row] = {
        ...newData[editingCell.row],
        [editingCell.col]: editValue
      }
      setTableData({ ...tableData, data: newData })
      setEditingCell(null)
      setHasUnsavedChanges(true)
    }
  }

  // Cancel cell edit
  const cancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  // Add new row
  const addRow = () => {
    const newRow: Record<string, any> = {}
    tableData.headers.forEach(header => {
      newRow[header] = ''
    })
    setTableData({
      ...tableData,
      data: [...tableData.data, newRow]
    })
    setHasUnsavedChanges(true)
  }

  // Delete row
  const deleteRow = (rowIdx: number) => {
    if (confirm('Delete this row?')) {
      const newData = tableData.data.filter((_, idx) => idx !== rowIdx)
      setTableData({ ...tableData, data: newData })
      setHasUnsavedChanges(true)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingCell && e.key === 'Enter') {
        e.preventDefault()
        saveEdit()
      } else if (editingCell && e.key === 'Escape') {
        cancelEdit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingCell, editValue])

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={addRow}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-lg transition-colors"
          >
            <HiPlus className="w-3 h-3" />
            Add Row
          </button>
          
          {hasUnsavedChanges && (
            <button
              onClick={saveData}
              disabled={isSaving}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-lg transition-colors disabled:opacity-50"
            >
              <HiSave className="w-3 h-3" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>

        <span className="text-xs text-gray-500 dark:text-gray-400">
          {tableData.data.length} rows
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {tableData.headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {tableData.data.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                {tableData.headers.map((header, cellIdx) => (
                  <td
                    key={cellIdx}
                    className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300"
                    onClick={() => !editingCell && startEditing(rowIdx, header)}
                  >
                    {editingCell?.row === rowIdx && editingCell?.col === header ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-2 py-1 text-xs border border-indigo-300 dark:border-indigo-600 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                        />
                        <button
                          onClick={saveEdit}
                          className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                        >
                          <HiCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                        >
                          <HiX className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="group flex items-center gap-2 cursor-pointer">
                        <span className="flex-1">{row[header] || '-'}</span>
                        <HiPencil className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </td>
                ))}
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => deleteRow(rowIdx)}
                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                    title="Delete row"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tableData.data.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="mb-2">No data yet</p>
          <button
            onClick={addRow}
            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
          >
            Add your first row
          </button>
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        💡 Click any cell to edit. Press Enter to save, Esc to cancel.
      </p>
    </div>
  )
}
