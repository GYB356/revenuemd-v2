import { NextResponse } from "next/server"
import { getAverageClaimAmount } from "@/lib/analytics"
import { verifyAuth } from "@/lib/auth"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const value = await getAverageClaimAmount()
    return NextResponse.json({ value })
  } catch (error) {
    console.error("Failed to get average claim amount:", error)
    return NextResponse.json(
      { error: "Failed to get average claim amount" },
      { status: 500 }
    )
  }
}