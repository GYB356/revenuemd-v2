 'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Column<T> {
  header: string
  accessorKey: keyof T
  cell?: (value: any, row: T) => ReactNode
  className?: string
}

interface VirtualizedTableProps<T> {
  data: T[]
  columns: Column<T>[]
  rowHeight?: number
  className?: string
  onRowClick?: (row: T) => void
}

export function VirtualizedTable<T>({
  data,
  columns,
  rowHeight = 40,
  className,
  onRowClick,
}: VirtualizedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  })

  return (
    <div
      ref={parentRef}
      className={cn('h-[400px] overflow-auto', className)}
    >
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-background">
          <tr className="border-b bg-muted/50">
            {columns.map((column) => (
              <th
                key={String(column.accessorKey)}
                className={cn(
                  'px-4 py-3 text-left text-sm font-medium',
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = data[virtualRow.index]
            return (
              <tr
                key={virtualRow.index}
                className={cn(
                  'border-b',
                  onRowClick && 'cursor-pointer hover:bg-muted/50'
                )}
                onClick={() => onRowClick?.(row)}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.accessorKey)}
                    className={cn('px-4 py-3 text-sm', column.className)}
                  >
                    {column.cell
                      ? column.cell(row[column.accessorKey], row)
                      : String(row[column.accessorKey])}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}