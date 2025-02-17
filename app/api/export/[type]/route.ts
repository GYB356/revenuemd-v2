import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import type { NextRequest } from "next/server"
import { exportToCSV, exportToJSON } from "@/lib/export"

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "json"

    let data: any[] = []

    // Fetch data based on type
    if (params.type === "patients") {
      data = await prisma.patient.findMany({
        include: {
          _count: {
            select: { claims: true },
          },
        },
      })
    } else if (params.type === "claims") {
      data = await prisma.claim.findMany({
        include: {
          patient: {
            select: {
              name: true,
              contactInfo: true,
            },
          },
        },
      })
    } else {
      return NextResponse.json(
        { error: "Invalid export type" },
        { status: 400 }
      )
    }

    // Export data in requested format
    if (format === "csv") {
      const csv = await exportToCSV(data)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename=${params.type}-export.csv`,
        },
      })
    } else {
      const json = await exportToJSON(data)
      return new NextResponse(json, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename=${params.type}-export.json`,
        },
      })
    }
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    )
  }
} 