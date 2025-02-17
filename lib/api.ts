import { prisma } from "@/lib/db"
import { Decimal } from '@prisma/client/runtime/library'

interface GetPatientsParams {
  page?: number
  limit?: number
  search?: string
  gender?: string
  startDate?: string
  endDate?: string
}

export interface GetClaimsParams {
  page?: number
  limit?: number
  status?: string
  patientId?: string
  sortBy?: keyof Claim
  sortDirection?: 'asc' | 'desc'
  dateRange?: string
  minAmount?: string
  maxAmount?: string
  searchTerm?: string
}

export interface Claim {
  id: string
  patientId: string
  amount: number
  status: 'PENDING' | 'APPROVED' | 'DENIED'
  createdAt: string
  updatedAt: string
  procedureCodes: string[]
  diagnosisCodes: string[]
  notes: string | undefined
  creator?: {
    id: string
    name: string | null
    email: string
  }
  patient?: {
    id: string
    name: string
  }
  isFraudulent?: boolean
  fraudCheckDetails?: Record<string, any> | null
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
  }
}

export async function getPatients({
  page = 1,
  limit = 10,
  search,
  gender,
  startDate,
  endDate,
}: GetPatientsParams) {
  const skip = (page - 1) * limit

  const where = {
    ...(search && {
      OR: [
        { 
          name: { 
            contains: search,
            mode: 'insensitive' as const
          } 
        },
        { 
          contactInfo: { 
            contains: search,
            mode: 'insensitive' as const 
          } 
        },
      ],
    }),
    ...(gender && { gender: gender as "MALE" | "FEMALE" | "OTHER" }),
    ...(startDate && endDate && {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    }),
  }

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      select: {
        id: true,
        name: true,
        dateOfBirth: true,
        gender: true,
        contactInfo: true,
        createdAt: true,
        _count: {
          select: { claims: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.patient.count({ where }),
  ])

  return {
    patients,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      perPage: limit,
    },
  }
}

export async function getClaims(params: GetClaimsParams): Promise<PaginatedResponse<Claim>> {
  const queryParams = new URLSearchParams({
    page: params.page?.toString() || '1',
    limit: params.limit?.toString() || '10',
    ...(params.status && { status: params.status }),
    ...(params.patientId && { patientId: params.patientId }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortDirection && { sortDirection: params.sortDirection }),
    ...(params.dateRange && { dateRange: params.dateRange }),
    ...(params.minAmount && { minAmount: params.minAmount }),
    ...(params.maxAmount && { maxAmount: params.maxAmount }),
    ...(params.searchTerm && { searchTerm: params.searchTerm }),
  })

  const response = await fetch('/api/claims?' + queryParams)

  if (!response.ok) {
    throw new Error('Failed to fetch claims')
  }

  const data = await response.json()

  // Convert Decimal to number for client-side use and handle null notes
  return {
    data: data.claims.map((claim: any) => ({
      ...claim,
      amount: Number(claim.amount),
      createdAt: claim.createdAt.toString(),
      updatedAt: claim.updatedAt.toString(),
      notes: claim.notes || undefined,
      creator: claim.creator ? {
        id: claim.creator.id,
        name: claim.creator.name || null,
        email: claim.creator.email,
      } : undefined,
      patient: claim.patient ? {
        id: claim.patient.id,
        name: claim.patient.name,
      } : undefined,
    })),
    pagination: data.pagination,
  }
} 