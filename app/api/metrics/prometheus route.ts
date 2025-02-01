import { NextResponse } from "next/server"

export async function GET() {
  console.log("Prometheus API route called")

  const url = process.env.PROMETHEUS_URL
  const token = process.env.PROMETHEUS_TOKEN

  console.log("Prometheus configuration:", { url, tokenExists: !!token })

  if (!url || !token) {
    console.error("Missing Prometheus configuration")
    return NextResponse.json({ error: "Missing Prometheus configuration" }, { status: 500 })
  }

  try {
    console.log("Preparing Prometheus query")
    const queryUrl = `${url}/api/v1/query`
    const query = "up" // Simple query to check if Prometheus is up

    console.log("Sending request to Prometheus")
    const response = await fetch(`${queryUrl}?query=${encodeURIComponent(query)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    console.log("Prometheus response status:", response.status)

    if (!response.ok) {
      console.error("Prometheus Error:", response.status, response.statusText)
      throw new Error(`Prometheus Error: ${response.status}`)
    }

    const data = await response.json()
    console.log("Prometheus data received:", JSON.stringify(data).substring(0, 200) + "...") // Log first 200 characters

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error in Prometheus API route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

