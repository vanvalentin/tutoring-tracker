import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { useState, useMemo } from 'react'
import { TextField, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material'
import fuzzysort from 'fuzzysort'

const columnHelper = createColumnHelper()

/** Fuzzy global filter: matches rows when the query fuzzily matches any cell value */
function fuzzyGlobalFilterFn(row, _columnId, filterValue) {
  if (!filterValue || typeof filterValue !== 'string') return true
  const query = filterValue.trim()
  if (!query) return true

  const searchableText = row
    .getVisibleCells()
    .map((cell) => {
      const val = cell.getValue()
      if (val == null) return ''
      if (typeof val === 'object' && val?.$$typeof) return ''
      if (typeof val === 'object') return JSON.stringify(val)
      return String(val)
    })
    .filter(Boolean)
    .join(' ')

  return fuzzysort.single(query, searchableText) !== null
}

export default function SortableTable({
  columns,
  data,
  emptyMessage = 'No data',
  renderActions,
  initialSort,
  searchPlaceholder = 'Search...',
  cardTitleKey,
  cardSubtitleKeys,
  headerSlot,
  getRowClassName,
}) {
  const [sorting, setSorting] = useState(initialSort || [])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const displayColumns = columns.filter((c) => c.key && c.key !== 'actions')

  const tableColumns = useMemo(() => {
    const cols = columns.map((col) => {
      const def = col.accessorFn
        ? columnHelper.accessor(col.accessorFn, { id: col.key })
        : columnHelper.accessor(col.key, {})
      return {
        ...def,
        header: col.label,
        cell: col.cell
          ? (info) => col.cell(info.getValue(), info.row.original)
          : (info) => info.getValue(),
        enableSorting: col.sortable !== false,
      }
    })
    if (renderActions) {
      cols.push(
        columnHelper.display({
          id: 'actions',
          header: '',
          cell: ({ row }) => renderActions(row.original),
        })
      )
    }
    return cols
  }, [columns, renderActions])

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    globalFilterFn: fuzzyGlobalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const rows = table.getRowModel().rows
  const pageCount = table.getPageCount()
  const { pageIndex, pageSize } = table.getState().pagination
  const filteredCount = table.getFilteredRowModel().rows.length
  const start = filteredCount === 0 ? 0 : pageIndex * pageSize + 1
  const end = Math.min((pageIndex + 1) * pageSize, filteredCount)

  const getCellValue = (row, col) => {
    const cell = row.getVisibleCells().find((c) => c.column.id === col.key)
    if (!cell) return null
    const val = col.cell ? col.cell(cell.getValue(), row.original) : cell.getValue()
    if (val != null && typeof val === 'object' && val.$$typeof) return val
    return val ?? '-'
  }

  return (
    <div className="space-y-4">
      {/* Search and controls */}
      <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            size="small"
            fullWidth
          />
          {headerSlot}
        </Box>
      </Box>

      {/* Desktop: Table view */}
      <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow sm:block">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 ${
                      header.column.getCanSort()
                        ? 'cursor-pointer select-none hover:bg-gray-200'
                        : ''
                    }`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() && (
                        <span className="text-gray-400">
                          {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={tableColumns.length}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const rowClass = getRowClassName?.(row.original)
                const baseClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                return (
                <tr
                  key={row.id}
                  className={rowClass ? `${baseClass} ${rowClass}` : baseClass}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm text-gray-900">
                      {cell.column.id === 'actions' ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      ) : (
                        flexRender(cell.column.columnDef.cell, cell.getContext())
                      )}
                    </td>
                  ))}
                </tr>
              )
              })
            )}
          </tbody>
        </table>

        {/* Pagination footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {filteredCount === 0
                ? '0 results'
                : `Showing ${start} - ${end} of ${filteredCount}`}
            </span>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Per page</InputLabel>
                <Select
                  value={pageSize}
                  label="Per page"
                  onChange={(e) =>
                    setPagination((p) => ({ ...p, pageSize: Number(e.target.value), pageIndex: 0 }))
                  }
                >
                  {[4, 10, 20, 50].map((n) => (
                    <MenuItem key={n} value={n}>
                      {n}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            {pageCount > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                >
                  ← Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {pageIndex + 1} of {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>

      {/* Mobile: Card view */}
      <div className="space-y-3 sm:hidden">
        {rows.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-12 text-center text-gray-500 shadow-sm">
            {emptyMessage}
          </div>
        ) : (
          rows.map((row) => {
            const titleCol = displayColumns.find((c) => c.key === (cardTitleKey ?? displayColumns[0]?.key)) ?? displayColumns[0]
            const subtitleCol = displayColumns[1]
            const excludedFromDetails = new Set([
              titleCol?.key,
              ...(cardSubtitleKeys?.length ? cardSubtitleKeys : [subtitleCol?.key]),
            ].filter(Boolean))
            const detailCols = displayColumns.filter(
              (c) => c.key !== 'actions' && !excludedFromDetails.has(c.key)
            )
            const titleVal = getCellValue(row, titleCol)
            const subtitleVal = cardSubtitleKeys?.length
              ? cardSubtitleKeys
                  .map((k) => {
                    const col = displayColumns.find((c) => c.key === k)
                    return col ? getCellValue(row, col) : null
                  })
                  .filter(Boolean)
                  .join(' · ')
              : subtitleCol
                ? getCellValue(row, subtitleCol)
                : null
            const cardClass = getRowClassName?.(row.original)
            return (
              <div
                key={row.id}
                className={`overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm ${cardClass ?? ''}`}
              >
                <div className="flex items-start justify-between gap-2 border-b border-gray-100 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900">
                      {typeof titleVal === 'object' && titleVal?.$$typeof ? titleVal : String(titleVal ?? '-')}
                    </div>
                    {subtitleVal && (
                      <div className="mt-0.5 text-xs text-gray-500">
                        {subtitleVal}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {renderActions?.(row.original)}
                  </div>
                </div>
                {detailCols.length > 0 && (
                  <div className="bg-gray-50/80 px-4 py-3">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      {detailCols.map((col) => (
                        <div key={col.key} className="flex flex-col">
                          <dt className="text-xs font-medium text-gray-500">{col.label}</dt>
                          <dd className="text-gray-900">{getCellValue(row, col)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            )
          })
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {filteredCount === 0
                ? '0 results'
                : `Showing ${start} - ${end} of ${filteredCount}`}
            </span>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Per page</InputLabel>
              <Select
                value={pageSize}
                label="Per page"
                onChange={(e) =>
                  setPagination((p) => ({ ...p, pageSize: Number(e.target.value), pageIndex: 0 }))
                }
              >
                {[4, 10, 20, 50].map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          {pageCount > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="rounded px-2 py-1 text-sm text-gray-600 disabled:opacity-50"
              >
                ←
              </button>
              <span className="text-sm text-gray-600">
                {pageIndex + 1} of {pageCount}
              </span>
              <button
                type="button"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="rounded px-2 py-1 text-sm text-gray-600 disabled:opacity-50"
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
