import MetricsDashboard from "@/components/MetricsDashboard"

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">RevenueMD Dashboard</h1>
        <MetricsDashboard />
      </div>
    </main>
  )
}

