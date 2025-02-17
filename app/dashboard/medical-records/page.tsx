'use client'

import { useEffect, useState } from "react"
import { MedicalRecordsTable } from "./components/medical-records-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function MedicalRecordsPage() {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadMedicalRecords()
  }, [])

  const loadMedicalRecords = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/medical-records")
      if (!response.ok) throw new Error("Failed to load medical records")
      const data = await response.json()
      setData(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load medical records",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medical Records</h1>
          <p className="text-muted-foreground">
            View and manage patient medical records
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading medical records...</p>
          </div>
        </div>
      ) : (
        <MedicalRecordsTable data={data} />
      )}
    </div>
  )
} 