export { getPatientInsights } from './patient'
export { getClaimsInsights } from './claims'
export { getTrendsInsights } from './trends'
export * from './utils'

export type TimeframeType = 'WEEK' | 'MONTH' | 'YEAR'

export interface HealthMetrics {
  activeConditions: number
  activeMedications: number
  allergies: number
  lastCheckup?: Date
}

export interface ClaimsAnalysis {
  totalClaims: number
  approvedClaims: number
  deniedClaims: number
  totalAmount: number
}

export interface PatientInsights {
  healthMetrics: HealthMetrics
  claimsAnalysis: ClaimsAnalysis
  riskScore: number
}

export interface ClaimsInsights {
  totalClaims: number
  approvalRate: number
  averageAmount: number
  byStatus: Record<string, number>
  byProvider: Record<string, {
    count: number
    amount: number
    approvalRate: number
  }>
  trends: {
    monthly: Array<{
      month: string
      count: number
      amount: number
      approvalRate: number
    }>
  }
}

export interface TrendsInsights {
  patientGrowth: number
  revenueGrowth: number
  demographics: {
    byGender: Record<string, number>
    byAgeGroup: Record<string, number>
  }
  claimsTrends: Array<{
    period: string
    claims: number
    revenue: number
  }>
  topProcedures: Array<{
    name: string
    count: number
    revenue: number
  }>
} 