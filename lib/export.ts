export async function exportToJSON(data: any[]): Promise<string> {
  return JSON.stringify(data, null, 2)
}

export async function exportToCSV(data: any[]): Promise<string> {
  if (!data.length) {
    return ""
  }

  // Flatten nested objects
  const flattenedData = data.map(item => {
    const flattened: any = {}
    
    Object.entries(item).forEach(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
          if (nestedKey === "_count") {
            Object.entries(nestedValue as any).forEach(([countKey, countValue]) => {
              flattened[`${countKey}_count`] = countValue
            })
          } else {
            flattened[`${key}_${nestedKey}`] = nestedValue
          }
        })
      } else {
        flattened[key] = value
      }
    })

    return flattened
  })

  // Get headers from the first item
  const headers = Object.keys(flattenedData[0])
  
  // Convert to CSV
  const csvRows = [
    headers.join(","), // Header row
    ...flattenedData.map(row => 
      headers.map(header => {
        const value = row[header]
        // Handle values that might contain commas or quotes
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(",")
    )
  ]

  return csvRows.join("\n")
}

export function sanitizeFileName(filename: string): string {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()
}

export function getContentDisposition(filename: string, format: 'csv' | 'json'): string {
  const sanitized = sanitizeFileName(filename)
  return `attachment; filename=${sanitized}.${format}`
}