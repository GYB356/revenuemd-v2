import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { ExportButtons } from "@/components/ExportButtons"
import { columns } from "./columns"
import { getPatients } from "@/lib/api"

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const page = Number(searchParams.page) || 1
  const limit = Number(searchParams.limit) || 10
  const search = searchParams.search?.toString()
  const gender = searchParams.gender?.toString()
  const startDate = searchParams.startDate?.toString()
  const endDate = searchParams.endDate?.toString()

  const { patients, pagination } = await getPatients({
    page,
    limit,
    search,
    gender,
    startDate,
    endDate,
  })

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Patient Management</h1>
        <ExportButtons type="patients" />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search and Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder="Search patients..."
              defaultValue={search}
              onChange={(e) => {
                const searchParams = new URLSearchParams(window.location.search)
                searchParams.set("search", e.target.value)
                window.history.pushState(null, "", `?${searchParams.toString()}`)
              }}
            />
            <Select
              defaultValue={gender}
              onValueChange={(value) => {
                const searchParams = new URLSearchParams(window.location.search)
                searchParams.set("gender", value)
                window.history.pushState(null, "", `?${searchParams.toString()}`)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Start Date"
              defaultValue={startDate}
              onChange={(e) => {
                const searchParams = new URLSearchParams(window.location.search)
                searchParams.set("startDate", e.target.value)
                window.history.pushState(null, "", `?${searchParams.toString()}`)
              }}
            />
            <Input
              type="date"
              placeholder="End Date"
              defaultValue={endDate}
              onChange={(e) => {
                const searchParams = new URLSearchParams(window.location.search)
                searchParams.set("endDate", e.target.value)
                window.history.pushState(null, "", `?${searchParams.toString()}`)
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Suspense fallback={<div className="p-4">Loading patients...</div>}>
            <DataTable
              columns={columns}
              data={patients}
              pagination={pagination}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
} 