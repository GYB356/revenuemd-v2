import { Button } from "@/components/ui/button"
import { MoreHorizontal, FileText } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

export type MedicalRecordRow = {
  patientId: string
  patientName: string
  dateOfBirth: string
  lastUpdated: string
  conditions: Array<{
    name: string
    status: 'active' | 'resolved'
  }>
  medications: Array<{
    name: string
    dosage: string
  }>
}

export const columns = [
  {
    accessorKey: "patientName",
    header: "Patient Name",
  },
  {
    accessorKey: "dateOfBirth",
    header: "Date of Birth",
    cell: ({ row }) => formatDate(row.original.dateOfBirth),
  },
  {
    accessorKey: "conditions",
    header: "Active Conditions",
    cell: ({ row }) => {
      const activeConditions = row.original.conditions.filter(
        (c) => c.status === "active"
      )
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
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.medications.map((med, index) => (
          <Badge key={index} variant="outline">
            {med.name} ({med.dosage})
          </Badge>
        ))}
      </div>
    ),
  },
  {
    accessorKey: "lastUpdated",
    header: "Last Updated",
    cell: ({ row }) => formatDate(row.original.lastUpdated),
  },
  {
    id: "actions",
    cell: ({ row }) => {
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
              onClick={() => navigator.clipboard.writeText(row.original.patientId)}
            >
              Copy patient ID
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => window.location.href = `/dashboard/medical-records/${row.original.patientId}`}
            >
              <FileText className="mr-2 h-4 w-4" />
              View full record
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 