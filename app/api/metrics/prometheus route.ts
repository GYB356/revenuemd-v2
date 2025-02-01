import { NextResponse } from "next/server"

export async function GET() {
  const url = process.env.PROMETHEUS_URL
  const token = process.env.PROMETHEUS_TOKEN

  if (!url || !token) {
    return NextResponse.json({ error: "Missing Prometheus configuration" }, { status: 500 })
  }

  try {
    const queryUrl = `${url}/api/v1/query`
    const query = "up" // Simple query to check if Prometheus is up

    const response = await fetch(`${queryUrl}?query=${encodeURIComponent(query)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Prometheus Error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching Prometheus metrics:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
