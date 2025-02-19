'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { AdvancedChart } from '@/components/charts/advanced-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RecentActivity } from '@/components/recent-activity';
import { Users, DollarSign, FileCheck2, TrendingUp } from 'lucide-react';
import { Overview } from "@/components/dashboard/overview";
import { RecentClaims } from "@/components/dashboard/recent-claims";

export default async function DashboardPage() {
  // Your existing data fetching logic here
  const stats = {
    revenue: 45231.89,
    patients: 2047,
    claims: 189,
    successRate: 94.2
  };

  const overviewData = [
    { date: "Jan", revenue: 32000, claims: 145 },
    { date: "Feb", revenue: 35000, claims: 160 },
    { date: "Mar", revenue: 38000, claims: 170 },
    { date: "Apr", revenue: 42000, claims: 175 },
    { date: "May", revenue: 44000, claims: 180 },
    { date: "Jun", revenue: 45231, claims: 189 }
  ];

  const recentClaims = [
    {
      id: "1",
      patientName: "John Doe",
      amount: 520.50,
      status: "APPROVED" as const,
      timestamp: new Date(2025, 1, 18)
    },
    {
      id: "2",
      patientName: "Jane Smith",
      amount: 750.00,
      status: "PENDING" as const,
      timestamp: new Date(2025, 1, 17)
    },
    {
      id: "3",
      patientName: "Mike Johnson",
      amount: 325.75,
      status: "APPROVED" as const,
      timestamp: new Date(2025, 1, 16)
    },
    {
      id: "4",
      patientName: "Sarah Williams",
      amount: 890.25,
      status: "DENIED" as const,
      timestamp: new Date(2025, 1, 15)
    }
  ];

  return (
    <div className="space-y-4 p-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.patients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.claims}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Overview data={overviewData} />
        <RecentClaims claims={recentClaims} />
      </div>
    </div>
  );
}