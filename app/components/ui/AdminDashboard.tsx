"use client"

import { useState } from "react"
import useSWR from "swr"
import Table from "./Table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminDashboard() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")

  const fetcher = (url: string) => fetch(url).then((res) => res.json())

  const { data: users, error: usersError } = useSWR("/api/users", fetcher)
  const { data: claimsData, error: claimsError } = useSWR(
    `/api/claims?page=${page}&status=${status || ""}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
    fetcher,
  )

  console.log("Users data:", users)
  console.log("Claims data:", claimsData)
  console.log("Users error:", usersError)
  console.log("Claims error:", claimsError)

  if (usersError || claimsError) return <div>Failed to load</div>
  if ((!users || users.length === 0) && (!claimsData || !claimsData.claims || claimsData.claims.length === 0)) {
    return <div>No data available</div>
  }
  if (!users || !claimsData) return <div>Loading...</div>

  const { claims, totalPages, currentPage } = claimsData

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Users</h2>
          <Table
            data={users}
            columns={[
              { key: "id", label: "ID" },
              { key: "username", label: "Username" },
              { key: "email", label: "Email" },
              { key: "role", label: "Role" },
            ]}
          />
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Claims</h2>
          <div className="mb-4 flex space-x-4">
            <Select value={status || "all"} onValueChange={(value) => setStatus(value === "all" ? null : value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="DENIED">Denied</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Created</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger>
                <SelectValue placeholder="Sort Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table
            data={claims}
            columns={[
              { key: "id", label: "ID" },
              { key: "amount", label: "Amount" },
              { key: "status", label: "Status" },
              { key: "isFraudulent", label: "Fraudulent?" },
              { key: "patient.name", label: "Patient Name" },
            ]}
          />
          <div className="mt-4 flex justify-between">
            <Button onClick={() => setPage(page - 1)} disabled={page === 1}>
              Previous
            </Button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <Button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

