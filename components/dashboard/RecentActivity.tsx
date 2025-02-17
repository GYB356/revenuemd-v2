'use client'

import { Card } from "@/components/ui/card"

type Activity = {
  id: string
  type: 'patient_created' | 'claim_submitted' | 'claim_updated'
  description: string
  timestamp: string
}

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'patient_created',
    description: 'New patient John Doe registered',
    timestamp: '2024-02-15T10:30:00Z'
  },
  {
    id: '2',
    type: 'claim_submitted',
    description: 'Claim #1234 submitted for patient Jane Smith',
    timestamp: '2024-02-15T10:15:00Z'
  },
  // Add more mock activities...
]

export function RecentActivity() {
  return (
    <div className="space-y-4">
      {mockActivities.map((activity) => (
        <Card key={activity.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{activity.description}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(activity.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
} 