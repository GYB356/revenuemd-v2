import { NextResponse } from "next/server"

export async function GET() {
  const url = process.env.INFLUXDB_URL
  const org = process.env.INFLUXDB_ORG
  const bucket = process.env.INFLUXDB_BUCKET
  const token = process.env.INFLUXDB_TOKEN

  if (!url || !org || !bucket || !token) {
    return NextResponse.json({ error: "Missing InfluxDB configuration" }, { status: 500 })
  }

  try {
    const queryUrl = `${url}/api/v2/query?org=${org}`
    const query = `
      from(bucket:"${bucket}")
        |> range(start: -5m)
        |> filter(fn: (r) => r._measurement == "system_metrics")
        |> last()
    `

    const response = await fetch(queryUrl, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/vnd.flux",
        Accept: "application/csv",
      },
      body: query,
    })

    if (!response.ok) {
      throw new Error(`InfluxDB Error: ${response.status}`)
    }

    const data = await response.text()
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching InfluxDB metrics:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
