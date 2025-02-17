'use client'

import { useState } from "react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, FileText, Plus } from "lucide-react"
import { MedicalRecordDialog } from "./medical-record-dialog"
import { format } from "date-fns"

interface MedicalRecordRow {
  id: string
  patientId: string
  patientName: string
  dateOfBirth: string
  lastUpdated: string
  conditions: { name: string; status: "active" | "resolved" }[]
  medications: { name: string; dosage: string; frequency: string }[]
}

export const columns: ColumnDef<MedicalRecordRow>[] = [
  {
    accessorKey: "patientName",
    header: "Patient Name",
  },
  {
    accessorKey: "dateOfBirth",
    header: "Date of Birth",
    cell: ({ row }) => {
      return format(new Date(row.getValue("dateOfBirth")), "MMM d, yyyy")
    },
  },
  {
    accessorKey: "lastUpdated",
    header: "Last Updated",
    cell: ({ row }) => {
      return format(new Date(row.getValue("lastUpdated")), "MMM d, yyyy")
    },
  },
  {
    accessorKey: "conditions",
    header: "Active Conditions",
    cell: ({ row }) => {
      const conditions = row.getValue("conditions") as MedicalRecordRow["conditions"]
      const activeConditions = conditions.filter((c) => c.status === "active")
      return (
        <div className="flex flex-wrap gap-1">
          {activeConditions.map((condition, index) => (
            <Badge key={index} variant="secondary">
              {condition.name}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: "medications",
    header: "Current Medications",
    cell: ({ row }) => {
      const medications = row.getValue("medications") as MedicalRecordRow["medications"]
      return (
        <div className="flex flex-wrap gap-1">
          {medications.map((medication, index) => (
            <Badge key={index} variant="outline">
              {medication.name} ({medication.dosage})
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const record = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(record.id)}
            >
              Copy record ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit record</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

interface MedicalRecordsTableProps {
  data: MedicalRecordRow[]
}

export function MedicalRecordsTable({ data }: MedicalRecordsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filter patients..."
          value={(table.getColumn("patientName")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("patientName")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Medical Record
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>

      <MedicalRecordDialog
        isOpen={dialogOpen}
        patientId={selectedPatientId}
        onClose={(success) => {
          setDialogOpen(false)
          setSelectedPatientId(null)
          // TODO: Refresh data if success is true
        }}
      />
    </div>
  )
} 