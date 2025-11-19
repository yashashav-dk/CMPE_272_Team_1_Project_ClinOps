'use client'

import React, { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import {
  HiChevronUp,
  HiChevronDown,
  HiSearch,
  HiChevronLeft,
  HiChevronRight,
  HiDownload,
  HiEye,
  HiEyeOff,
} from 'react-icons/hi'

interface AdvancedTableProps {
  data: Array<Record<string, any>>
  headers: string[]
  widgetId: string
  projectId: string
  title?: string
  enableSearch?: boolean
  enablePagination?: boolean
  enableExport?: boolean
  enableColumnVisibility?: boolean
  pageSize?: number
}

export default function AdvancedTable({
  data,
  headers,
  widgetId,
  projectId,
  title,
  enableSearch = true,
  enablePagination = true,
  enableExport = true,
  enableColumnVisibility = true,
  pageSize = 10,
}: AdvancedTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  const [showColumnSelector, setShowColumnSelector] = useState(false)

  // Generate columns from headers
  const columns = useMemo<ColumnDef<any>[]>(
    () =>
      headers.map((header) => ({
        accessorKey: header,
        header: () => (
          <div className="flex items-center gap-1">
            <span className="font-semibold">{header}</span>
          </div>
        ),
        cell: (info) => {
          const value = info.getValue()
          return (
            <div className="text-sm text-gray-900 dark:text-gray-100">
              {value !== null && value !== undefined ? String(value) : '-'}
            </div>
          )
        },
      })),
    [headers]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  // Export to CSV
  const exportToCSV = () => {
    const csvHeaders = headers.join(',')
    const csvRows = data.map((row) =>
      headers.map((header) => {
        const value = row[header]
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value ?? '')
        return stringValue.includes(',') ? `"${stringValue.replace(/"/g, '""')}"` : stringValue
      }).join(',')
    )
    const csv = [csvHeaders, ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${title || 'table'}-export.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        {/* Search */}
        {enableSearch && (
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search all columns..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Column Visibility */}
          {enableColumnVisibility && (
            <div className="relative">
              <button
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                {showColumnSelector ? <HiEyeOff className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
                Columns
              </button>
              
              {showColumnSelector && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 p-2">
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {table.getAllLeafColumns().map((column) => (
                      <label
                        key={column.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={column.getIsVisible()}
                          onChange={column.getToggleVisibilityHandler()}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {column.id}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Export */}
          {enableExport && (
            <button
              onClick={exportToCSV}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <HiDownload className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-2 ${
                          header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="flex flex-col">
                            {header.column.getIsSorted() === 'asc' ? (
                              <HiChevronUp className="w-4 h-4 text-indigo-600" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <HiChevronDown className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <div className="flex flex-col opacity-30">
                                <HiChevronUp className="w-3 h-3 -mb-1" />
                                <HiChevronDown className="w-3 h-3" />
                              </div>
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  No data found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {enablePagination && data.length > pageSize && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing{' '}
            <span className="font-medium">{table.getState().pagination.pageIndex * pageSize + 1}</span>
            {' '}-{' '}
            <span className="font-medium">
              {Math.min((table.getState().pagination.pageIndex + 1) * pageSize, data.length)}
            </span>
            {' '}of{' '}
            <span className="font-medium">{data.length}</span> results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <HiChevronLeft className="w-4 h-4" />
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: table.getPageCount() }, (_, i) => i).map((pageIndex) => {
                // Show first page, last page, current page, and pages around current
                const currentPage = table.getState().pagination.pageIndex
                const showPage =
                  pageIndex === 0 ||
                  pageIndex === table.getPageCount() - 1 ||
                  Math.abs(pageIndex - currentPage) <= 1

                if (!showPage && pageIndex === 1 && currentPage > 3) {
                  return <span key={pageIndex} className="px-2">...</span>
                }
                if (!showPage && pageIndex === table.getPageCount() - 2 && currentPage < table.getPageCount() - 4) {
                  return <span key={pageIndex} className="px-2">...</span>
                }
                if (!showPage) return null

                return (
                  <button
                    key={pageIndex}
                    onClick={() => table.setPageIndex(pageIndex)}
                    className={`px-3 py-2 text-sm rounded-lg ${
                      pageIndex === currentPage
                        ? 'bg-indigo-600 text-white'
                        : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageIndex + 1}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next
              <HiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
