import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import type { NextRequest } from "next/server"
import { generateCSV, getContentDisposition } from "@/lib/export"

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const format = request.nextUrl.searchParams.get('format') || 'json'
    
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        name: true,
        dateOfBirth: true,
        gender: true,
        contactInfo: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (format === 'csv') {
      const fields = ['id', 'name', 'dateOfBirth', 'gender', 'contactInfo', 'createdAt', 'updatedAt']
      const csv = await generateCSV(patients, fields)
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': getContentDisposition('patients', 'csv')
        }
      })
    }

    return NextResponse.json(patients)
  } catch (error) {
    console.error("Failed to export patients:", error)
    return NextResponse.json(
      { error: "Failed to export patients" },
      { status: 500 }
    )
  }
}