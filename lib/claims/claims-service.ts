import { prisma } from "@/lib/db"
import { checkClaimForFraud } from "./fraud-detection"
import { Claim, Prisma } from "@prisma/client"

// Define ClaimStatus enum since it's not exported from @prisma/client
export enum ClaimStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  DENIED = "DENIED"
}

export interface CreateClaimInput {
  amount: number
  procedureCodes: string[]
  diagnosisCodes: string[]
  notes?: string
  patientId: string
  createdBy: string
}

export interface UpdateClaimInput {
  amount?: number
  procedureCodes?: string[]
  diagnosisCodes?: string[]
  notes?: string
  status?: ClaimStatus
}

export interface ClaimFilters {
  status?: ClaimStatus
  patientId?: string
  createdBy?: string
  startDate?: Date
  endDate?: Date
  minAmount?: number
  maxAmount?: number
  isFraudulent?: boolean
}

export interface ClaimSortOptions {
  field: keyof Claim
  direction: 'asc' | 'desc'
}

export interface PaginationOptions {
  page: number
  limit: number
}

export interface ClaimStats {
  totalClaims: number
  pendingClaims: number
  approvedClaims: number
  deniedClaims: number
  totalAmount: number
  fraudulentClaims: number
  averageProcessingTime: number
}

export class ClaimsService {
  async createClaim(input: CreateClaimInput): Promise<Claim> {
    // Check for fraud
    const fraudCheck = await checkClaimForFraud(
      input.patientId,
      input.amount,
      input.procedureCodes,
      input.diagnosisCodes
    )

    const claim = await prisma.claim.create({
      data: {
        amount: new Prisma.Decimal(input.amount),
        procedureCodes: input.procedureCodes,
        diagnosisCodes: input.diagnosisCodes,
        notes: input.notes,
        patientId: input.patientId,
        createdBy: input.createdBy,
        isFraudulent: fraudCheck.isFraudulent,
        fraudCheckDetails: fraudCheck as unknown as Prisma.JsonValue,
        status: fraudCheck.isFraudulent ? ClaimStatus.DENIED : ClaimStatus.PENDING
      }
    })

    return claim
  }

  async updateClaim(id: string, input: UpdateClaimInput): Promise<Claim> {
    const claim = await prisma.claim.findUnique({
      where: { id }
    })

    if (!claim) {
      throw new Error(`Claim with id ${id} not found`)
    }

    // If amount or procedure codes changed, rerun fraud check
    const fraudCheck = (input.amount !== undefined || input.procedureCodes !== undefined)
      ? await checkClaimForFraud(
          claim.patientId,
          input.amount ?? Number(claim.amount),
          input.procedureCodes ?? claim.procedureCodes,
          input.diagnosisCodes ?? claim.diagnosisCodes
        )
      : null

    return prisma.claim.update({
      where: { id },
      data: {
        ...(input.amount && { amount: new Prisma.Decimal(input.amount) }),
        ...(input.procedureCodes && { procedureCodes: input.procedureCodes }),
        ...(input.diagnosisCodes && { diagnosisCodes: input.diagnosisCodes }),
        ...(input.notes && { notes: input.notes }),
        ...(input.status && { status: input.status }),
        ...(fraudCheck && {
          isFraudulent: fraudCheck.isFraudulent,
          fraudCheckDetails: fraudCheck as unknown as Prisma.JsonValue
        })
      }
    })
  }

  async getClaim(id: string): Promise<Claim | null> {
    return prisma.claim.findUnique({
      where: { id }
    })
  }

  async getClaims(
    filters: ClaimFilters,
    sort: ClaimSortOptions,
    pagination: PaginationOptions
  ): Promise<{ claims: Claim[], total: number }> {
    const where: Prisma.ClaimWhereInput = {
      ...(filters.status && { status: filters.status }),
      ...(filters.patientId && { patientId: filters.patientId }),
      ...(filters.createdBy && { createdBy: filters.createdBy }),
      ...(filters.startDate && { createdAt: { gte: filters.startDate } }),
      ...(filters.endDate && { createdAt: { lte: filters.endDate } }),
      ...(filters.minAmount && { amount: { gte: new Prisma.Decimal(filters.minAmount) } }),
      ...(filters.maxAmount && { amount: { lte: new Prisma.Decimal(filters.maxAmount) } }),
      ...(filters.isFraudulent !== undefined && { isFraudulent: filters.isFraudulent })
    }

    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        orderBy: { [sort.field]: sort.direction },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit
      }),
      prisma.claim.count({ where })
    ])

    return { claims, total }
  }

  async bulkUpdateClaimsStatus(
    ids: string[],
    status: ClaimStatus
  ): Promise<number> {
    const result = await prisma.claim.updateMany({
      where: { id: { in: ids } },
      data: { status }
    })

    return result.count
  }

  async deleteClaim(id: string): Promise<void> {
    await prisma.claim.delete({
      where: { id }
    })
  }

  async getClaimStats(startDate?: Date, endDate?: Date): Promise<ClaimStats> {
    const dateFilter = {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate })
    }

    const [
      totalClaims,
      pendingClaims,
      approvedClaims,
      deniedClaims,
      fraudulentClaims,
      amountStats
    ] = await Promise.all([
      prisma.claim.count({
        where: { createdAt: dateFilter }
      }),
      prisma.claim.count({
        where: { 
          status: ClaimStatus.PENDING,
          createdAt: dateFilter
        }
      }),
      prisma.claim.count({
        where: {
          status: ClaimStatus.APPROVED,
          createdAt: dateFilter
        }
      }),
      prisma.claim.count({
        where: {
          status: ClaimStatus.DENIED,
          createdAt: dateFilter
        }
      }),
      prisma.claim.count({
        where: {
          isFraudulent: true,
          createdAt: dateFilter
        }
      }),
      prisma.claim.aggregate({
        where: { createdAt: dateFilter },
        _sum: { amount: true }
      })
    ])

    return {
      totalClaims,
      pendingClaims,
      approvedClaims,
      deniedClaims,
      totalAmount: Number(amountStats._sum.amount || 0),
      fraudulentClaims,
      averageProcessingTime: 0 // Removed complex processing time calculation as it's not supported by Prisma
    }
  }
}

export const claimsService = new ClaimsService() 