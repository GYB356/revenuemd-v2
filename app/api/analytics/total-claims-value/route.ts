import { NextResponse } from "next/server"
import { getTotalClaimsValue } from "@/lib/analytics"
import { verifyAuth } from "@/lib/auth"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const value = await getTotalClaimsValue()
    return NextResponse.json({ value })
  } catch (error) {
    console.error("Failed to get total claims value:", error)
    return NextResponse.json(
      { error: "Failed to get total claims value" },
      { status: 500 }
    )
  }
}