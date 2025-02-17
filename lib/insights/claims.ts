import { prisma } from "@/lib/db"
import type { ClaimsInsights } from "./index"

export async function getClaimsInsights(): Promise<ClaimsInsights> {
  // Get all claims with their associated data
  const claims = await prisma.claim.findMany({
    include: {
      patient: {
        select: {
          name: true,
          contactInfo: true,
        },
      },
    },
  })

  // Calculate total claims and average amount
  const totalClaims = claims.length
  const totalAmount = claims.reduce((sum, claim) => sum + Number(claim.amount), 0)
  const averageAmount = totalAmount / totalClaims

  // Calculate approval rate
  const approvedClaims = claims.filter(c => c.status === 'APPROVED')
  const approvalRate = totalClaims > 0 ? approvedClaims.length / totalClaims : 0

  // Group claims by status
  const byStatus = claims.reduce((acc, claim) => {
    acc[claim.status] = (acc[claim.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Group claims by provider
  const byProvider = claims.reduce((acc, claim) => {
    // Extract provider from procedure codes or use "Unknown"
    const provider = claim.procedureCodes[0]?.split('-')[0] || 'Unknown'
    
    if (!acc[provider]) {
      acc[provider] = {
        count: 0,
        amount: 0,
        approvedCount: 0,
      }
    }

    acc[provider].count++
    acc[provider].amount += Number(claim.amount)
    if (claim.status === 'APPROVED') {
      acc[provider].approvedCount++
    }

    return acc
  }, {} as Record<string, { count: number; amount: number; approvedCount: number }>)

  // Calculate provider approval rates
  const providerStats = Object.entries(byProvider).reduce((acc, [provider, stats]) => {
    acc[provider] = {
      count: stats.count,
      amount: stats.amount,
      approvalRate: stats.count > 0 ? stats.approvedCount / stats.count : 0,
    }
    return acc
  }, {} as Record<string, { count: number; amount: number; approvalRate: number }>)

  // Calculate monthly trends
  const monthlyTrends = claims.reduce((acc, claim) => {
    const month = new Date(claim.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' })
    
    if (!acc[month]) {
      acc[month] = {
        count: 0,
        amount: 0,
        approvedCount: 0,
      }
    }

    acc[month].count++
    acc[month].amount += Number(claim.amount)
    if (claim.status === 'APPROVED') {
      acc[month].approvedCount++
    }

    return acc
  }, {} as Record<string, { count: number; amount: number; approvedCount: number }>)

  // Format monthly trends for response
  const trends = {
    monthly: Object.entries(monthlyTrends)
      .map(([month, stats]) => ({
        month,
        count: stats.count,
        amount: stats.amount,
        approvalRate: stats.count > 0 ? stats.approvedCount / stats.count : 0,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-12), // Last 12 months
  }

  return {
    totalClaims,
    approvalRate,
    averageAmount,
    byStatus,
    byProvider: providerStats,
    trends,
  }
} 