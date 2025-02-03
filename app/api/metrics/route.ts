import { NextResponse } from "next/server";
import { InfluxDB } from "@influxdata/influxdb-client";
import Redis from "ioredis";

const influxToken = process.env.INFLUXDB_TOKEN;
const influxOrg = process.env.INFLUXDB_ORG;
const influxBucket = process.env.INFLUXDB_BUCKET;
const influxUrl = process.env.INFLUXDB_URL;
const redisUrl = process.env.REDIS_URL;

if (!influxToken || !influxOrg || !influxBucket || !influxUrl || !redisUrl) {
  throw new Error("Missing required environment variables for InfluxDB or Redis.");
}

// Initialize Redis connection
const redis = new Redis(redisUrl);

export async function GET() {
  try {
    const cacheKey = "metrics_data";
    
    // 1. **Check Redis Cache First**
    const cachedMetrics = await redis.get(cacheKey);
    if (cachedMetrics) {
      return NextResponse.json({ success: true, metrics: JSON.parse(cachedMetrics) });
    }

    // 2. **Query InfluxDB**
    const queryApi = new InfluxDB({ url: influxUrl, token: influxToken }).getQueryApi(influxOrg);
    const fluxQuery = `
      from(bucket: "${influxBucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r._measurement == "system_metrics")
    `;

    const data: Array<{ timestamp: string; metric: string; value: number; unit?: string }> = [];

    await queryApi.collectRows(fluxQuery, (row) => {
      data.push({
        timestamp: row._time,
        metric: row._field,
        value: row._value,
        unit: row.unit || "",
      });
    });

    // 3. **Cache the Results in Redis** (Set expiration to 60 seconds)
    await redis.set(cacheKey, JSON.stringify(data), "EX", 60);

    return NextResponse.json({ success: true, metrics: data });
  } catch (error: any) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch metrics", details: error.message },
      { status: 500 }
    );
  }
}

// ✅ **Correct Next.js 14+ Runtime Configuration**
export const runtime = "nodejs";


