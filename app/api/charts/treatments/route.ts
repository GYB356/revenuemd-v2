import { NextResponse } from 'next/server'

function generateTreatmentData(range: string = '7d') {
  const currentDate = new Date()
  const data = []

  // Generate data points based on the time range
  const points = range === '24h' ? 24 : range === '7d' ? 7 : range === '30d' ? 30 : 90
  
  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(currentDate)
    date.setDate(date.getDate() - i)
    
    const total = 100
    const success = Math.floor(Math.random() * 20) + 70 // 70-90% success rate
    const partial = Math.floor(Math.random() * 15) + 5 // 5-20% partial success
    const failed = total - success - partial // Remaining are failures
    
    const dataPoint = {
      name: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      Success: success,
      Partial: partial,
      Failed: failed,
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

    const data = generateTreatmentData(range)
    
    return NextResponse.json({
      data,
      success: true,
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch treatment data' 
      },
      { status: 500 }
    )
  }
}