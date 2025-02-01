import type React from "react"

export default function MetricsLayout({
  influx,
  prometheus,
}: { influx: React.ReactNode; prometheus: React.ReactNode }) {
  return (
    <>
      {influx}
      {prometheus}
    </>
  )
}

