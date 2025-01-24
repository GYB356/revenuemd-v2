import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DashboardPage() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">RevenueMD Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$128,400</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Claims Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">1,284</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Processing Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">2.4 days</p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

