'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Column {
  accessorKey: string
  header: string
  cell?: (props: { row: any }) => React.ReactNode
}

interface Pagination {
  total: number
  pages: number
  currentPage: number
  perPage: number
}

interface DataTableProps {
  columns: Column[]
  data: any[]
  pagination: Pagination
}

export function DataTable({ columns, data, pagination }: DataTableProps) {
  const { currentPage, pages } = pagination

  const handlePageChange = (page: number) => {
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set("page", page.toString())
    window.history.pushState(null, "", `?${searchParams.toString()}`)
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.accessorKey}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column) => (
                <TableCell key={column.accessorKey}>
                  {column.cell
                    ? column.cell({ row })
                    : getNestedValue(row, column.accessorKey)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm">
          Page {currentPage} of {pages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= pages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Helper function to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj)
} 