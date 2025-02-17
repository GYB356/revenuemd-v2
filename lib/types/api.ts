 // Common API Response Types
export interface ApiResponse<T> {
    data: T
    success: boolean
    error?: string
    message?: string
  }
  
  export interface PaginatedResponse<T> extends ApiResponse<T> {
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
  
  // Claims Types
  export interface Claim {
    id: string
    patientId: string
    patientName: string
    amount: number
    status: ClaimStatus
    submittedDate: string
    insuranceProvider: string
    procedureCodes: string[]
    diagnosisCodes: string[]
    notes?: string
    createdAt: string
    updatedAt: string
  }
  
  export type ClaimStatus = 'PENDING' | 'APPROVED' | 'DENIED'
  
  export interface CreateClaimRequest {
    patientId: string
    amount: number
    insuranceProvider: string
    procedureCodes: string[]
    diagnosisCodes: string[]
    notes?: string
  }
  
  export interface ProcessClaimRequest {
    claimId: string
    status: Exclude<ClaimStatus, 'PENDING'>
    reason?: string
    processingNotes?: string
  }
  
  // Chart Data Types
  export interface ChartData {
    name: string
    value: number
    [key: string]: any
  }
  
  export interface ChartDataResponse extends ApiResponse<ChartData[]> {
    metadata?: {
      startDate: string
      endDate: string
      interval: string
    }
  }
  
  // WebSocket Types
  export interface WebSocketMessage<T = any> {
    type: 'update' | 'notification' | 'alert' | 'error'
    payload: T
    timestamp: string
  }
  
  export interface WebSocketError {
    code: string
    message: string
    details?: any
  }
  
  // Analytics Types
  export interface AnalyticsData {
    claims: {
      metrics: {
        totalClaims: number
        totalAmount: number
        approvalRate: number
      }
      trends: ChartData[]
    }
    patients: {
      totalPatients: number
      newPatients: number
      demographics: {
        ageGroups: Record<string, number>
        gender: Record<string, number>
        location: Record<string, number>
      }
    }
    trends: {
      patientGrowth: number
      revenueGrowth: number
      claimsGrowth: number
      trends: ChartData[]
    }
  }