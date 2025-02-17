import React, { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { verifyAuth } from "@/lib/auth"

interface Claim {
  id: string
  patientId: string
  amount: number
  status: "PENDING" | "APPROVED" | "DENIED"
  createdAt: string
  updatedAt: string
}

interface ClaimsTableProps {
  patientId: string
}

export function ClaimsTable({ patientId }: ClaimsTableProps) {
  const [claims, setClaims] = useState<Claim[]>([])
  const [selectedClaims, setSelectedClaims] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadClaims()
    checkAuth()
  }, [patientId])

  const checkAuth = async () => {
    const userData = await verifyAuth()
    setUser(userData)
  }

  const loadClaims = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/claims?patientId=${patientId}`)
      if (!response.ok) throw new Error("Failed to fetch claims")

      const data = await response.json()
      setClaims(data.claims)
    } catch (error) {
      setError("Failed to load claims")
      if (retryCount < 3) {
        toast({
          title: "Retrying...",
          description: "Attempting to reconnect",
        })
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
          loadClaims()
        }, Math.pow(2, retryCount) * 1000)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBulkUpdate = async (newStatus: string) => {
    try {
      const response = await fetch("/api/claims", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimIds: selectedClaims,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.error === "Unauthorized") {
          toast({
            title: "Session expired",
            description: "Please log in again",
            variant: "destructive",
          })
          return
        }
        throw new Error(data.error)
      }

      await loadClaims()
      setSelectedClaims([])
      toast({
        title: "Success",
        description: `${selectedClaims.length} claims updated successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update claims",
        variant: "destructive",
      })
    }
  }

  if (loading) return <div>Loading claims...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {user?.role === "ADMIN" && selectedClaims.length > 0 && (
        <div className="mb-4 flex gap-2">
          <Button onClick={() => handleBulkUpdate("APPROVED")}>
            Approve Selected
          </Button>
          <Button onClick={() => handleBulkUpdate("DENIED")}>
            Deny Selected
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                checked={selectedClaims.length === claims.length}
                onCheckedChange={(checked) => {
                  setSelectedClaims(checked ? claims.map(c => c.id) : [])
                }}
              />
            </TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {claims.map((claim) => (
            <TableRow key={claim.id}>
              <TableCell>
                <Checkbox
                  checked={selectedClaims.includes(claim.id)}
                  onCheckedChange={(checked) => {
                    setSelectedClaims(prev =>
                      checked
                        ? [...prev, claim.id]
                        : prev.filter(id => id !== claim.id)
                    )
                  }}
                />
              </TableCell>
              <TableCell>{claim.id}</TableCell>
              <TableCell>{formatCurrency(claim.amount)}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    claim.status === "APPROVED"
                      ? "success"
                      : claim.status === "DENIED"
                      ? "destructive"
                      : "default"
                  }
                >
                  {claim.status}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(claim.createdAt)}</TableCell>
              <TableCell>{formatDate(claim.updatedAt)}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  onClick={() => window.location.href = `/claims/${claim.id}`}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {user?.role === "ADMIN" && (
        <Button
          className="mt-4"
          onClick={() => window.location.href = "/analytics"}
        >
          View Detailed Analytics
        </Button>
      )}
    </div>
  )
} 