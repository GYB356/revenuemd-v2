import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import type { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
      include: {
        claims: true,
      },
    })

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    return NextResponse.json(patient)
  } catch (error) {
    console.error("Failed to fetch patient:", error)
    return NextResponse.json(
      { error: "Failed to fetch patient" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const patient = await prisma.patient.update({
      where: { id: params.id },
      data: {
        name: body.firstName + " " + body.lastName,
        dateOfBirth: new Date(body.dateOfBirth),
        gender: body.gender,
        contactInfo: JSON.stringify({
          email: body.email,
          phone: body.phone,
          address: body.address,
        }),
      },
    })

    return NextResponse.json(patient)
  } catch (error) {
    console.error("Failed to update patient:", error)
    return NextResponse.json(
      { error: "Failed to update patient" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.patient.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete patient:", error)
    return NextResponse.json(
      { error: "Failed to delete patient" },
      { status: 500 }
    )
  }
} 