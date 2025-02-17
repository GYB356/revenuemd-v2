import { prisma } from "@/lib/db";

export type TrendsInsights = {
  patientTrends: Array<{
    month: string;
    newPatients: number;
    totalPatients: number;
  }>;
  claimsTrends: Array<{
    period: string;
    claims: number;
    revenue: number;
  }>;
  revenueTrends: Array<{
    month: string;
    totalRevenue: number;
    averageClaimAmount: number;
  }>;
  patientGrowth: number;
  revenueGrowth: number;
  demographics: {
    byGender: Record<string, number>;
    byAgeGroup: Record<string, number>;
  };
  topProcedures: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
};

export async function getTrendsInsights(): Promise<TrendsInsights> {
  // Get all patients with their creation dates
  const patients = await prisma.patient.findMany({
    select: {
      createdAt: true,
      gender: true,
      dateOfBirth: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Get all claims with their dates and status
  const claims = await prisma.claim.findMany({
    select: {
      createdAt: true,
      status: true,
      amount: true,
      procedureCodes: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Get the date range (last 12 months)
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - 11);

  // Generate monthly data points
  const patientTrends: TrendsInsights["patientTrends"] = [];
  const claimsTrends: TrendsInsights["claimsTrends"] = [];
  const revenueTrends: TrendsInsights["revenueTrends"] = [];

  for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const monthKey = d.toISOString().substring(0, 7); // YYYY-MM format

    // Patient trends
    const newPatientsInMonth = patients.filter(
      (p) => p.createdAt >= monthStart && p.createdAt <= monthEnd
    ).length;
    const totalPatientsUpToMonth = patients.filter(
      (p) => p.createdAt <= monthEnd
    ).length;

    patientTrends.push({
      month: monthKey,
      newPatients: newPatientsInMonth,
      totalPatients: totalPatientsUpToMonth,
    });

    // Claims and revenue trends
    const monthClaims = claims.filter(
      (c) => c.createdAt >= monthStart && c.createdAt <= monthEnd
    );
    const monthRevenue = monthClaims.reduce((sum, claim) => sum + Number(claim.amount), 0);

    claimsTrends.push({
      period: monthKey,
      claims: monthClaims.length,
      revenue: monthRevenue,
    });

    revenueTrends.push({
      month: monthKey,
      totalRevenue: monthRevenue,
      averageClaimAmount: monthClaims.length > 0 ? monthRevenue / monthClaims.length : 0,
    });
  }

  // Calculate growth rates
  const patientGrowth = calculateGrowthRate(
    patientTrends[patientTrends.length - 1].newPatients,
    patientTrends[patientTrends.length - 2].newPatients
  );

  const revenueGrowth = calculateGrowthRate(
    revenueTrends[revenueTrends.length - 1].totalRevenue,
    revenueTrends[revenueTrends.length - 2].totalRevenue
  );

  // Calculate demographics
  const demographics = {
    byGender: patients.reduce((acc, patient) => {
      acc[patient.gender] = (acc[patient.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byAgeGroup: patients.reduce((acc, patient) => {
      const age = calculateAge(patient.dateOfBirth);
      const ageGroup = getAgeGroup(age);
      acc[ageGroup] = (acc[ageGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  // Calculate top procedures
  const procedureStats = claims.reduce((acc, claim) => {
    claim.procedureCodes.forEach(code => {
      if (!acc[code]) {
        acc[code] = { count: 0, revenue: 0 };
      }
      acc[code].count++;
      acc[code].revenue += Number(claim.amount);
    });
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>);

  const topProcedures = Object.entries(procedureStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    patientTrends,
    claimsTrends,
    revenueTrends,
    patientGrowth,
    revenueGrowth,
    demographics,
    topProcedures,
  };
}

function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
}

function getAgeGroup(age: number): string {
  if (age < 18) return '0-17';
  if (age < 31) return '18-30';
  if (age < 51) return '31-50';
  if (age < 71) return '51-70';
  return '71+';
}