'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface PatientData {
  totalPatients: number
  activePatients: number
  demographics: {
    byGender: {
      MALE: number
      FEMALE: number
      OTHER: number
    }
    byAgeGroup: {
      '0-17': number
      '18-30': number
      '31-50': number
      '51-70': number
      '71+': number
    }
  }
  growthTrend: Array<{
    month: string
    newPatients: number
    totalPatients: number
  }>
}

export function PatientAnalytics() {
  const [data, setData] = useState<PatientData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadPatientData()
  }, [])

  const loadPatientData = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API endpoint
      // For now, using mock data
      const mockData: PatientData = {
        totalPatients: 1250,
        activePatients: 980,
        demographics: {
          byGender: {
            MALE: 600,
            FEMALE: 625,
            OTHER: 25,
          },
          byAgeGroup: {
            '0-17': 150,
            '18-30': 300,
            '31-50': 400,
            '51-70': 300,
            '71+': 100,
          },
        },
        growthTrend: [
          { month: 'Jan', newPatients: 45, totalPatients: 1000 },
          { month: 'Feb', newPatients: 52, totalPatients: 1052 },
          { month: 'Mar', newPatients: 48, totalPatients: 1100 },
          { month: 'Apr', newPatients: 55, totalPatients: 1155 },
          { month: 'May', newPatients: 60, totalPatients: 1215 },
          { month: 'Jun', newPatients: 35, totalPatients: 1250 },
        ],
      }

      setData(mockData)
    } catch (error) {
      console.error('Failed to load patient data:', error)
      toast({
        title: "Error",
        description: "Failed to load patient data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading patient data...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const GENDER_COLORS = ['#2196F3', '#E91E63', '#9C27B0']
  const genderData = [
    { name: 'Male', value: data.demographics.byGender.MALE },
    { name: 'Female', value: data.demographics.byGender.FEMALE },
    { name: 'Other', value: data.demographics.byGender.OTHER },
  ]

  const ageGroupData = Object.entries(data.demographics.byAgeGroup).map(([range, count]) => ({
    range,
    count,
  }))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Total Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalPatients.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Active Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.activePatients.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Patient Growth Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((data.growthTrend[data.growthTrend.length - 1].newPatients / data.totalPatients) * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={GENDER_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Age Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageGroupData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4CAF50" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Growth Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.growthTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="newPatients" fill="#2196F3" name="New Patients" />
                <Bar yAxisId="right" dataKey="totalPatients" fill="#4CAF50" name="Total Patients" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 