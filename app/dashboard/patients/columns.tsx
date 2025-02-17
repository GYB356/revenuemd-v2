import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { formatDate } from "@/lib/utils"

export type Patient = {
  id: string
  name: string
  dateOfBirth: string
  gender: "MALE" | "FEMALE" | "OTHER"
  contactInfo: string
  createdAt: string
  _count: {
    claims: number
  }
}

interface TableRow {
  row: Patient
}

export const columns = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "dateOfBirth",
    header: "Date of Birth",
    cell: ({ row }: TableRow) => formatDate(row.dateOfBirth),
  },
  {
    accessorKey: "gender",
    header: "Gender",
  },
  {
    accessorKey: "contactInfo",
    header: "Contact Info",
  },
  {
    accessorKey: "_count.claims",
    header: "Total Claims",
    cell: ({ row }: TableRow) => row._count.claims,
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }: TableRow) => formatDate(row.createdAt),
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
              Copy patient ID
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => window.location.href = `/dashboard/patients/${row.id}`}
            >
              View details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 