import { NextResponse } from "next/server"

export async function GET() {
  console.log("InfluxDB API route called")

  const url = process.env.INFLUXDB_URL
  const org = process.env.INFLUXDB_ORG
  const bucket = process.env.INFLUXDB_BUCKET
  const token = process.env.INFLUXDB_TOKEN

  console.log("InfluxDB configuration:", { url, org, bucket, tokenExists: !!token })

  if (!url || !org || !bucket || !token) {
    console.error("Missing InfluxDB configuration")
    return NextResponse.json({ error: "Missing InfluxDB configuration" }, { status: 500 })
  }

  try {
    console.log("Preparing InfluxDB query")
    const queryUrl = `${url}/api/v2/query?org=${org}`
    const query = `
      from(bucket:"${bucket}")
        |> range(start: -5m)
        |> filter(fn: (r) => r._measurement == "system_metrics")
        |> last()
    `

    console.log("Sending request to InfluxDB")
    const response = await fetch(queryUrl, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/vnd.flux",
        Accept: "application/csv",
      },
      body: query,
    })

    console.log("InfluxDB response status:", response.status)

    if (!response.ok) {
      console.error("InfluxDB Error:", response.status, response.statusText)
      throw new Error(`InfluxDB Error: ${response.status}`)
    }

    const data = await response.text()
    console.log("InfluxDB data received:", data.substring(0, 200) + "...") // Log first 200 characters

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error in InfluxDB API route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

