// This file should be updated with the latest InfluxDB and Prometheus integration
import { NextResponse } from "next/server"

export async function GET() {
  const influxUrl = process.env.INFLUXDB_URL
  const influxOrg = process.env.INFLUXDB_ORG
  const influxBucket = process.env.INFLUXDB_BUCKET
  const influxToken = process.env.INFLUXDB_TOKEN
  const prometheusUrl = process.env.PROMETHEUS_URL
  const prometheusToken = process.env.PROMETHEUS_TOKEN

  if (!influxUrl || !influxOrg || !influxBucket || !influxToken || !prometheusUrl || !prometheusToken) {
    console.error("Missing InfluxDB or Prometheus environment variables")
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  try {
    // InfluxDB query
    const influxQueryUrl = `${influxUrl}/api/v2/query?org=${influxOrg}`
    const influxQuery = `
      from(bucket:"${influxBucket}")
        |> range(start: -5m)
        |> filter(fn: (r) => r._measurement == "system_metrics" or r._measurement == "app_metrics")
        |> group(columns: ["_measurement", "_field"])
        |> last()
    `

    const influxResponse = await fetch(influxQueryUrl, {
      method: "POST",
      headers: {
        Authorization: `Token ${influxToken}`,
        "Content-Type": "application/vnd.flux",
        Accept: "application/csv",
      },
      body: influxQuery,
    })

    if (!influxResponse.ok) {
      throw new Error(`InfluxDB Error: ${influxResponse.status}`)
    }

    const influxData = await influxResponse.text()

    // Prometheus query
    const prometheusQueryUrl = `${prometheusUrl}/api/v1/query`
    const prometheusQuery = "up" // Simple query to check if Prometheus is up

    const prometheusResponse = await fetch(`${prometheusQueryUrl}?query=${encodeURIComponent(prometheusQuery)}`, {
      headers: {
        Authorization: `Bearer ${prometheusToken}`,
      },
    })

    if (!prometheusResponse.ok) {
      throw new Error(`Prometheus Error: ${prometheusResponse.status}`)
    }

    const prometheusData = await prometheusResponse.json()

    // Combine and return data
    return NextResponse.json({
      influxData: influxData,
      prometheusData: prometheusData,
    })
  } catch (error) {
    console.error("Error in /api/metrics:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

