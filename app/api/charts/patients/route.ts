import { NextResponse } from 'next/server'

function generatePatientData(range: string = '7d') {
  const categories = ['New', 'Active', 'Returning']
  const currentDate = new Date()
  const data = []

  // Generate data points based on the time range
  const points = range === '24h' ? 24 : range === '7d' ? 7 : range === '30d' ? 30 : 90
  
  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(currentDate)
    date.setDate(date.getDate() - i)
    
    const dataPoint = {
      name: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      New: Math.floor(Math.random() * 50) + 10,
      Active: Math.floor(Math.random() * 200) + 800,
      Returning: Math.floor(Math.random() * 100) + 50,
    }
    
    data.push(dataPoint)
  }

  return data
}

export async function GET(request: Request) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Get the time range from query parameters
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'

    const data = generatePatientData(range)
    
    return NextResponse.json({
      data,
      success: true,
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch patient data' 
      },
      { status: 500 }
    )
  }
}