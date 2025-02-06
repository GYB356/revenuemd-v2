import { Registry, collectDefaultMetrics, Counter, Histogram } from "prom-client"

const register = new Registry()

export const requestCounter = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "path", "status"],
})

export const responseTimeHistogram = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "path", "status"],
})

export function initMetrics() {
  collectDefaultMetrics({ register })
  register.registerMetric(requestCounter)
  register.registerMetric(responseTimeHistogram)
}

export { register }

