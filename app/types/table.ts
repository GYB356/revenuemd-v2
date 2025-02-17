export interface User {
  id: string
  username: string
  email: string
  role: string
  createdAt: Date
  updatedAt: Date
}

export interface Patient {
  id: string
  name: string
  dateOfBirth: Date
  gender: string
  contactInfo: string
  medicalHistory: string[]
  summary?: string
  insights?: string
  createdAt: Date
  updatedAt: Date
}

export interface Claim {
  id: string
  amount: number
  status: string
  isFraudulent: boolean
  createdAt: Date
  updatedAt: Date
}

