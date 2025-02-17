import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"

interface Log {
  id: string
  action: string
  details: any
  createdAt: string
  user: {
    name: string
    email: string
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export function UserActivityTable() {
  const [page, setPage] = useState(1)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  const { data, isLoading, error } = useQuery({
    queryKey: ['userActivity', page, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      })
      
      const response = await fetch(`/api/logs/user-activity?${params}`)
      if (!response.ok) throw new Error('Failed to fetch logs')
      return response.json()
    }
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading logs</div>

  const logs: Log[] = data?.logs || []
  const pagination: PaginationInfo = data?.pagination

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-4">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                {format(new Date(log.createdAt), 'PPpp')}
              </TableCell>
              <TableCell>{log.user.name}</TableCell>
              <TableCell>{log.action}</TableCell>
              <TableCell>
                {typeof log.details === 'object' 
                  ? JSON.stringify(log.details)
                  : log.details}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center mt-4">
        <Button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span>
          Page {page} of {pagination?.pages || 1}
        </span>
        <Button
          onClick={() => setPage(p => p + 1)}
          disabled={page >= (pagination?.pages || 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
} 