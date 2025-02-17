import { NextResponse } from 'next/server'

// Simulated data - replace with actual database queries
const generateClaimsData = () => {
  return [
    { name: 'Approved', value: Math.floor(Math.random() * 300) + 700 }, // 700-1000
    { name: 'Pending', value: Math.floor(Math.random() * 100) + 100 }, // 100-200
    { name: 'Rejected', value: Math.floor(Math.random() * 50) + 50 }, // 50-100
    { name: 'Under Review', value: Math.floor(Math.random() * 30) + 20 }, // 20-50
  ]
}

export async function GET() {
  try {
    // Add artificial delay to simulate real API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const data = generateClaimsData()
    
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch claims data' },
      { status: 500 }
    )
  }
} 