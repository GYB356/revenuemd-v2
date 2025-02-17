import { NextResponse } from 'next/server'

// Simulated data - replace with actual database queries
const generateRevenueData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentMonth = new Date().getMonth()
  
  return months.slice(0, currentMonth + 1).map((month) => ({
    name: month,
    value: Math.floor(Math.random() * 50000) + 30000, // Random value between 30000 and 80000
  }))
}

export async function GET() {
  try {
    // Add artificial delay to simulate real API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const data = generateRevenueData()
    
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    )
  }
} 