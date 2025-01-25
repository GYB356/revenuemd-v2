"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { createClient } from "@/lib/supabase-client"

interface OutcomeData {
  date: string
  score: number
  treatment: string
  patientId: string
}

export function PatientOutcomes() {
  const [outcomeData, setOutcomeData] = useState<OutcomeData[]>([])
  const [selectedTreatment, setSelectedTreatment] = useState<string>("All")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchOutcomeData() {
      try {
        const { data, error } = await supabase.from("patient_outcomes").select("*").order("date", { ascending: true })

        if (error) throw error
        setOutcomeData(data)
      } catch (error) {
        console.error("Error fetching patient outcome data:", error)
        setError("Failed to load patient outcome data")
      } finally {
        setLoading(false)
      }
    }

    fetchOutcomeData()
  }, [supabase])

  const treatments = ["All", ...new Set(outcomeData.map((item) => item.treatment))]

  const filteredData =
    selectedTreatment === "All" ? outcomeData : outcomeData.filter((item) => item.treatment === selectedTreatment)

  const averageScoreByTreatment = treatments
    .filter((treatment) => treatment !== "All")
    .map((treatment) => {
      const treatmentData = outcomeData.filter((item) => item.treatment === treatment)
      const averageScore = treatmentData.reduce((sum, item) => sum + item.score, 0) / treatmentData.length
      return { treatment, averageScore }
    })

  if (loading) return <div>Loading patient outcomes...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Patient Outcomes Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={selectedTreatment} onValueChange={setSelectedTreatment}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Treatment" />
              </SelectTrigger>
              <SelectContent>
                {treatments.map((treatment) => (
                  <SelectItem key={treatment} value={treatment}>
                    {treatment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#8884d8" name="Outcome Score" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Average Outcome Score by Treatment</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={averageScoreByTreatment}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="treatment" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="averageScore" fill="#82ca9d" name="Average Score" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

