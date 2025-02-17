"use client"

import { DataTable } from "@/components/ui/table"
import type { Patient } from "@/types/table"
import { format } from "date-fns"

const patients: Patient[] = [
  {
    id: "1",
    name: "John Doe",
    dateOfBirth: new Date("1990-01-01"),
    gender: "male",
    contactInfo: "+1234567890",
    medicalHistory: ["Hypertension", "Diabetes"],
  },
  // Add more patient data as needed
]

const columns = [
  { key: "name", label: "Name" },
  {
    key: "dateOfBirth",
    label: "Date of Birth",
    render: (value: Date) => format(new Date(value), "PP"),
  },
  { key: "gender", label: "Gender" },
  { key: "contactInfo", label: "Contact" },
  {
    key: "medicalHistory",
    label: "Medical History",
    render: (value: string[]) => value.join(", "),
  },
]

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Patients</h1>
      <DataTable data={patients} columns={columns} />
    </div>
  )
}

