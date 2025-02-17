import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ExportButtonsProps {
  type: "patients" | "claims"
}

export function ExportButtons({ type }: ExportButtonsProps) {
  const { toast } = useToast()

  const handleExport = async (format: "json" | "csv") => {
    try {
      const response = await fetch(`/api/export/${type}?format=${format}`)
      
      if (!response.ok) {
        throw new Error("Export failed")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${type}-export.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: `${type} data has been exported as ${format.toUpperCase()}`,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport("json")}
      >
        <Download className="mr-2 h-4 w-4" />
        Export JSON
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport("csv")}
      >
        <Download className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
    </div>
  )
} 