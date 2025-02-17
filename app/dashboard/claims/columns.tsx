import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatCurrency } from "@/lib/utils"

export type Claim = {
  id: string
  patientId: string
  amount: number
  status: "PENDING" | "APPROVED" | "DENIED"
  createdAt: string
  updatedAt: string
  patient: {
    name: string
    contactInfo: string
  }
}

interface TableRow {
  row: Claim
}

export const columns = [
  {
    accessorKey: "patient.name",
    header: "Patient Name",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }: TableRow) => formatCurrency(row.amount),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: TableRow) => {
      const status = row.status
      return (
        <Badge
          variant={
            status === "APPROVED"
              ? "secondary"
              : status === "DENIED"
              ? "destructive"
              : "default"
          }
        >
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }: TableRow) => formatDate(row.createdAt),
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }: TableRow) => formatDate(row.updatedAt),
  },
  {
    id: "actions",
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }: TableRow) => {
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
              onClick={() => navigator.clipboard.writeText(row.id)}
            >
              Copy claim ID
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => window.location.href = `/dashboard/claims/${row.id}`}
            >
              View details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 